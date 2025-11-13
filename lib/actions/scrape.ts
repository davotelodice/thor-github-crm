'use server'

import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server'
import { postToScrapeWebhook } from '@/lib/n8n/client'
import { logger } from '@/lib/logger'
import { AuthenticationError, ValidationError, NetworkError } from '@/lib/errors'
import type { ScrapeRequestPayload } from '@/lib/types'

const scrapeRequestSchema = z.object({
  keyword: z.string().min(1, 'La palabra clave es requerida'),
  location: z.string().min(1, 'La ubicación es requerida'),
  limit: z.number().min(1).max(15).default(15),
})

export async function requestScrape(
  input: ScrapeRequestPayload
): Promise<{ success: boolean; run_id?: string; error?: string }> {
  try {
    // Validar input
    const validated = scrapeRequestSchema.parse(input)

    // Obtener usuario de sesión
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Intento de scrape sin autenticación')
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    // Generar run_id
    const run_id = uuidv4()

    logger.info('Iniciando scrape request', {
      user_id: user.id,
      keyword: validated.keyword,
      location: validated.location,
      limit: validated.limit,
      run_id,
    })

    // POST a webhook n8n
    // Esperamos hasta 5 segundos para detectar errores inmediatos (URL incorrecta, red, etc.)
    // Si la conexión se establece correctamente, dejamos que continúe en background
    const webhookPromise = postToScrapeWebhook({
      run_id,
      user_id: user.id,
      keyword: validated.keyword,
      location: validated.location,
      limit: validated.limit,
    })

    // Crear un timeout para detectar errores inmediatos
    let timeoutId: NodeJS.Timeout
    const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve({ success: false, error: 'Timeout: El webhook no respondió en 5 segundos' })
      }, 5000)
    })

    try {
      const result = await Promise.race([webhookPromise, timeoutPromise])

      // Limpiar timeout si la promesa se resolvió antes
      clearTimeout(timeoutId!)

      // Si hay un error inmediato (dentro de 5 segundos), lo reportamos
      if (!result.success) {
        logger.error('Error inmediato al comunicarse con webhook de scrape', undefined, {
          run_id,
          user_id: user.id,
          error: result.error,
        })
        return {
          success: false,
          error: result.error || 'Error al comunicarse con n8n',
        }
      }

      // Si llegamos aquí, la conexión se estableció correctamente
      logger.info('Scrape request enviado correctamente (continúa en background)', {
        run_id,
        user_id: user.id,
      })

      return {
        success: true,
        run_id,
      }
    } catch (error) {
      // Limpiar timeout en caso de error
      clearTimeout(timeoutId!)

      // Si hay un error de red inmediato, lo reportamos
      logger.error('Error de red al comunicarse con webhook de scrape', error instanceof Error ? error : new Error(String(error)), {
        run_id,
        user_id: user.id,
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al comunicarse con n8n',
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validación fallida en scrape request', {
        issues: error.issues,
      })
      return {
        success: false,
        error: error.issues[0]?.message || 'Datos inválidos',
      }
    }

    logger.error('Error en requestScrape', error instanceof Error ? error : new Error(String(error)))
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

