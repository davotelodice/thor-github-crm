'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { z } from 'zod'
import { toast } from 'sonner'
import { requestScrape } from '@/lib/actions/scrape'

const searchSchema = z.object({
  keyword: z.string().min(1, 'La palabra clave es requerida'),
  location: z.string().min(1, 'La ubicación es requerida'),
  limit: z.number().min(1).max(15).default(15),
})

export default function SearchBar() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [limit, setLimit] = useState(15)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const validated = searchSchema.parse({
        keyword,
        location,
        limit,
      })

      // Llamar a server action requestScrape
      const result = await requestScrape({
        keyword: validated.keyword,
        location: validated.location,
        limit: validated.limit,
      })

      if (result.success) {
        toast.success('Búsqueda iniciada', {
          description: `Buscando "${validated.keyword}" en ${validated.location}`,
        })

        // Reset form
        setKeyword('')
        setLocation('')
        setLimit(15)
      } else {
        toast.error('Error al iniciar búsqueda', {
          description: result.error || 'Ocurrió un error desconocido',
        })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Error de validación', {
          description: error.issues[0]?.message || 'Datos inválidos',
        })
      } else {
        toast.error('Error', {
          description: 'Ocurrió un error al procesar la búsqueda',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Leads</CardTitle>
        <CardDescription>
          Ingresa una palabra clave y ubicación para buscar leads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Palabra Clave</Label>
              <Input
                id="keyword"
                placeholder="abogados migratorios, dentistas…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Pontevedra, A Coruña, Madrid…"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Límite (máx 15)</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                max={15}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={loading}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

