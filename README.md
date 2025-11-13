# CRM de Leads - Mini-CRM con Scraping y Análisis IA

Sistema completo de gestión de leads con scraping automatizado, análisis con IA y envío de emails personalizados.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers + Server Actions
- **Base de Datos**: Supabase (Postgres + Auth + Realtime)
- **Integraciones**:
  - **n8n**: 2 workflows (SCRAPE y EMAIL) vía webhooks
  - **Apify**: Scraping de negocios desde Google Maps
  - **Firecrawl**: Enriquecimiento de datos (emails, RRSS)
  - **LLM**: OpenAI o Perplexity para investigación de leads
- **Autenticación**: Supabase Auth (email + password)
- **Realtime**: Supabase Realtime para actualizaciones en vivo

## 📋 Características Principales

- ✅ **Búsqueda de Leads**: Scraping automatizado con Apify y Firecrawl
- ✅ **Investigación con IA**: Análisis detallado de leads usando LLM
- ✅ **Gestión Completa**: Edición y eliminación de leads y detalles
- ✅ **Envío de Emails**: Integración con n8n para emails personalizados
- ✅ **Tiempo Real**: Actualizaciones automáticas con Supabase Realtime
- ✅ **Indicadores Visuales**: Estado de email visible en la tabla
- ✅ **Deduplicación**: Prevención de leads duplicados por website
- ✅ **Multi-tenant**: Aislamiento de datos por usuario

## 🛠️ Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# n8n Webhooks
SCRAPE_WEBHOOK_URL=https://tu-n8n.com/webhook/scrape
EMAIL_WEBHOOK_URL=https://tu-n8n.com/webhook/email

# LLM Provider (elegir uno)
LLM_PROVIDER=openai
OPENAI_API_KEY=tu-openai-key
# O
LLM_PROVIDER=perplexity
PERPLEXITY_API_KEY=tu-perplexity-key

# URLs de Producción
NEXTJS_URL=http://localhost:3000
```

## 📦 Instalación Completa

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/davotelodice/thor-github-crm.git
cd thor-github-crm
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Supabase

1. **Crear proyecto en Supabase**:
   - Ve a [https://supabase.com](https://supabase.com)
   - Crea una cuenta o inicia sesión
   - Crea un nuevo proyecto
   - Guarda la contraseña de la base de datos

2. **Ejecutar scripts SQL**:
   - Ve a **SQL Editor** en el Dashboard de Supabase
   - Ejecuta los scripts en este orden (ver `docs/database/`):
     - `01-schema-completo.sql` - Crea todas las tablas
     - `02-politicas-rls.sql` - Configura políticas de seguridad
     - `03-realtime-setup.sql` - Habilita actualizaciones en tiempo real

3. **Obtener API Keys**:
   - Ve a **Settings → API** en Supabase
   - Copia los siguientes valores:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Paso 4: Configurar Variables de Entorno

1. **Crear archivo `.env.local`** en la raíz del proyecto:
   ```bash
   cp .env.example .env.local
   ```

2. **Completar las variables**:
   ```env
   # Supabase (obtenidas en el Paso 3)
   NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
   
   # n8n Webhooks (obtener después del Paso 5)
   SCRAPE_WEBHOOK_URL=https://tu-n8n.com/webhook/scrape-request
   EMAIL_WEBHOOK_URL=https://tu-n8n.com/webhook/email-request
   
   # LLM Provider (elegir uno)
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   # O
   LLM_PROVIDER=perplexity
   PERPLEXITY_API_KEY=pplx-...
   
   # URL de Producción
   NEXTJS_URL=http://localhost:3000
   ```

### Paso 5: Configurar n8n

1. **Crear cuenta en n8n** (self-hosted o cloud):
   - [n8n Cloud](https://n8n.io/cloud) o
   - [n8n Self-hosted](https://docs.n8n.io/hosting/)

2. **Configurar workflows**:
   - **Workflow SCRAPE**: Sigue `docs/n8n-scrape-setup.md`
     - Crea el webhook y copia la URL → `SCRAPE_WEBHOOK_URL`
   - **Workflow EMAIL**: Sigue `docs/n8n-email-setup.md`
     - Crea el webhook y copia la URL → `EMAIL_WEBHOOK_URL`

3. **Actualizar `.env.local`** con las URLs de los webhooks

### Paso 6: Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Paso 7: Build para Producción

```bash
npm run build
npm start
```

**Para deploy en Vercel:**
1. Conecta tu repositorio a Vercel
2. Configura todas las variables de entorno en Vercel Dashboard
3. Deploy automático en cada push a `main`

## 🗄️ Estructura de Base de Datos

Para la documentación completa de la base de datos, incluyendo scripts SQL listos para copiar y pegar, ve a **`docs/database/`**.

### Tablas Principales

#### `thor_leads`
- Almacena información básica de los leads
- Campos: `id`, `user_id`, `search_string`, `title`, `category_name`, `address`, `phone`, `website`, `status`, `run_id`
- Constraint único: `UNIQUE(user_id, website)` para deduplicación

#### `thor_lead_details`
- Información detallada y enriquecida del lead
- Campos: `id`, `user_id`, `lead_id`, `client_name`, `website`, `emails[]`, `linkedin`, `facebook`, `instagram`, `twitter`, `informe` (JSONB)
- Relación 1:1 con `thor_leads`

#### `thor_outbound_messages`
- Trazabilidad de emails enviados
- Campos: `id`, `user_id`, `lead_id`, `channel`, `subject`, `body`, `n8n_run_id`, `provider_message_id`, `status`, `meta` (JSONB)

### Documentación Completa

- **`docs/database/README.md`** - Guía completa de instalación y configuración
- **`docs/database/01-schema-completo.sql`** - Script SQL para crear todas las tablas
- **`docs/database/02-politicas-rls.sql`** - Políticas de seguridad (RLS)
- **`docs/database/03-realtime-setup.sql`** - Configuración de Realtime

### Estados de Lead

```
nuevo → en_progreso → completado → investigado → email_enviado → respuesta_recibida
                                                      ↓
                                                   error
```

## 🔌 Endpoints y Payloads

### Server Actions

#### `requestScrape(input)`
```typescript
{
  keyword: string
  location: string
  limit?: number (default: 15, max: 15)
}
```

#### `investigateLead(input)`
```typescript
{
  lead_id: string (UUID)
}
```

#### `requestEmail(input)`
```typescript
{
  lead_id: string (UUID)
}
```

### Route Handlers

#### `POST /api/n8n/scrape-callback`
```json
{
  "run_id": "uuid",
  "status": "completed" | "error",
  "error"?: "string"
}
```

#### `POST /api/n8n/email-callback`
```json
{
  "n8n_run_id": "string",
  "lead_id": "uuid",
  "status": "entregado" | "respondido" | "fallo",
  "provider_message_id"?: "string",
  "response_text"?: "string"
}
```

## 📚 Estructura del Informe LLM

El informe generado por la IA se almacena en `thor_lead_details.informe` con la siguiente estructura:

```typescript
{
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
  problemas_automatizables: string[]
  propuesta_valor: string
  fuentes: string[]
}
```

## 🔄 Flujos n8n

### Flujo SCRAPE
1. Recibe webhook con `{ run_id, user_id, keyword, location, limit }`
2. Ejecuta Apify Actor para buscar negocios
3. Para cada resultado, usa Firecrawl para extraer emails y RRSS
4. Inserta/Upserta en Supabase (`thor_leads` y `thor_lead_details`)
5. Callback a Next.js con `{ run_id, status }`

### Flujo EMAIL
1. Recibe webhook con `{ user_id, lead_id, to, nombre, website, informe, website_rrss }`
2. Genera email personalizado usando `informe.propuesta_valor`
3. Envía email vía SMTP/SendGrid/Resend
4. Callback a Next.js con `{ n8n_run_id, lead_id, status, provider_message_id }`

Ver documentación detallada en `docs/n8n-scrape-setup.md` y `docs/n8n-email-setup.md`.

## 🧪 Testing

Ver checklist completo de testing manual en `docs/testing-checklist.md`.

## 📖 Documentación Adicional

### Base de Datos
- **`docs/database/`** - Documentación completa de la base de datos
  - `README.md` - Guía de instalación paso a paso
  - `01-schema-completo.sql` - Script SQL para crear tablas
  - `02-politicas-rls.sql` - Políticas de seguridad
  - `03-realtime-setup.sql` - Configuración de Realtime

### n8n Workflows
- **`docs/n8n-scrape-setup.md`** - Guía completa para configurar workflow SCRAPE
- **`docs/n8n-email-setup.md`** - Guía completa para configurar workflow EMAIL
- **`docs/n8n-fix-upsert-supabase.md`** - Solución de problemas con UPSERT

### Testing
- **`docs/testing-checklist.md`** - Checklist de pruebas manuales

## 🚢 Deployment

### Vercel (Recomendado)

1. Conectar repositorio Git a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Deploy automático en cada push a `main`

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables de `.env.local` en tu plataforma de hosting.

## 🔒 Seguridad

- **RLS (Row Level Security)**: Todas las tablas tienen políticas RLS activas que aseguran que cada usuario solo accede a sus propios datos
- **Autenticación**: Protección de rutas con middleware de Next.js
- **Service Role Key**: Solo se usa en n8n (backend), nunca en el frontend
- **Sanitización**: Logging sanitiza datos sensibles automáticamente
- **Validación**: Todas las entradas validadas con Zod
- **Variables de Entorno**: Todas las credenciales se manejan mediante variables de entorno

**⚠️ IMPORTANTE**: 
- **NUNCA** expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend
- **NUNCA** subas `.env.local` a Git
- Usa siempre la `anon` key en el frontend (respeta RLS)

## 📝 Notas de Desarrollo

- Todas las tablas usan prefijo `thor_`
- Mapeo UI ↔ DB: `snake_case` en DB, `camelCase` en UI
- Límite máximo de 15 leads por búsqueda
- Deduplicación automática por `(user_id, website)`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto. Ver archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación en `docs/`
2. Verifica que todas las variables de entorno estén configuradas
3. Revisa los logs de Supabase y n8n
4. Abre un issue en el repositorio

---

**Desarrollado con ❤️ usando Next.js 14, Supabase y n8n**
