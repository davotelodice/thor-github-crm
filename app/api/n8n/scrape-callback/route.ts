import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { ScrapeCallbackPayload } from '@/lib/types'

const callbackSchema = z.object({
  run_id: z.string().uuid('run_id debe ser un UUID válido'),
  status: z.enum(['completed', 'error']),
  error: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeCallbackPayload = await request.json()

    // Validar payload
    const validated = callbackSchema.parse(body)

    logger.info('Scrape callback recibido', {
      run_id: validated.run_id,
      status: validated.status,
    })

    // Obtener cliente Supabase
    const supabase = await createClient()

    // Actualizar status de leads según run_id
    const newStatus = validated.status === 'completed' ? 'completado' : 'error'

    const { error: updateError, data } = await supabase
      .from('thor_leads')
      .update({ status: newStatus })
      .eq('run_id', validated.run_id)
      .select('id')

    if (updateError) {
      logger.error('Error actualizando leads en scrape callback', updateError, {
        run_id: validated.run_id,
        status: validated.status,
      })
      return NextResponse.json(
        { error: 'Error al actualizar leads' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      logger.warn('No se encontraron leads para el run_id', {
        run_id: validated.run_id,
      })
      // No retornar error, puede ser que el run_id no tenga leads asociados
    } else {
      logger.info('Leads actualizados correctamente', {
        run_id: validated.run_id,
        leads_count: data.length,
        new_status: newStatus,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Payload inválido en scrape callback', {
        issues: error.issues,
      })
      return NextResponse.json(
        { error: 'Payload inválido', details: error.issues },
        { status: 400 }
      )
    }

    logger.error('Error en scrape-callback', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

