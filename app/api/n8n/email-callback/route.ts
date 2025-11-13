import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { EmailCallbackPayload } from '@/lib/types'

const callbackSchema = z.object({
  n8n_run_id: z.string().min(1, 'n8n_run_id es requerido'),
  lead_id: z.string().uuid('lead_id debe ser un UUID válido'),
  status: z.enum(['entregado', 'respondido', 'fallo']),
  provider_message_id: z.string().optional(),
  response_text: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body: EmailCallbackPayload = await request.json()

    // Validar payload
    const validated = callbackSchema.parse(body)

    logger.info('Email callback recibido', {
      n8n_run_id: validated.n8n_run_id,
      lead_id: validated.lead_id,
      status: validated.status,
    })

    // Obtener cliente Supabase
    const supabase = await createClient()

    // Actualizar thor_outbound_messages
    const updateData: {
      status: string
      provider_message_id?: string
      meta?: Record<string, any>
    } = {
      status: validated.status,
    }

    if (validated.provider_message_id) {
      updateData.provider_message_id = validated.provider_message_id
    }

    if (validated.response_text) {
      updateData.meta = { response_text: validated.response_text }
    }

    const { error: updateMessageError, data: messageData } = await supabase
      .from('thor_outbound_messages')
      .update(updateData)
      .eq('n8n_run_id', validated.n8n_run_id)
      .select('id')

    if (updateMessageError) {
      logger.error('Error actualizando mensaje en email callback', updateMessageError, {
        n8n_run_id: validated.n8n_run_id,
        lead_id: validated.lead_id,
      })
      return NextResponse.json(
        { error: 'Error al actualizar mensaje' },
        { status: 500 }
      )
    }

    if (!messageData || messageData.length === 0) {
      logger.warn('No se encontró mensaje para el n8n_run_id', {
        n8n_run_id: validated.n8n_run_id,
      })
    } else {
      logger.info('Mensaje actualizado correctamente', {
        n8n_run_id: validated.n8n_run_id,
        message_id: messageData[0].id,
        status: validated.status,
      })
    }

    // Si status es 'respondido', actualizar lead
    if (validated.status === 'respondido') {
      const { error: updateLeadError } = await supabase
        .from('thor_leads')
        .update({ status: 'respuesta_recibida' })
        .eq('id', validated.lead_id)

      if (updateLeadError) {
        logger.error('Error actualizando lead a respuesta_recibida', updateLeadError, {
          lead_id: validated.lead_id,
        })
        // No retornar error aquí, el mensaje ya se actualizó
      } else {
        logger.info('Lead actualizado a respuesta_recibida', {
          lead_id: validated.lead_id,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Payload inválido en email callback', {
        issues: error.issues,
      })
      return NextResponse.json(
        { error: 'Payload inválido', details: error.issues },
        { status: 400 }
      )
    }

    logger.error('Error en email-callback', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

