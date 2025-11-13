// Estados de Lead
export type LeadStatus = 
  | 'nuevo' 
  | 'en_progreso' 
  | 'completado' 
  | 'investigado' 
  | 'email_enviado' 
  | 'respuesta_recibida' 
  | 'error'

// Estados de Mensaje
export type MessageStatus = 
  | 'enviado' 
  | 'fallo' 
  | 'entregado' 
  | 'respondido'

// Lead (mapeo DB -> UI)
export interface Lead {
  id: string
  user_id: string
  searchString: string  // DB: search_string
  title: string | null
  categoryName: string | null  // DB: category_name
  address: string | null
  phone: string | null
  website: string
  status: LeadStatus
  run_id: string | null
  created_at: string
  updated_at: string
}

// Lead Detail (mapeo DB -> UI)
export interface LeadDetail {
  id: string
  user_id: string
  lead_id: string
  clientName: string | null  // DB: client_name, UI: nombre del cliente
  website: string | null
  emails: string[]
  linkedin: string | null
  facebook: string | null
  instagram: string | null
  twitter: string | null
  informe: InformeJSON | null
  created_at: string
  updated_at: string
}

// Informe JSON (estructura informe LLM)
export interface InformeJSON {
  resumen: string
  servicios: string[]
  presencia_online: {
    website_titulo: string
    seguidores_aprox: {
      instagram: number | null
      facebook: number | null
      linkedin: number | null
      twitter: number | null
    }
  }
  logros_y_prensa: string[]
  puntos_dolor: string[]
  problemas_automatizables: string[] // Nuevo: problemas que se pueden automatizar con IA
  propuesta_valor: string // Propuesta específica basada en problemas automatizables
  fuentes: string[]
}

// Outbound Message
export interface OutboundMessage {
  id: string
  user_id: string
  lead_id: string
  channel: string
  subject: string | null
  body: string | null
  n8n_run_id: string | null
  provider_message_id: string | null
  status: MessageStatus
  meta: Record<string, any> | null
  created_at: string
}

// Payloads para Server Actions
export interface ScrapeRequestPayload {
  keyword: string
  location: string
  limit?: number
}

export interface InvestigatePayload {
  lead_id: string
}

export interface EmailRequestPayload {
  lead_id: string
}

// Callbacks n8n
export interface ScrapeCallbackPayload {
  run_id: string
  status: 'completed' | 'error'
  error?: string
}

export interface EmailCallbackPayload {
  n8n_run_id: string
  lead_id: string
  status: 'entregado' | 'respondido' | 'fallo'
  provider_message_id?: string
  response_text?: string
}

