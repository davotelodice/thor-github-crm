'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtimeLeadDetails } from '@/lib/hooks/useRealtimeLeadDetails'
import { updateLead } from '@/lib/actions/updateLead'
import { updateLeadDetail } from '@/lib/actions/updateLeadDetail'
import { deleteLead } from '@/lib/actions/deleteLead'
import { toast } from 'sonner'
import {
  Edit2,
  Save,
  X,
  Trash2,
  Mail,
  Globe,
  Phone,
  MapPin,
  Building2,
  Link as LinkIcon,
  FileText,
  User,
  ExternalLink,
  Check,
} from 'lucide-react'
import type { Lead, LeadDetail, InformeJSON } from '@/lib/types'

interface LeadDetailsSheetProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LeadDetailsSheet({
  lead,
  open,
  onOpenChange,
}: LeadDetailsSheetProps) {
  const { leadDetail, loading } = useRealtimeLeadDetails(lead.id)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isInformeModalOpen, setIsInformeModalOpen] = useState(false)
  const [isEditingInforme, setIsEditingInforme] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estados para edición de lead
  const [editLead, setEditLead] = useState({
    title: lead.title || '',
    category_name: lead.categoryName || '',
    address: lead.address || '',
    phone: lead.phone || '',
    website: lead.website || '',
    status: lead.status,
  })

  // Estados para edición de lead detail
  const [editDetail, setEditDetail] = useState({
    client_name: '',
    website: '',
    emails: [] as string[],
    linkedin: '',
    facebook: '',
    instagram: '',
    twitter: '',
  })

  // Estados para edición de informe
  const [editInforme, setEditInforme] = useState<InformeJSON | null>(null)

  // Actualizar estados cuando cambian los datos
  useEffect(() => {
    if (lead) {
      setEditLead({
        title: lead.title || '',
        category_name: lead.categoryName || '',
        address: lead.address || '',
        phone: lead.phone || '',
        website: lead.website || '',
        status: lead.status,
      })
    }
  }, [lead])

  useEffect(() => {
    if (leadDetail) {
      setEditDetail({
        client_name: leadDetail.clientName || '',
        website: leadDetail.website || '',
        emails: leadDetail.emails || [],
        linkedin: leadDetail.linkedin || '',
        facebook: leadDetail.facebook || '',
        instagram: leadDetail.instagram || '',
        twitter: leadDetail.twitter || '',
      })
      if (leadDetail.informe) {
        setEditInforme(leadDetail.informe)
      }
    }
  }, [leadDetail])

  const handleSaveLead = async () => {
    setSaving(true)
    try {
      const result = await updateLead({
        lead_id: lead.id,
        title: editLead.title || null,
        category_name: editLead.category_name || null,
        address: editLead.address || null,
        phone: editLead.phone || null,
        website: editLead.website,
        status: editLead.status,
      })

      if (result.success) {
        toast.success('Lead actualizado correctamente')
        setIsEditMode(false)
      } else {
        toast.error('Error al actualizar lead', { description: result.error })
      }
    } catch (error) {
      toast.error('Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDetail = async () => {
    setSaving(true)
    try {
      const result = await updateLeadDetail({
        lead_id: lead.id,
        client_name: editDetail.client_name || null,
        website: editDetail.website || null,
        emails: editDetail.emails,
        linkedin: editDetail.linkedin || null,
        facebook: editDetail.facebook || null,
        instagram: editDetail.instagram || null,
        twitter: editDetail.twitter || null,
      })

      if (result.success) {
        toast.success('Detalles actualizados correctamente')
        setIsEditMode(false)
      } else {
        toast.error('Error al actualizar detalles', { description: result.error })
      }
    } catch (error) {
      toast.error('Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveInforme = async () => {
    if (!editInforme) return
    setSaving(true)
    try {
      const result = await updateLeadDetail({
        lead_id: lead.id,
        informe: editInforme,
      })

      if (result.success) {
        toast.success('Informe actualizado correctamente')
        setIsEditingInforme(false)
      } else {
        toast.error('Error al actualizar informe', { description: result.error })
      }
    } catch (error) {
      toast.error('Error al guardar informe')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLead = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lead?')) return

    setSaving(true)
    try {
      const result = await deleteLead({ lead_id: lead.id })

      if (result.success) {
        toast.success('Lead eliminado correctamente')
        onOpenChange(false)
      } else {
        toast.error('Error al eliminar lead', { description: result.error })
      }
    } catch (error) {
      toast.error('Error al eliminar lead')
    } finally {
      setSaving(false)
    }
  }

  const addEmail = () => {
    setEditDetail({
      ...editDetail,
      emails: [...editDetail.emails, ''],
    })
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...editDetail.emails]
    newEmails[index] = value
    setEditDetail({ ...editDetail, emails: newEmails })
  }

  const removeEmail = (index: number) => {
    setEditDetail({
      ...editDetail,
      emails: editDetail.emails.filter((_, i) => i !== index),
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      nuevo: 'bg-blue-100 text-blue-700 border-blue-200',
      en_progreso: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      completado: 'bg-green-100 text-green-700 border-green-200',
      investigado: 'bg-purple-100 text-purple-700 border-purple-200',
      email_enviado: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      respuesta_recibida: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      error: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || colors.nuevo
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      nuevo: 'Nuevo',
      en_progreso: 'En Progreso',
      completado: 'Completado',
      investigado: 'Investigado',
      email_enviado: 'Email Enviado',
      respuesta_recibida: 'Respuesta Recibida',
      error: 'Error',
    }
    return labels[status] || status
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[600px] lg:w-[700px] overflow-y-auto p-0 bg-slate-50">
        {/* Header moderno */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {lead.title || 'Lead sin título'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lead.categoryName || 'Sin categoría'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteLead}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(false)}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveLead}
                    disabled={saving}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <>Guardando...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="px-6 py-6 space-y-6">
          {loading ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ) : (
            <>
              {/* Información del Lead - Card moderno */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      Información del Lead
                    </h3>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {getStatusLabel(lead.status)}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {isEditMode ? (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                          Título
                        </Label>
                        <Input
                          value={editLead.title}
                          onChange={(e) => setEditLead({ ...editLead, title: e.target.value })}
                          placeholder="Título del lead"
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                          Categoría
                        </Label>
                        <Input
                          value={editLead.category_name}
                          onChange={(e) =>
                            setEditLead({ ...editLead, category_name: e.target.value })
                          }
                          placeholder="Categoría"
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Dirección
                        </Label>
                        <Input
                          value={editLead.address}
                          onChange={(e) => setEditLead({ ...editLead, address: e.target.value })}
                          placeholder="Dirección"
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          Teléfono
                        </Label>
                        <Input
                          value={editLead.phone}
                          onChange={(e) => setEditLead({ ...editLead, phone: e.target.value })}
                          placeholder="Teléfono"
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </Label>
                        <Input
                          value={editLead.website}
                          onChange={(e) => setEditLead({ ...editLead, website: e.target.value })}
                          placeholder="https://..."
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                          Estado
                        </Label>
                        <select
                          value={editLead.status}
                          onChange={(e) =>
                            setEditLead({ ...editLead, status: e.target.value as any })
                          }
                          className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="nuevo">Nuevo</option>
                          <option value="en_progreso">En Progreso</option>
                          <option value="completado">Completado</option>
                          <option value="investigado">Investigado</option>
                          <option value="email_enviado">Email Enviado</option>
                          <option value="respuesta_recibida">Respuesta Recibida</option>
                          <option value="error">Error</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <Building2 className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1">Título</p>
                          <p className="text-sm font-medium text-slate-800">{lead.title || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Building2 className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1">Categoría</p>
                          <p className="text-sm font-medium text-slate-800">
                            {lead.categoryName || '-'}
                          </p>
                        </div>
                      </div>
                      {lead.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Dirección</p>
                            <p className="text-sm font-medium text-slate-800">{lead.address}</p>
                          </div>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Teléfono</p>
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              {lead.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-start gap-3">
                          <Globe className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Website</p>
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              {lead.website}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Detalles del Cliente - Card moderno */}
              {leadDetail && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        Detalles del Cliente
                      </h3>
                      {isEditMode && (
                        <Button size="sm" onClick={handleSaveDetail} disabled={saving} className="gap-2">
                          {saving ? (
                            <>Guardando...</>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Guardar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    {isEditMode ? (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            Nombre del cliente
                          </Label>
                          <Input
                            value={editDetail.client_name}
                            onChange={(e) =>
                              setEditDetail({ ...editDetail, client_name: e.target.value })
                            }
                            placeholder="Nombre del cliente"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5" />
                            Website
                          </Label>
                          <Input
                            value={editDetail.website}
                            onChange={(e) =>
                              setEditDetail({ ...editDetail, website: e.target.value })
                            }
                            placeholder="https://..."
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            Emails
                          </Label>
                          <div className="space-y-2">
                            {editDetail.emails.map((email, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={email}
                                  onChange={(e) => updateEmail(index, e.target.value)}
                                  placeholder="email@ejemplo.com"
                                  type="email"
                                  className="bg-white"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeEmail(index)}
                                  className="px-3"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addEmail}
                              className="w-full gap-2"
                            >
                              <Mail className="h-4 w-4" />
                              Añadir Email
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1.5">
                            <LinkIcon className="h-3.5 w-3.5" />
                            Redes Sociales
                          </Label>
                          <div className="space-y-2">
                            <Input
                              value={editDetail.linkedin}
                              onChange={(e) =>
                                setEditDetail({ ...editDetail, linkedin: e.target.value })
                              }
                              placeholder="LinkedIn URL"
                              className="bg-white"
                            />
                            <Input
                              value={editDetail.facebook}
                              onChange={(e) =>
                                setEditDetail({ ...editDetail, facebook: e.target.value })
                              }
                              placeholder="Facebook URL"
                              className="bg-white"
                            />
                            <Input
                              value={editDetail.instagram}
                              onChange={(e) =>
                                setEditDetail({ ...editDetail, instagram: e.target.value })
                              }
                              placeholder="Instagram URL"
                              className="bg-white"
                            />
                            <Input
                              value={editDetail.twitter}
                              onChange={(e) =>
                                setEditDetail({ ...editDetail, twitter: e.target.value })
                              }
                              placeholder="Twitter/X URL"
                              className="bg-white"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {leadDetail.clientName && (
                          <div className="flex items-start gap-3">
                            <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500 mb-1">Nombre del cliente</p>
                              <p className="text-sm font-medium text-slate-800">
                                {leadDetail.clientName}
                              </p>
                            </div>
                          </div>
                        )}
                        {leadDetail.website && (
                          <div className="flex items-start gap-3">
                            <Globe className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500 mb-1">Website</p>
                              <a
                                href={leadDetail.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                {leadDetail.website}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}
                        {leadDetail.emails && leadDetail.emails.length > 0 && (
                          <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500 mb-1">Emails</p>
                              <div className="space-y-1">
                                {leadDetail.emails.map((email, index) => (
                                  <a
                                    key={index}
                                    href={`mailto:${email}`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 block"
                                  >
                                    {email}
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {(leadDetail.linkedin ||
                          leadDetail.facebook ||
                          leadDetail.instagram ||
                          leadDetail.twitter) && (
                          <div className="flex items-start gap-3">
                            <LinkIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500 mb-1">Redes Sociales</p>
                              <div className="space-y-2">
                                {leadDetail.linkedin && (
                                  <a
                                    href={leadDetail.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    LinkedIn
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {leadDetail.facebook && (
                                  <a
                                    href={leadDetail.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    Facebook
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {leadDetail.instagram && (
                                  <a
                                    href={leadDetail.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    Instagram
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {leadDetail.twitter && (
                                  <a
                                    href={leadDetail.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    Twitter/X
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Informe - Card moderno */}
              {leadDetail?.informe && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        Informe de Investigación
                      </h3>
                      {!isEditingInforme && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingInforme(true)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    {isEditingInforme ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Resumen
                          </Label>
                          <Textarea
                            value={editInforme?.resumen || ''}
                            onChange={(e) =>
                              setEditInforme({ ...editInforme!, resumen: e.target.value })
                            }
                            rows={4}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Servicios (uno por línea)
                          </Label>
                          <Textarea
                            value={editInforme?.servicios.join('\n') || ''}
                            onChange={(e) =>
                              setEditInforme({
                                ...editInforme!,
                                servicios: e.target.value.split('\n').filter((s) => s.trim()),
                              })
                            }
                            rows={4}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Título del sitio web
                          </Label>
                          <Input
                            value={editInforme?.presencia_online.website_titulo || ''}
                            onChange={(e) =>
                              setEditInforme({
                                ...editInforme!,
                                presencia_online: {
                                  ...editInforme!.presencia_online,
                                  website_titulo: e.target.value,
                                },
                              })
                            }
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Problemas Automatizables (uno por línea)
                          </Label>
                          <Textarea
                            value={editInforme?.problemas_automatizables?.join('\n') || ''}
                            onChange={(e) =>
                              setEditInforme({
                                ...editInforme!,
                                problemas_automatizables: e.target.value
                                  .split('\n')
                                  .filter((s) => s.trim()),
                              })
                            }
                            rows={4}
                            placeholder="Ej: Atención al cliente limitada a horario de oficina - puede automatizarse 24/7"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Propuesta de Valor
                          </Label>
                          <Textarea
                            value={editInforme?.propuesta_valor || ''}
                            onChange={(e) =>
                              setEditInforme({ ...editInforme!, propuesta_valor: e.target.value })
                            }
                            rows={6}
                            placeholder="Propuesta específica basada en los problemas automatizables detectados..."
                            className="bg-white"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={handleSaveInforme}
                            disabled={saving}
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            {saving ? (
                              <>Guardando...</>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Guardar Informe
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditingInforme(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-xs font-medium text-blue-700 mb-2">Resumen</p>
                          <p className="text-sm text-slate-700">{leadDetail.informe.resumen}</p>
                        </div>
                        {leadDetail.informe.problemas_automatizables &&
                          leadDetail.informe.problemas_automatizables.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <p className="text-xs font-medium text-orange-700 mb-2">
                                Problemas Automatizables
                              </p>
                              <ul className="space-y-1">
                                {leadDetail.informe.problemas_automatizables.map((problema, index) => (
                                  <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                                    <span className="text-orange-500 mt-0.5">•</span>
                                    <span>{problema}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-xs font-medium text-green-700 mb-2">
                            Propuesta de Valor
                          </p>
                          <p className="text-sm text-slate-700">
                            {leadDetail.informe.propuesta_valor}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsInformeModalOpen(true)}
                          className="w-full gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Ver Informe Completo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>

      {/* Modal con JSON completo del informe - Mantener igual */}
      {leadDetail?.informe && (
        <Dialog open={isInformeModalOpen} onOpenChange={setIsInformeModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Informe Completo</DialogTitle>
              <DialogDescription>
                Información detallada del análisis del lead
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Resumen:</h4>
                <p className="text-sm">{leadDetail.informe.resumen}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Servicios:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {leadDetail.informe.servicios.map((servicio, index) => (
                    <li key={index}>{servicio}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Presencia Online:</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Título del sitio:</strong>{' '}
                    {leadDetail.informe.presencia_online.website_titulo}
                  </p>
                  <div>
                    <strong>Seguidores aproximados:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {leadDetail.informe.presencia_online.seguidores_aprox.instagram !== null && (
                        <li>
                          Instagram:{' '}
                          {leadDetail.informe.presencia_online.seguidores_aprox.instagram}
                        </li>
                      )}
                      {leadDetail.informe.presencia_online.seguidores_aprox.facebook !== null && (
                        <li>
                          Facebook:{' '}
                          {leadDetail.informe.presencia_online.seguidores_aprox.facebook}
                        </li>
                      )}
                      {leadDetail.informe.presencia_online.seguidores_aprox.linkedin !== null && (
                        <li>
                          LinkedIn:{' '}
                          {leadDetail.informe.presencia_online.seguidores_aprox.linkedin}
                        </li>
                      )}
                      {leadDetail.informe.presencia_online.seguidores_aprox.twitter !== null && (
                        <li>
                          Twitter:{' '}
                          {leadDetail.informe.presencia_online.seguidores_aprox.twitter}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              {leadDetail.informe.logros_y_prensa.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Logros y Prensa:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {leadDetail.informe.logros_y_prensa.map((logro, index) => (
                      <li key={index}>{logro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {leadDetail.informe.puntos_dolor.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Puntos de Dolor:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {leadDetail.informe.puntos_dolor.map((punto, index) => (
                      <li key={index}>{punto}</li>
                    ))}
                  </ul>
                </div>
              )}
              {leadDetail.informe.problemas_automatizables &&
                leadDetail.informe.problemas_automatizables.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Problemas Automatizables:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {leadDetail.informe.problemas_automatizables.map((problema, index) => (
                        <li key={index} className="text-orange-700 dark:text-orange-400">
                          {problema}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              <div>
                <h4 className="font-semibold mb-2">Propuesta de Valor:</h4>
                <p className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  {leadDetail.informe.propuesta_valor}
                </p>
              </div>
              {leadDetail.informe.fuentes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Fuentes:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {leadDetail.informe.fuentes.map((fuente, index) => (
                      <li key={index}>
                        <a
                          href={fuente}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {fuente}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2">JSON Completo:</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(leadDetail.informe, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Sheet>
  )
}
