'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

/**
 * Cierra la sesión del usuario y redirige al sign-in
 */
export async function logout(): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      logger.info('Cerrando sesión', { user_id: user.id })
      await supabase.auth.signOut()
    }

    redirect('/sign-in')
  } catch (error) {
    logger.error('Error al cerrar sesión', error instanceof Error ? error : new Error(String(error)))
    // Redirigir de todas formas
    redirect('/sign-in')
  }
}


