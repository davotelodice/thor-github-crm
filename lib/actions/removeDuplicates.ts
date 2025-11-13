'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Encuentra y elimina leads duplicados basándose en user_id + website normalizado
 * Mantiene el lead más reciente de cada grupo de duplicados
 */
export async function removeDuplicateLeads(): Promise<{
  success: boolean
  duplicates_found?: number
  duplicates_removed?: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    logger.info('Iniciando eliminación de leads duplicados', {
      user_id: user.id,
    })

    // Obtener todos los leads del usuario ordenados por fecha (más reciente primero)
    const { data: leads, error: leadsError } = await supabase
      .from('thor_leads')
      .select('id, website, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (leadsError || !leads) {
      return {
        success: false,
        error: 'Error al obtener leads',
      }
    }

    // Normalizar websites y agrupar duplicados
    const normalizedMap = new Map<string, string[]>()
    leads.forEach((lead) => {
      const normalized = normalizeWebsite(lead.website)
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, [])
      }
      normalizedMap.get(normalized)!.push(lead.id)
    })

    // Encontrar grupos con más de un lead
    const duplicateGroups: string[][] = []
    normalizedMap.forEach((leadIds) => {
      if (leadIds.length > 1) {
        duplicateGroups.push(leadIds)
      }
    })

    if (duplicateGroups.length === 0) {
      return {
        success: true,
        duplicates_found: 0,
        duplicates_removed: 0,
      }
    }

    // Mantener el más reciente (primero en el array porque está ordenado por created_at DESC)
    // Eliminar los demás
    let removed = 0
    const idsToRemove: string[] = []

    for (const group of duplicateGroups) {
      const toKeep = group[0] // El más reciente
      const toRemove = group.slice(1) // Los demás
      idsToRemove.push(...toRemove)
    }

    if (idsToRemove.length > 0) {
      // Eliminar también los lead_details asociados
      const { error: deleteDetailsError } = await supabase
        .from('thor_lead_details')
        .delete()
        .in('lead_id', idsToRemove)
        .eq('user_id', user.id)

      if (deleteDetailsError) {
        logger.warn('Error eliminando lead_details de duplicados', {
          error: deleteDetailsError.message,
          code: deleteDetailsError.code,
        })
      }

      // Eliminar los leads duplicados
      const { error: deleteError } = await supabase
        .from('thor_leads')
        .delete()
        .in('id', idsToRemove)
        .eq('user_id', user.id)

      if (deleteError) {
        logger.error('Error eliminando leads duplicados', deleteError)
        return {
          success: false,
          error: 'Error al eliminar duplicados',
        }
      }

      removed = idsToRemove.length
    }

    const totalFound = duplicateGroups.reduce((sum, g) => sum + g.length, 0)

    logger.info('Duplicados eliminados', {
      user_id: user.id,
      duplicates_found: totalFound,
      duplicates_removed: removed,
    })

    return {
      success: true,
      duplicates_found: totalFound,
      duplicates_removed: removed,
    }
  } catch (error) {
    logger.error('Error en removeDuplicateLeads', error instanceof Error ? error : new Error(String(error)))
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Normaliza un website para comparación:
 * - Convierte a minúsculas
 * - Quita http:// o https://
 * - Quita trailing slash
 * - Quita www.
 */
function normalizeWebsite(website: string | null): string {
  if (!website) return ''
  return website
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim()
}

