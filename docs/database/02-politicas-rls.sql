-- ============================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ============================================
-- Este archivo contiene todas las políticas RLS necesarias
-- para asegurar que cada usuario solo pueda acceder a sus propios datos.
--
-- INSTRUCCIONES:
-- 1. Ejecuta primero el archivo 01-schema-completo.sql
-- 2. Luego ejecuta este archivo para crear las políticas RLS
-- ============================================

-- ============================================
-- POLÍTICAS PARA: thor_leads
-- ============================================

-- SELECT: Usuarios solo pueden ver sus propios leads
CREATE POLICY "thor_leads_select_own"
ON public.thor_leads
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Usuarios solo pueden insertar leads con su propio user_id
CREATE POLICY "thor_leads_insert_own"
ON public.thor_leads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuarios solo pueden actualizar sus propios leads
CREATE POLICY "thor_leads_update_own"
ON public.thor_leads
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuarios solo pueden eliminar sus propios leads
CREATE POLICY "thor_leads_delete_own"
ON public.thor_leads
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS PARA: thor_lead_details
-- ============================================

-- SELECT: Usuarios solo pueden ver sus propios detalles
CREATE POLICY "thor_lead_details_select_own"
ON public.thor_lead_details
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Usuarios solo pueden insertar detalles con su propio user_id
CREATE POLICY "thor_lead_details_insert_own"
ON public.thor_lead_details
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuarios solo pueden actualizar sus propios detalles
CREATE POLICY "thor_lead_details_update_own"
ON public.thor_lead_details
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuarios solo pueden eliminar sus propios detalles
CREATE POLICY "thor_lead_details_delete_own"
ON public.thor_lead_details
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS PARA: thor_outbound_messages
-- ============================================

-- SELECT: Usuarios solo pueden ver sus propios mensajes
CREATE POLICY "thor_outbound_select_own"
ON public.thor_outbound_messages
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Usuarios solo pueden insertar mensajes con su propio user_id
CREATE POLICY "thor_outbound_insert_own"
ON public.thor_outbound_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuarios solo pueden actualizar sus propios mensajes
CREATE POLICY "thor_outbound_update_own"
ON public.thor_outbound_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuarios solo pueden eliminar sus propios mensajes
CREATE POLICY "thor_outbound_delete_own"
ON public.thor_outbound_messages
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Las políticas RLS se aplican automáticamente a todas las consultas
-- 2. El service_role_key BYPASEA las políticas RLS (útil para n8n)
-- 3. Las políticas usan auth.uid() que devuelve el UUID del usuario autenticado
-- 4. Si necesitas que n8n inserte datos, usa el SERVICE_ROLE_KEY en los headers

