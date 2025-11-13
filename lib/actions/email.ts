'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { postToEmailWebhook } from '@/lib/n8n/client'
import type { EmailRequestPayload } from '@/lib/types'

const emailRequestSchema = z.object({
  lead_id: z.string().uuid('lead_id debe ser un UUID válido'),
})

export async function requestEmail(
  input: EmailRequestPayload
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  try {
    // Validar input
    const validated = emailRequestSchema.parse(input)

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
      .select('id, emails, client_name, website, informe, linkedin, facebook, instagram, twitter')
      .eq('lead_id', validated.lead_id)
      .eq('user_id', user.id)
      .single()

    if (detailError || !leadDetail) {
      return {
        success: false,
        error: 'Detalles del lead no encontrados',
      }
    }

    // Verificar que tiene email
    if (!leadDetail.emails || leadDetail.emails.length === 0) {
      return {
        success: false,
        error: 'El lead no tiene email disponible',
      }
    }

    // Preparar payload para n8n
    const emailPayload = {
      user_id: user.id,
      lead_id: validated.lead_id,
      to: leadDetail.emails[0], // Usar primer email
      nombre: leadDetail.client_name || lead.title || 'Cliente',
      website: leadDetail.website || lead.website,
      informe: leadDetail.informe || null,
      website_rrss: {
        linkedin: leadDetail.linkedin || null,
        facebook: leadDetail.facebook || null,
        instagram: leadDetail.instagram || null,
        twitter: leadDetail.twitter || null,
      },
    }

    // POST a webhook n8n
    const webhookResult = await postToEmailWebhook(emailPayload)

    if (!webhookResult.success) {
      return {
        success: false,
        error: webhookResult.error || 'Error al comunicarse con n8n',
      }
    }

    // Crear fila en thor_outbound_messages
    const { data: message, error: messageError } = await supabase
      .from('thor_outbound_messages')
      .insert({
        user_id: user.id,
        lead_id: validated.lead_id,
        channel: 'email',
        subject: null, // n8n lo generará
        body: null, // n8n lo generará
        n8n_run_id: webhookResult.n8n_run_id || null,
        status: 'enviado',
      })
      .select('id')
      .single()

    if (messageError || !message) {
      return {
        success: false,
        error: 'Error al crear registro de mensaje',
      }
    }

    // Actualizar status del lead a 'email_enviado' (opcional según especificación)
    await supabase
      .from('thor_leads')
      .update({ status: 'email_enviado' })
      .eq('id', validated.lead_id)

    return {
      success: true,
      message_id: message.id,
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

