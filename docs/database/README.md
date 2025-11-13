# Documentación de Base de Datos - CRM de Leads

Esta carpeta contiene toda la documentación y scripts SQL necesarios para configurar la base de datos en Supabase.

## 📋 Archivos Incluidos

1. **`01-schema-completo.sql`** - DDL completo para crear todas las tablas
2. **`02-politicas-rls.sql`** - Políticas Row Level Security (RLS) para seguridad
3. **`03-realtime-setup.sql`** - Configuración de Realtime para actualizaciones en vivo

## 🚀 Instalación Paso a Paso

### Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa:
   - **Name**: Nombre de tu proyecto (ej: "CRM Leads")
   - **Database Password**: Guarda esta contraseña de forma segura
   - **Region**: Elige la región más cercana
5. Espera a que se cree el proyecto (2-3 minutos)

### Paso 2: Ejecutar Scripts SQL

1. En el Dashboard de Supabase, ve a **SQL Editor** (menú lateral izquierdo)
2. Haz clic en **"New query"**
3. Ejecuta los scripts en este orden:

#### 2.1. Crear Tablas
- Abre el archivo `01-schema-completo.sql`
- Copia todo el contenido
- Pégalo en el SQL Editor
- Haz clic en **"Run"** o presiona `Ctrl+Enter`
- Verifica que no haya errores

#### 2.2. Configurar Políticas RLS
- Abre el archivo `02-politicas-rls.sql`
- Copia todo el contenido
- Pégalo en el SQL Editor
- Haz clic en **"Run"**
- Verifica que no haya errores

#### 2.3. Habilitar Realtime
- Abre el archivo `03-realtime-setup.sql`
- Copia todo el contenido
- Pégalo en el SQL Editor
- Haz clic en **"Run"**
- Verifica que no haya errores

### Paso 3: Obtener API Keys de Supabase

1. Ve a **Settings → API** en Supabase Dashboard
2. Copia los siguientes valores:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Paso 4: Detalles de las API Keys

Para obtener las API keys de Supabase:
1. Ve a **Settings → API** en Supabase Dashboard
2. Copia `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copia `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copia `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY` (esta es la que usarás en n8n)

## 📊 Estructura de Tablas

### `thor_leads`
Almacena información básica de los leads obtenidos del scraping.

**Campos principales:**
- `id` (UUID) - Identificador único
- `user_id` (UUID) - Referencia al usuario (auth.users)
- `search_string` (TEXT) - Búsqueda que generó este lead
- `title` (TEXT) - Nombre del negocio
- `website` (TEXT) - URL del sitio web
- `status` (TEXT) - Estado del lead (nuevo, en_progreso, completado, etc.)
- `run_id` (TEXT) - ID del run de scraping de n8n

**Constraint único:** `(user_id, website)` - Previene duplicados

### `thor_lead_details`
Información detallada y enriquecida del lead.

**Campos principales:**
- `id` (UUID) - Identificador único
- `lead_id` (UUID) - Referencia a thor_leads (relación 1:1)
- `emails` (TEXT[]) - Array de emails encontrados
- `linkedin`, `facebook`, `instagram`, `twitter` (TEXT) - Redes sociales
- `informe` (JSONB) - Informe generado por el LLM con análisis del lead

**Relación:** 1:1 con `thor_leads` (UNIQUE constraint en `lead_id`)

### `thor_outbound_messages`
Trazabilidad de emails enviados a leads.

**Campos principales:**
- `id` (UUID) - Identificador único
- `lead_id` (UUID) - Referencia a thor_leads
- `subject` (TEXT) - Asunto del email
- `body` (TEXT) - Cuerpo del email
- `n8n_run_id` (TEXT) - ID de ejecución del workflow n8n
- `provider_message_id` (TEXT) - ID del mensaje en el proveedor de email
- `status` (TEXT) - Estado: enviado, entregado, respondido, fallo

## 🔒 Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** habilitado con políticas que aseguran:
- Cada usuario solo puede **ver** sus propios datos
- Cada usuario solo puede **insertar** datos con su propio `user_id`
- Cada usuario solo puede **actualizar** sus propios datos
- Cada usuario solo puede **eliminar** sus propios datos

**IMPORTANTE:** 
- Las políticas RLS se aplican automáticamente cuando usas la `anon` key
- El `service_role_key` **bypasea** las políticas RLS (útil para n8n)
- **NUNCA** expongas el `service_role_key` en el frontend

## 🔄 Realtime

Las tablas `thor_leads` y `thor_lead_details` tienen Realtime habilitado para:
- Recibir actualizaciones automáticas cuando cambia el estado de un lead
- Sincronizar datos entre múltiples pestañas/dispositivos
- Actualizar la UI sin necesidad de refrescar la página

## 🧪 Verificación

Después de ejecutar los scripts, verifica que todo esté correcto:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'thor_%';

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'thor_%';

-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'thor_%';

-- Verificar Realtime
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename LIKE 'thor_%';
```

## 📝 Notas Importantes

1. **Prefijo `thor_`**: Todas las tablas usan el prefijo `thor_` para evitar conflictos
2. **Deduplicación**: El constraint `UNIQUE(user_id, website)` previene leads duplicados automáticamente
3. **Cascadas**: Los `ON DELETE CASCADE` aseguran que al eliminar un lead, se eliminen sus detalles y mensajes
4. **Timestamps**: `created_at` y `updated_at` se actualizan automáticamente
5. **Estados**: Los estados de leads siguen este flujo:
   ```
   nuevo → en_progreso → completado → investigado → email_enviado → respuesta_recibida
                                                      ↓
                                                   error
   ```

## 🆘 Troubleshooting

### Error: "relation already exists"
- Las tablas ya existen. Elimínalas primero o usa `CREATE TABLE IF NOT EXISTS`

### Error: "permission denied"
- Asegúrate de estar usando el SQL Editor con permisos de administrador
- Verifica que estás en el proyecto correcto de Supabase

### RLS no funciona
- Verifica que RLS está habilitado: `ALTER TABLE public.thor_leads ENABLE ROW LEVEL SECURITY;`
- Verifica que las políticas existen: `SELECT * FROM pg_policies WHERE tablename = 'thor_leads';`

### Realtime no funciona
- Verifica que las tablas están en la publicación: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`
- Asegúrate de haber ejecutado `03-realtime-setup.sql`

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL UUID](https://www.postgresql.org/docs/current/datatype-uuid.html)

