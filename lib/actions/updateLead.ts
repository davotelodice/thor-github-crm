'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const updateLeadSchema = z.object({
  lead_id: z.string().uuid('El ID del lead debe ser un UUID válido'),
  title: z.string().nullable().optional(),
  category_name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().optional(),
  status: z.enum(['nuevo', 'en_progreso', 'completado', 'investigado', 'email_enviado', 'respuesta_recibida', 'error']).optional(),
})

export async function updateLead(
  input: z.infer<typeof updateLeadSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = updateLeadSchema.parse(input)

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Preparar datos para actualizar (solo campos presentes)
    const updateData: Record<string, any> = {}
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.category_name !== undefined) updateData.category_name = validated.category_name
    if (validated.address !== undefined) updateData.address = validated.address
    if (validated.phone !== undefined) updateData.phone = validated.phone
    if (validated.website !== undefined) updateData.website = validated.website
    if (validated.status !== undefined) updateData.status = validated.status

    const { error: updateError } = await supabase
      .from('thor_leads')
      .update(updateData)
      .eq('id', validated.lead_id)
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos inválidos' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

