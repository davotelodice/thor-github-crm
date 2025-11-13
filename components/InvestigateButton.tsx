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
import { investigateLead } from '@/lib/actions/investigate'

interface InvestigateButtonProps {
  leadId: string
  disabled?: boolean
}

export default function InvestigateButton({ leadId, disabled }: InvestigateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleInvestigate = async () => {
    setLoading(true)
    try {
      toast.info('Investigación iniciada', {
        description: 'El informe se generará en breve...',
      })

      const result = await investigateLead({ lead_id: leadId })

      if (result.success) {
        toast.success('Investigación completada', {
          description: 'El informe está disponible en los detalles del lead',
        })
      } else {
        toast.error('Error al investigar', {
          description: result.error || 'No se pudo generar el informe',
        })
      }
    } catch (error) {
      toast.error('Error al investigar', {
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
            onClick={handleInvestigate}
            disabled={disabled || loading}
          >
            {loading ? 'Investigando...' : 'Investigar'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Genera un informe detallado del lead usando IA</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

