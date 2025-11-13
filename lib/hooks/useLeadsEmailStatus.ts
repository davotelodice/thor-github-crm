'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook para obtener un mapa de lead_id -> tieneEmail
 * Optimizado para mostrar indicadores en la tabla sin cargar todos los detalles
 */
export function useLeadsEmailStatus() {
  const [emailStatusMap, setEmailStatusMap] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchEmailStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Obtener solo lead_id y emails de todos los lead_details del usuario
      const { data, error } = await supabase
        .from('thor_lead_details')
        .select('lead_id, emails')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching email status:', error)
        setLoading(false)
        return
      }

      // Crear mapa: lead_id -> tieneEmail (true si tiene emails válidos, false si no)
      const statusMap = new Map<string, boolean>()
      if (data) {
        data.forEach((detail) => {
          // Filtrar emails válidos (excluir "None", null, strings vacíos)
          const validEmails = Array.isArray(detail.emails)
            ? detail.emails.filter(
                (email: unknown) =>
                  email &&
                  typeof email === 'string' &&
                  email.trim() !== '' &&
                  email.toLowerCase() !== 'none' &&
                  email.includes('@')
              )
            : []
          const hasEmail = validEmails.length > 0
          statusMap.set(detail.lead_id, hasEmail)
        })
      }
      setEmailStatusMap(statusMap)
      setLoading(false)
    }

    fetchEmailStatus()

    // Configurar suscripción después de obtener el usuario
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Suscripción a cambios en tiempo real en thor_lead_details
      const channel = supabase
        .channel('thor_lead_details_email_status')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'thor_lead_details',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const detail = payload.new as any
              // Filtrar emails válidos (excluir "None", null, strings vacíos)
              const validEmails = Array.isArray(detail.emails)
                ? detail.emails.filter(
                    (email: unknown) =>
                      email &&
                      typeof email === 'string' &&
                      email.trim() !== '' &&
                      email.toLowerCase() !== 'none' &&
                      email.includes('@')
                  )
                : []
              const hasEmail = validEmails.length > 0
              setEmailStatusMap((prev) => {
                const newMap = new Map(prev)
                newMap.set(detail.lead_id, hasEmail)
                return newMap
              })
            } else if (payload.eventType === 'DELETE') {
              setEmailStatusMap((prev) => {
                const newMap = new Map(prev)
                newMap.delete((payload.old as any).lead_id)
                return newMap
              })
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    let cleanup: (() => void) | undefined

    setupSubscription().then((cleanupFn) => {
      cleanup = cleanupFn
    })

    return () => {
      cleanup?.()
    }
  }, [])

  return { emailStatusMap, loading }
}

