'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { requestEmail } from '@/lib/actions/email'

interface SendEmailButtonProps {
  leadId: string
  disabled?: boolean
}

export default function SendEmailButton({ leadId, disabled }: SendEmailButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSendEmail = async () => {
    // Confirmación antes de enviar
    if (!confirm('¿Estás seguro de que quieres enviar un email a este lead?')) {
      return
    }

    setLoading(true)
    try {
      toast.info('Enviando mensaje', {
        description: 'El email se está enviando...',
      })

      const result = await requestEmail({ lead_id: leadId })

      if (result.success) {
        toast.success('Mensaje enviado', {
          description: 'El email ha sido enviado correctamente',
        })
      } else {
        toast.error('Error al enviar mensaje', {
          description: result.error || 'No se pudo enviar el email',
        })
      }
    } catch (error) {
      toast.error('Error al enviar mensaje', {
        description: 'Ocurrió un error inesperado',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={disabled || loading}
          >
            {loading ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Envía un email personalizado al lead</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

