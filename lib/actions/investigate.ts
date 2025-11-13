'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateInvestigationReport } from '@/lib/llm/investigate'
import { logger } from '@/lib/logger'
import type { InvestigatePayload, InformeJSON } from '@/lib/types'

const investigateSchema = z.object({
  lead_id: z.string().uuid('lead_id debe ser un UUID válido'),
})

export async function investigateLead(
  input: InvestigatePayload
): Promise<{ success: boolean; informe?: InformeJSON; error?: string }> {
  try {
    // Validar input
    const validated = investigateSchema.parse(input)

    // Obtener usuario de sesión
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

    // Leer lead y lead_details (solo campos necesarios)
    const { data: lead, error: leadError } = await supabase
      .from('thor_leads')
      .select('id, title, website')
      .eq('id', validated.lead_id)
      .eq('user_id', user.id)
      .single()

    if (leadError || !lead) {
      return {
        success: false,
        error: 'Lead no encontrado',
      }
    }

    const { data: leadDetail, error: detailError } = await supabase
      .from('thor_lead_details')
      .select('id, emails, linkedin, facebook, instagram, twitter')
      .eq('lead_id', validated.lead_id)
      .eq('user_id', user.id)
      .single()

    // Si no existe lead_detail, crear uno básico
    let detailId: string
    if (detailError || !leadDetail) {
      const { data: newDetail, error: createError } = await supabase
        .from('thor_lead_details')
        .insert({
          user_id: user.id,
          lead_id: validated.lead_id,
          client_name: lead.title,
          website: lead.website,
          emails: [],
        })
        .select('id')
        .single()

      if (createError || !newDetail) {
        return {
          success: false,
          error: 'Error al crear detalles del lead',
        }
      }
      detailId = newDetail.id
    } else {
      detailId = leadDetail.id
    }

    // Preparar datos para LLM
    const llmData = {
      nombre: lead.title,
      website: lead.website,
      emails: leadDetail?.emails || [],
      linkedin: leadDetail?.linkedin || null,
      facebook: leadDetail?.facebook || null,
      instagram: leadDetail?.instagram || null,
      twitter: leadDetail?.twitter || null,
    }

    // Generar informe con LLM
    logger.info('Iniciando investigación con LLM', {
      user_id: user.id,
      lead_id: validated.lead_id,
      website: lead.website,
    })

    let informe: InformeJSON
    try {
      informe = await generateInvestigationReport(llmData)
      logger.info('Investigación completada exitosamente', {
        user_id: user.id,
        lead_id: validated.lead_id,
      })
    } catch (llmError) {
      logger.error('Error en LLM durante investigación', llmError instanceof Error ? llmError : new Error(String(llmError)), {
        user_id: user.id,
        lead_id: validated.lead_id,
        website: lead.website,
      })
      return {
        success: false,
        error: llmError instanceof Error ? llmError.message : 'Error al generar informe con IA',
      }
    }

    // Guardar informe en lead_details
    const { error: updateDetailError } = await supabase
      .from('thor_lead_details')
      .update({ informe })
      .eq('id', detailId)

    if (updateDetailError) {
      return {
        success: false,
        error: 'Error al guardar informe',
      }
    }

    // Actualizar status del lead a 'investigado'
    const { error: updateLeadError } = await supabase
      .from('thor_leads')
      .update({ status: 'investigado' })
      .eq('id', validated.lead_id)

    if (updateLeadError) {
      return {
        success: false,
        error: 'Error al actualizar status del lead',
      }
    }

    return {
      success: true,
      informe,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Datos inválidos',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

