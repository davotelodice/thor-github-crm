'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/lib/types'

export function useRealtimeLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Obtener leads iniciales
    const fetchLeads = async () => {
      try {
        setError(null)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Error de autenticación:', authError)
          setError(`Error de autenticación: ${authError.message}`)
          setLoading(false)
          return
        }

        if (!user) {
          console.warn('Usuario no autenticado')
          setError('No estás autenticado. Por favor, inicia sesión.')
          setLoading(false)
          return
        }

        console.log('Buscando leads para usuario:', user.id)

        const { data, error: queryError } = await supabase
          .from('thor_leads')
          .select('id, user_id, search_string, title, category_name, address, phone, website, status, run_id, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (queryError) {
          console.error('Error fetching leads:', queryError)
          setError(`Error al cargar leads: ${queryError.message} (Código: ${queryError.code || 'desconocido'})`)
          setLeads([])
        } else {
          console.log(`Leads encontrados: ${data?.length || 0}`)
          // Mapear datos de DB a UI
          const mappedLeads = (data || []).map((lead) => ({
            id: lead.id,
            user_id: lead.user_id,
            searchString: lead.search_string,
            title: lead.title,
            categoryName: lead.category_name,
            address: lead.address,
            phone: lead.phone,
            website: lead.website,
            status: lead.status,
            run_id: lead.run_id,
            created_at: lead.created_at,
            updated_at: lead.updated_at,
          }))
          setLeads(mappedLeads)
          setError(null)
        }
      } catch (err) {
        console.error('Error inesperado al obtener leads:', err)
        setError(`Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`)
        setLeads([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()

    // Configurar suscripción después de obtener el usuario
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Suscripción a cambios en tiempo real
      const channel = supabase
        .channel('thor_leads_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'thor_leads',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newLead = payload.new as any
              setLeads((prev) => [{
                id: newLead.id,
                user_id: newLead.user_id,
                searchString: newLead.search_string,
                title: newLead.title,
                categoryName: newLead.category_name,
                address: newLead.address,
                phone: newLead.phone,
                website: newLead.website,
                status: newLead.status,
                run_id: newLead.run_id,
                created_at: newLead.created_at,
                updated_at: newLead.updated_at,
              }, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              const updatedLead = payload.new as any
              setLeads((prev) =>
                prev.map((lead) =>
                  lead.id === updatedLead.id ? {
                    id: updatedLead.id,
                    user_id: updatedLead.user_id,
                    searchString: updatedLead.search_string,
                    title: updatedLead.title,
                    categoryName: updatedLead.category_name,
                    address: updatedLead.address,
                    phone: updatedLead.phone,
                    website: updatedLead.website,
                    status: updatedLead.status,
                    run_id: updatedLead.run_id,
                    created_at: updatedLead.created_at,
                    updated_at: updatedLead.updated_at,
                  } : lead
                )
              )
            } else if (payload.eventType === 'DELETE') {
              setLeads((prev) => prev.filter((lead) => lead.id !== payload.old.id))
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

  return { leads, loading, error }
}

