-- ============================================
-- SCHEMA COMPLETO - CRM DE LEADS
-- ============================================
-- Este archivo contiene el DDL completo para crear todas las tablas
-- necesarias para el sistema CRM de Leads.
-- 
-- INSTRUCCIONES:
-- 1. Crea un nuevo proyecto en Supabase (https://supabase.com)
-- 2. Ve a SQL Editor en el Dashboard
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- ============================================

-- ============================================
-- TABLA: thor_leads
-- ============================================
-- Almacena información básica de los leads obtenidos del scraping
CREATE TABLE IF NOT EXISTS public.thor_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_string TEXT NOT NULL,
    title TEXT,
    category_name TEXT,
    address TEXT,
    phone TEXT,
    website TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'nuevo',
    run_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint único para prevenir duplicados por usuario y website
    CONSTRAINT thor_leads_user_id_website_key UNIQUE (user_id, website)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_thor_leads_user_id ON public.thor_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_thor_leads_status ON public.thor_leads(status);
CREATE INDEX IF NOT EXISTS idx_thor_leads_run_id ON public.thor_leads(run_id);
CREATE INDEX IF NOT EXISTS idx_thor_leads_created_at ON public.thor_leads(created_at DESC);

-- Comentarios en la tabla
COMMENT ON TABLE public.thor_leads IS 'Almacena información básica de los leads obtenidos del scraping';
COMMENT ON COLUMN public.thor_leads.status IS 'Estados posibles: nuevo, en_progreso, completado, investigado, email_enviado, respuesta_recibida, error';
COMMENT ON COLUMN public.thor_leads.run_id IS 'ID del run de scraping de n8n para agrupar leads de la misma búsqueda';

-- ============================================
-- TABLA: thor_lead_details
-- ============================================
-- Almacena información detallada y enriquecida del lead
CREATE TABLE IF NOT EXISTS public.thor_lead_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL UNIQUE REFERENCES public.thor_leads(id) ON DELETE CASCADE,
    client_name TEXT,
    website TEXT,
    emails TEXT[] DEFAULT '{}',
    linkedin TEXT,
    facebook TEXT,
    instagram TEXT,
    twitter TEXT,
    informe JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_thor_lead_details_user_id ON public.thor_lead_details(user_id);
CREATE INDEX IF NOT EXISTS idx_thor_lead_details_lead_id ON public.thor_lead_details(lead_id);
CREATE INDEX IF NOT EXISTS idx_thor_lead_details_website ON public.thor_lead_details(website);

-- Comentarios
COMMENT ON TABLE public.thor_lead_details IS 'Información detallada y enriquecida del lead (emails, RRSS, informe de IA)';
COMMENT ON COLUMN public.thor_lead_details.informe IS 'JSONB con el informe generado por el LLM (resumen, servicios, propuesta_valor, etc.)';

-- ============================================
-- TABLA: thor_outbound_messages
-- ============================================
-- Trazabilidad de emails enviados a leads
CREATE TABLE IF NOT EXISTS public.thor_outbound_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.thor_leads(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'email',
    subject TEXT,
    body TEXT,
    n8n_run_id TEXT,
    provider_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'enviado',
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_thor_outbound_messages_user_id ON public.thor_outbound_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_thor_outbound_messages_lead_id ON public.thor_outbound_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_thor_outbound_messages_n8n_run_id ON public.thor_outbound_messages(n8n_run_id);
CREATE INDEX IF NOT EXISTS idx_thor_outbound_messages_status ON public.thor_outbound_messages(status);

-- Comentarios
COMMENT ON TABLE public.thor_outbound_messages IS 'Trazabilidad de emails enviados a leads';
COMMENT ON COLUMN public.thor_outbound_messages.status IS 'Estados: enviado, entregado, respondido, fallo';
COMMENT ON COLUMN public.thor_outbound_messages.n8n_run_id IS 'ID de ejecución del workflow n8n que envió el email';
COMMENT ON COLUMN public.thor_outbound_messages.provider_message_id IS 'ID del mensaje en el proveedor de email (SendGrid, Resend, etc.)';

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.thor_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thor_lead_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thor_outbound_messages ENABLE ROW LEVEL SECURITY;

