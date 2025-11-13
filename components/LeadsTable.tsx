'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtimeLeads } from '@/lib/hooks/useRealtimeLeads'
import { useLeadsEmailStatus } from '@/lib/hooks/useLeadsEmailStatus'
import { batchDeleteLeads } from '@/lib/actions/batchDeleteLeads'
import { toast } from 'sonner'
import type { Lead } from '@/lib/types'
import LeadDetailsSheet from './LeadDetailsSheet'
import InvestigateButton from './InvestigateButton'
import SendEmailButton from './SendEmailButton'

const statusColors: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-800',
  en_progreso: 'bg-yellow-100 text-yellow-800',
  completado: 'bg-green-100 text-green-800',
  investigado: 'bg-purple-100 text-purple-800',
  email_enviado: 'bg-indigo-100 text-indigo-800',
  respuesta_recibida: 'bg-emerald-100 text-emerald-800',
  error: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  nuevo: 'Nuevo',
  en_progreso: 'En Progreso',
  completado: 'Completado',
  investigado: 'Investigado',
  email_enviado: 'Email Enviado',
  respuesta_recibida: 'Respuesta Recibida',
  error: 'Error',
}

export default function LeadsTable() {
  const { leads, loading, error } = useRealtimeLeads()
  const { emailStatusMap } = useLeadsEmailStatus()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(leads.map((lead) => lead.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectLead = (leadId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(leadId)
    } else {
      newSelected.delete(leadId)
    }
    setSelectedIds(newSelected)
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No hay leads seleccionados')
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.size} lead(s)?`)) {
      return
    }

    setDeleting(true)
    try {
      const result = await batchDeleteLeads({
        lead_ids: Array.from(selectedIds),
      })

      if (result.success) {
        toast.success(`${result.deleted_count || selectedIds.size} lead(s) eliminado(s) correctamente`)
        setSelectedIds(new Set())
      } else {
        toast.error('Error al eliminar leads', { description: result.error })
      }
    } catch (error) {
      toast.error('Error al eliminar leads')
    } finally {
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar leads</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="text-sm text-red-600 space-y-1">
          <p>Posibles causas:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Problema de autenticación - intenta cerrar sesión y volver a iniciar</li>
            <li>Problema de conexión con Supabase - verifica las variables de entorno</li>
            <li>Políticas RLS bloqueando el acceso - verifica las políticas en Supabase</li>
          </ul>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="mt-4"
        >
          Recargar página
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>Búsqueda</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-3 w-3 rounded-full mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
        <p className="text-muted-foreground mb-4">No hay leads disponibles</p>
        <p className="text-sm text-muted-foreground">
          Realiza una búsqueda para comenzar
        </p>
      </div>
    )
  }

  const allSelected = leads.length > 0 && selectedIds.size === leads.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < leads.length

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedIds.size} lead(s) seleccionado(s)
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : `Eliminar ${selectedIds.size} seleccionado(s)`}
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead>Búsqueda</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(lead.id)}
                    onCheckedChange={(checked) =>
                      handleSelectLead(lead.id, checked as boolean)
                    }
                    aria-label={`Seleccionar lead ${lead.title || lead.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {lead.searchString}
                </TableCell>
                <TableCell>{lead.title || '-'}</TableCell>
                <TableCell>{lead.categoryName || '-'}</TableCell>
                <TableCell>{lead.address || '-'}</TableCell>
                <TableCell>{lead.phone || '-'}</TableCell>
                <TableCell>
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {lead.website}
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const hasEmail = emailStatusMap.get(lead.id) ?? false
                    return (
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            hasEmail ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          title={hasEmail ? 'Tiene email' : 'No tiene email'}
                        />
                      </div>
                    )
                  })()}
                </TableCell>
                <TableCell>
                  <Badge
                    className={statusColors[lead.status] || 'bg-gray-100 text-gray-800'}
                  >
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(lead)}
                    >
                      Ver datos
                    </Button>
                    <InvestigateButton
                      leadId={lead.id}
                    />
                    <SendEmailButton leadId={lead.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLead && (
        <LeadDetailsSheet
          lead={selectedLead}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
        />
      )}
    </>
  )
}
