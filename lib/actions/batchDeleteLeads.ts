'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const batchDeleteLeadsSchema = z.object({
  lead_ids: z.array(z.string().uuid('Cada ID del lead debe ser un UUID válido')).min(1),
})

export async function batchDeleteLeads(
  input: z.infer<typeof batchDeleteLeadsSchema>
): Promise<{ success: boolean; deleted_count?: number; error?: string }> {
  try {
    const validated = batchDeleteLeadsSchema.parse(input)

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Eliminar múltiples leads (cascade eliminará lead_details y outbound_messages)
    const { error: deleteError, data } = await supabase
      .from('thor_leads')
      .delete()
      .in('id', validated.lead_ids)
      .eq('user_id', user.id)
      .select()

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true, deleted_count: data?.length || validated.lead_ids.length }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos inválidos' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

