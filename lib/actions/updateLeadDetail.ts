'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { InformeJSON } from '@/lib/types'

const updateLeadDetailSchema = z.object({
  lead_id: z.string().uuid('El ID del lead debe ser un UUID válido'),
  client_name: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  emails: z.array(z.string()).optional(),
  linkedin: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  twitter: z.string().nullable().optional(),
  informe: z.custom<InformeJSON>().nullable().optional(),
})

export async function updateLeadDetail(
  input: z.infer<typeof updateLeadDetailSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = updateLeadDetailSchema.parse(input)

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Preparar datos para actualizar
    const updateData: Record<string, any> = {}
    if (validated.client_name !== undefined) updateData.client_name = validated.client_name
    if (validated.website !== undefined) updateData.website = validated.website
    if (validated.emails !== undefined) updateData.emails = validated.emails
    if (validated.linkedin !== undefined) updateData.linkedin = validated.linkedin
    if (validated.facebook !== undefined) updateData.facebook = validated.facebook
    if (validated.instagram !== undefined) updateData.instagram = validated.instagram
    if (validated.twitter !== undefined) updateData.twitter = validated.twitter
    if (validated.informe !== undefined) updateData.informe = validated.informe

    const { error: updateError } = await supabase
      .from('thor_lead_details')
      .update(updateData)
      .eq('lead_id', validated.lead_id)
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

