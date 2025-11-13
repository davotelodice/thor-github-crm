import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si está autenticado, redirigir al dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Si no está autenticado, redirigir al sign-in
  redirect('/sign-in')
}
