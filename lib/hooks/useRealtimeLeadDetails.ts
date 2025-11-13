'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LeadDetail } from '@/lib/types'

export function useRealtimeLeadDetails(leadId: string | null) {
  const [leadDetail, setLeadDetail] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leadId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Obtener detalles iniciales
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('thor_lead_details')
        .select('id, user_id, lead_id, client_name, website, emails, linkedin, facebook, instagram, twitter, informe, created_at, updated_at')
        .eq('lead_id', leadId)
        .single()

      if (error) {
        console.error('Error fetching lead details:', error)
      } else if (data) {
        // Mapear datos de DB a UI
        setLeadDetail({
          id: data.id,
          user_id: data.user_id,
          lead_id: data.lead_id,
          clientName: data.client_name,
          website: data.website,
          emails: data.emails || [],
          linkedin: data.linkedin,
          facebook: data.facebook,
          instagram: data.instagram,
          twitter: data.twitter,
          informe: data.informe,
          created_at: data.created_at,
          updated_at: data.updated_at,
        })
      }
      setLoading(false)
    }

    fetchDetails()

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel(`thor_lead_details_${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thor_lead_details',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const detail = payload.new as any
            setLeadDetail({
              id: detail.id,
              user_id: detail.user_id,
              lead_id: detail.lead_id,
              clientName: detail.client_name,
              website: detail.website,
              emails: detail.emails || [],
              linkedin: detail.linkedin,
              facebook: detail.facebook,
              instagram: detail.instagram,
              twitter: detail.twitter,
              informe: detail.informe,
              created_at: detail.created_at,
              updated_at: detail.updated_at,
            })
          } else if (payload.eventType === 'DELETE') {
            setLeadDetail(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId])

  return { leadDetail, loading }
}

