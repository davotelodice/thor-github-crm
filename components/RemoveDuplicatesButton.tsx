'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { removeDuplicateLeads } from '@/lib/actions/removeDuplicates'
import { toast } from 'sonner'

export default function RemoveDuplicatesButton() {
  const [loading, setLoading] = useState(false)

  const handleRemoveDuplicates = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar los leads duplicados? Se mantendrá el más reciente de cada grupo.')) {
      return
    }

    setLoading(true)
    try {
      const result = await removeDuplicateLeads()

      if (result.success) {
        if (result.duplicates_removed && result.duplicates_removed > 0) {
          toast.success(
            `${result.duplicates_removed} lead(s) duplicado(s) eliminado(s)`,
            {
              description: `Se encontraron ${result.duplicates_found} duplicados. Se mantuvo el más reciente de cada grupo.`,
            }
          )
        } else {
          toast.info('No se encontraron leads duplicados')
        }
      } else {
        toast.error('Error al eliminar duplicados', {
          description: result.error,
        })
      }
    } catch (error) {
      toast.error('Error al eliminar duplicados')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleRemoveDuplicates}
      disabled={loading}
      variant="outline"
      className="mb-4"
    >
      {loading ? 'Eliminando...' : 'Eliminar Leads Duplicados'}
    </Button>
  )
}



