-- ============================================
-- CONFIGURACIÓN DE REALTIME
-- ============================================
-- Este archivo habilita Realtime en las tablas para que
-- la aplicación Next.js reciba actualizaciones en tiempo real.
--
-- INSTRUCCIONES:
-- 1. Ejecuta primero 01-schema-completo.sql y 02-politicas-rls.sql
-- 2. Luego ejecuta este archivo para habilitar Realtime
-- 3. También puedes hacerlo desde el Dashboard: Database → Replication
-- ============================================

-- Habilitar Realtime en thor_leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.thor_leads;

-- Habilitar Realtime en thor_lead_details
ALTER PUBLICATION supabase_realtime ADD TABLE public.thor_lead_details;

-- NOTA: thor_outbound_messages no necesita Realtime por ahora
-- Si lo necesitas en el futuro, descomenta la siguiente línea:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.thor_outbound_messages;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que Realtime está habilitado, ejecuta:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
--
-- Deberías ver thor_leads y thor_lead_details en los resultados.

