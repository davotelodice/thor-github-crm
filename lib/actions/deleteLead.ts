'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const deleteLeadSchema = z.object({
  lead_id: z.string().uuid('El ID del lead debe ser un UUID válido'),
})

export async function deleteLead(
  input: z.infer<typeof deleteLeadSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = deleteLeadSchema.parse(input)

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Eliminar lead (cascade eliminará lead_details y outbound_messages)
    const { error: deleteError } = await supabase
      .from('thor_leads')
      .delete()
      .eq('id', validated.lead_id)
      .eq('user_id', user.id)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos inválidos' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

