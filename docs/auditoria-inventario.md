++ Inventario Inicial de Archivos Sensibles

- **Raíz**  
  - `.env.example` (plantilla de variables, revisar placeholders)
  - `.gitignore` (verificar entradas de secretos locales)
  - `middleware.ts` (protecciones de rutas)

- **Directorio `app/`**  
  - `app/api/scrape/route.ts`
  - `app/api/investigate/route.ts`
  - `app/api/email/route.ts`
  - `app/api/n8n/scrape-callback/route.ts`  
  - `app/api/n8n/email-callback/route.ts`  
  - Server actions en `app/(dashboard)/*` que manipulan tokens o keys

- **Directorio `lib/`**  
  - `lib/supabase/server.ts` y `lib/supabase/client.ts`  
  - `lib/n8n.ts`, `lib/apify.ts`, `lib/firecrawl.ts` (endpoints externos)
  - `lib/openai.ts` o equivalentes

- **Directorio `docs/`**  
  - `docs/n8n-scrape-setup.md`
  - `docs/n8n-email-setup.md`
  - `docs/n8n-fix-upsert-supabase.md`
  - `docs/testing-checklist.md` (ver si contiene dominios)

- **Otros**  
  - `components.json` (config Tailwind, sin secretos pero verificar paths)
  - `public/` por posibles assets con URLs privadas
  - `.serena/project.yml` (config interna)

---

## 🔍 Hallazgos de Credenciales y URLs Reales

### URLs de Supabase (REALES - REQUIEREN REEMPLAZO)
- `https://knaplqhumkuiazqdnznd.supabase.co` encontrada en:
  - `docs/n8n-scrape-setup.md` (líneas 31, 215, 313)
  - `docs/n8n-email-setup.md` (línea 33)
  - `docs/n8n-fix-upsert-supabase.md` (línea 19)

### URLs de Producción (REALES - REQUIEREN REEMPLAZO)
- `https://crm-leads-zeta.vercel.app` encontrada en:
  - `docs/n8n-scrape-setup.md` (líneas 32, 357)
  - `docs/n8n-email-setup.md` (líneas 34, 286)

### Archivos de Código (✅ LIMPIOS)
- `lib/supabase/client.ts` - ✅ Usa `process.env.NEXT_PUBLIC_SUPABASE_URL`
- `lib/supabase/server.ts` - ✅ Usa `process.env.NEXT_PUBLIC_SUPABASE_URL`
- `lib/n8n/client.ts` - ✅ Usa `process.env.SCRAPE_WEBHOOK_URL` y `process.env.EMAIL_WEBHOOK_URL`
- `app/api/n8n/*/route.ts` - ✅ No contienen URLs hardcodeadas

### API Keys y Tokens
- ✅ No se encontraron API keys reales en el código
- ✅ Todas las credenciales se manejan mediante variables de entorno

---

## 📋 Plan de Reemplazo

### Placeholders a Usar:
1. **Supabase URL**: `https://TU_PROYECTO_ID.supabase.co` o `{{TU_SUPABASE_URL}}`
2. **Next.js URL**: `https://tu-dominio.vercel.app` o `{{TU_NEXTJS_URL}}`
3. **Webhooks n8n**: `https://tu-n8n.com/webhook/...` o `{{TU_N8N_WEBHOOK_URL}}`
4. **Service Role Key**: `<tu_service_role_key>` o `{{TU_SERVICE_ROLE_KEY}}`

> Próximo paso: Fase 2 - Limpieza de credenciales en archivos de documentación.

