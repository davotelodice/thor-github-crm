# Guía de Configuración n8n - Flujo SCRAPE

Esta guía te ayudará a configurar el workflow de n8n para el flujo de scraping de leads basado en la estructura real del sistema.

## Prerequisitos

1. **Cuenta de n8n**: Debes tener una cuenta activa en n8n (self-hosted o cloud)
2. **Credenciales de Apify**: API key de Apify para usar el actor `compass~crawler-google-places`
3. **Credenciales de Firecrawl**: API key de Firecrawl para enriquecer datos
4. **Credenciales de Supabase**: 
   - `SUPABASE_URL`: URL de tu proyecto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (NO la anon key)

## Credenciales Necesarias

**NO necesitas configurar variables de entorno en n8n**. Simplemente necesitas tener estas credenciales a mano para pegarlas directamente en los nodos:

1. **Supabase Service Role Key**: 
   - Obtener en: Supabase Dashboard → Settings → API → `service_role` key (secret)
   - La usarás en los headers de los nodos HTTP Request a Supabase

2. **Firecrawl API Key**: 
   - Obtener en: https://firecrawl.dev (tu cuenta)
   - La configurarás en las credenciales del nodo Firecrawl

3. **Apify API Key**: 
   - Obtener en: https://apify.com (tu cuenta)
   - La usarás en el header Authorization de los requests HTTP a Apify

4. **URLs**:
   - **Supabase URL**: `https://TU_PROYECTO_ID.supabase.co` (reemplaza `TU_PROYECTO_ID` con el ID de tu proyecto Supabase)
   - **Next.js URL (Producción)**: `https://tu-dominio.vercel.app` (reemplaza con tu URL de producción)

---

## Estructura del Workflow

El workflow sigue esta estructura:

```
Webhook → Start Apify Job → Wait → Check Status (loop) → Fetch Results → 
Save to thor_leads → Filter → Split Batches → Firecrawl Scrape → 
Extract Contacts → Clean Data → Save to thor_lead_details → Respond
```

---

## Paso 1: Configurar Webhook

### 1.1: Crear nuevo workflow
1. En n8n, haz clic en "Add workflow"
2. Nombra el workflow: "SCRAPE Leads"

### 1.2: Añadir nodo Webhook
1. Arrastra el nodo **"Webhook"** al canvas
2. Configuración:
   - **HTTP Method**: `POST`
   - **Path**: `/scrape-request`
   - **Response Mode**: "responseNode" (usaremos un nodo "Respond to Webhook" al final)
   - **Options → Allowed Origins**: `*`
3. **Activa "Production"** (botón toggle arriba a la derecha)
4. Haz clic en **"Listen for Test Event"** y luego en **"Execute Node"**
5. **COPIA LA URL** que aparece (ej: `https://tu-n8n.com/webhook/scrape-request`)
6. **Guarda esta URL** en tu `.env.local` como `SCRAPE_WEBHOOK_URL`

### 1.3: Payload esperado
El webhook recibirá este payload:
```json
{
  "run_id": "uuid-string",
  "user_id": "uuid-string",
  "keyword": "abogados migratorios",
  "location": "coruña",
  "limit": 15
}
```

---

## Paso 2: Iniciar Job de Scraping en Apify

### 2.1: Añadir nodo HTTP Request (Start Apify Scraping Job)
1. Arrastra el nodo **"HTTP Request"** después del Webhook
2. Conecta Webhook → HTTP Request
3. Configuración:
   - **Method**: `POST`
   - **URL**: `https://api.apify.com/v2/acts/compass~crawler-google-places/runs`
   - **Send Headers**: `true`
   - **Headers**:
     - **Header 1**:
       - **Name**: `Content-Type`
       - **Value**: `application/json`
     - **Header 2**:
       - **Name**: `Accept`
       - **Value**: `application/json`
     - **Header 3**:
       - **Name**: `Authorization`
       - **Value**: `Bearer TU_APIFY_API_KEY` (reemplaza con tu API key real de Apify)
   - **Send Body**: `true`
   - **Specify Body**: `json`
   - **JSON Body**:
     ```json
     {
       "includeWebResults": false,
       "language": "es",
       "locationQuery": "{{ $json.body.location }}",
       "maxCrawledPlacesPerSearch": {{ $json.body.limit }},
       "maxImages": 0,
       "maximumLeadsEnrichmentRecords": 0,
       "scrapeContacts": false,
       "scrapeDirectories": false,
       "scrapeImageAuthors": false,
       "scrapePlaceDetailPage": false,
       "scrapeReviewsPersonalData": true,
       "scrapeTableReservationProvider": false,
       "searchStringsArray": [
         "{{ $json.body.keyword }}"
       ],
       "skipClosedPlaces": false
     }
     ```

**IMPORTANTE**: Reemplaza `TU_APIFY_API_KEY` con tu API key real de Apify.

### 2.2: Respuesta esperada
Apify devolverá un objeto con:
- `data.id` - ID del run
- `data.status` - Estado del run (RUNNING, SUCCEEDED, FAILED)
- `data.defaultDatasetId` - ID del dataset con los resultados

---

## Paso 3: Esperar y Verificar Estado del Job

### 3.1: Añadir nodo Wait
1. Arrastra el nodo **"Wait"** después del HTTP Request de Apify
2. Configuración:
   - **Resume**: "When Called" (webhook)
   - Esto permite que el workflow espere sin consumir recursos

### 3.2: Añadir nodo HTTP Request (Check Scraping Status)
1. Arrastra el nodo **"HTTP Request"** después del Wait
2. Conecta Wait → HTTP Request
3. Configuración:
   - **Method**: `GET`
   - **URL**: `https://api.apify.com/v2/actor-runs/{{ $json.data.id }}`
   - **Send Headers**: `true`
   - **Headers** (igual que el anterior):
     - `Content-Type`: `application/json`
     - `Accept`: `application/json`
     - `Authorization`: `Bearer TU_APIFY_API_KEY`
   - **Options → Timeout**: `10000` (10 segundos)

### 3.3: Añadir nodo IF (Loop Until Complete)
1. Arrastra el nodo **"IF"** después del Check Scraping Status
2. Configuración:
   - **Condition**: `{{ $json.data.status }}` **not equals** `SUCCEEDED`
   - **Options → Type Validation**: `loose`
3. **Conecta**:
   - **True** (si no está completo) → vuelve al nodo Wait
   - **False** (si está completo) → continúa al siguiente paso

**IMPORTANTE**: Esto crea un loop que espera hasta que el job de Apify termine.

---

## Paso 4: Obtener Resultados del Scraping

### 4.1: Añadir nodo HTTP Request (Fetch Scraped Results)
1. Arrastra el nodo **"HTTP Request"** después del IF (conectado a la salida False)
2. Configuración:
   - **Method**: `GET`
   - **URL**: `https://api.apify.com/v2/datasets/{{ $json.data.defaultDatasetId }}/items`
   - **Send Headers**: `true`
   - **Headers** (igual que antes):
     - `Content-Type`: `application/json`
     - `Accept`: `application/json`
     - `Authorization`: `Bearer TU_APIFY_API_KEY`
   - **Options → Timeout**: `10000`

### 4.2: Respuesta esperada
Apify devolverá un array de objetos con información de cada negocio:
- `title` - Nombre del negocio
- `categoryName` - Categoría
- `address` - Dirección
- `phone` - Teléfono
- `website` - Sitio web
- `status` - Estado (debe ser "en_progreso" para procesar)

---

## Paso 5: Guardar Leads en Supabase (thor_leads)

### 5.1: Añadir nodo HTTP Request (Save to thor_leads)
1. Arrastra el nodo **"HTTP Request"** después de Fetch Scraped Results
2. Configuración:
   - **Method**: `POST`
   - **URL**: `https://TU_PROYECTO_ID.supabase.co/rest/v1/thor_leads?on_conflict=user_id,website`
     - **IMPORTANTE**: Reemplaza `TU_PROYECTO_ID` con el ID de tu proyecto Supabase
     - El parámetro `on_conflict=user_id,website` permite hacer UPSERT
   - **Send Headers**: `true`
   - **Headers**:
     - **Header 1**:
       - **Name**: `apikey`
       - **Value**: `TU_SERVICE_ROLE_KEY` (reemplaza con tu Service Role Key)
     - **Header 2**:
       - **Name**: `Authorization`
       - **Value**: `Bearer TU_SERVICE_ROLE_KEY` (mismo Service Role Key)
     - **Header 3**:
       - **Name**: `Prefer`
       - **Value**: `return=representation,resolution=merge-duplicates`
     - **Header 4**:
       - **Name**: `Content-Type`
       - **Value**: `application/json`
   - **Send Body**: `true`
   - **Specify Body**: `json`
   - **JSON Body**:
     ```json
     {
       "user_id": "{{ $('Webhook').item.json.body.user_id }}",
       "search_string": "{{ $json.searchString }}",
       "title": "{{ $json.title }}",
       "category_name": "{{ $json.categoryName }}",
       "address": "{{ $json.address }}",
       "phone": "{{ $json.phone }}",
       "website": "{{ $json.website }}",
       "status": "en_progreso",
       "run_id": "{{ $('Webhook').item.json.body.run_id }}"
     }
     ```

**IMPORTANTE**: 
- Reemplaza `TU_PROYECTO_ID` y `TU_SERVICE_ROLE_KEY` con tus valores reales
- El `on_conflict` previene duplicados automáticamente

---

## Paso 6: Filtrar Negocios con Website

### 6.1: Añadir nodo Filter
1. Arrastra el nodo **"Filter"** después del HTTP Request de thor_leads
2. Configuración:
   - **Conditions**:
     - **Condition 1**: `{{ $json.website }}` **is not empty**
     - **Condition 2**: `{{ $json.status }}` **equals** `en_progreso`
   - **Combinator**: `and`
   - **Options → Type Validation**: `strict`

Esto filtra solo los negocios que tienen website y están en progreso.

---

## Paso 7: Procesar en Lotes

### 7.1: Añadir nodo Split In Batches
1. Arrastra el nodo **"Split In Batches"** después del Filter
2. Configuración:
   - **Batch Size**: `1` (procesar uno por uno)
   - Esto permite procesar cada lead individualmente

---

## Paso 8: Scraping con Firecrawl

### 8.1: Añadir nodo Firecrawl (Primer intento)
1. Arrastra el nodo **"Firecrawl"** después de Split In Batches
2. Conecta Split In Batches → Firecrawl
3. Configuración:
   - **Operation**: `scrape`
   - **URL**: `={{ $json.website }}contacto`
   - **Credentials**: Configura tu API key de Firecrawl
   - **On Error**: `continueErrorOutput` (para que continúe si falla)

### 8.2: Añadir nodo Firecrawl (Segundo intento - fallback)
1. Arrastra otro nodo **"Firecrawl"** 
2. Conecta el primer Firecrawl (salida de error) → segundo Firecrawl
3. Configuración:
   - **Operation**: `scrape`
   - **URL**: `={{ $json.website }}/contacto`
   - **Credentials**: Misma API key de Firecrawl
   - **On Error**: `continueErrorOutput`

**NOTA**: Se intentan dos URLs diferentes (`/contacto` y `contacto`) para maximizar las posibilidades de encontrar información de contacto.

---

## Paso 9: Extraer Información de Contacto

### 9.1: Añadir nodo Code (Extract Contact Information)
1. Arrastra el nodo **"Code"** después de ambos nodos Firecrawl
2. Configuración:
   - **Language**: JavaScript
   - **Code**:
   ```javascript
   // Entrada
   const item = $input.first().json;
   const markdown = item.data?.markdown || '';
   const html = item.data?.html || '';
   const textContent = (html + '\n' + markdown).toLowerCase();

   // Resultado inicial
   const result = {
     website: item.website || 'Unknown',
     emails: 'None',
     linkedin: 'None',
     facebook: 'None',
     instagram: 'None',
     twitter: 'None',
   };

   // ===== Emails =====
   const emailRegex = /(?:mailto:)?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi;
   const emails = [...textContent.matchAll(emailRegex)].map(m => m[1]);

   const validEmails = [...new Set(emails)].filter(e => 
     !e.includes('example.com') && !e.includes('noreply@') && !e.includes('no-reply@')
   );

   if (validEmails.length) result.emails = validEmails.join(', ');

   // ===== LinkedIn =====
   const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/[a-z0-9\-._]+/gi;
   const linkedin = textContent.match(linkedinRegex);
   if (linkedin?.length) result.linkedin = `https://www.${linkedin[0].replace(/^(https?:\/\/)?(www\.)?/i, '')}`;

   // ===== Facebook =====
   const facebookRegex = /(?:https?:\/\/)?(?:www\.|m\.|mobile\.)?facebook\.com\/[^\s"'<>)]+/gi;
   const facebook = textContent.match(facebookRegex);
   if (facebook?.length) result.facebook = `https://www.${facebook[0].replace(/^(https?:\/\/)?(www\.)?/i, '')}`;

   // ===== Instagram =====
   const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s"'<>)/]+/gi;
   const instagram = textContent.match(instagramRegex);
   if (instagram?.length) result.instagram = `https://www.${instagram[0].replace(/^(https?:\/\/)?(www\.)?/i, '')}`;

   // ===== Twitter / X =====
   const twitterRegex = /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/[^\s"'<>)/]+/gi;
   const twitter = textContent.match(twitterRegex);
   if (twitter?.length) result.twitter = `https://www.${twitter[0].replace(/^(https?:\/\/)?(www\.)?/i, '')}`;

   // ===== Buscar @usernames si faltan URLs =====
   if (result.instagram === 'None') {
     const igHandle = textContent.match(/@([a-z0-9._]{3,30})/);
     if (igHandle) result.instagram = `https://www.instagram.com/${igHandle[1]}`;
   }

   if (result.twitter === 'None') {
     const twHandle = textContent.match(/@([a-z0-9_]{3,15})/);
     if (twHandle) result.twitter = `https://www.x.com/${twHandle[1]}`;
   }

   // ===== Clean trailing params and slashes =====
   ['linkedin', 'facebook', 'instagram', 'twitter'].forEach(field => {
     if (result[field] !== 'None') {
       result[field] = result[field].split('?')[0].split('#')[0].replace(/\/$/, '');
     }
   });

   // Devuelve el resultado listo para Set Node
   return [{ json: result }];
   ```

Este código extrae emails y redes sociales del contenido scrapeado.

---

## Paso 10: Limpiar Datos

### 10.1: Añadir nodo Code (Clean Data)
1. Arrastra el nodo **"Code"** después de Extract Contact Information
2. Configuración:
   - **Language**: JavaScript
   - **Code**:
   ```javascript
   const item = $input.item.json;

   // Limpiar emails - puede venir como string o array
   let emails = [];
   if (item.emails) {
     if (Array.isArray(item.emails)) {
       emails = item.emails.filter(email => email && email.trim() !== '');
     } else if (typeof item.emails === 'string' && item.emails.trim() !== '') {
       emails = [item.emails.trim()];
     }
   }

   // Limpiar RRSS - convertir "None" a null
   const cleanValue = (val) => {
     if (!val || val === 'None' || val === 'null' || val === '' || val === null) {
       return null;
     }
     return val;
   };

   return {
     ...item,
     emails: emails,
     linkedin: cleanValue(item.linkedin),
     facebook: cleanValue(item.facebook),
     instagram: cleanValue(item.instagram),
     twitter: cleanValue(item.twitter),
   };
   ```

Este código limpia los datos antes de guardarlos en Supabase.

---

## Paso 11: Guardar Detalles en Supabase (thor_lead_details)

### 11.1: Añadir nodo HTTP Request (Save to thor_lead_details)
1. Arrastra el nodo **"HTTP Request"** después de Clean Data
2. Configuración:
   - **Method**: `POST`
   - **URL**: `https://TU_PROYECTO_ID.supabase.co/rest/v1/thor_lead_details?on_conflict=lead_id`
     - **IMPORTANTE**: Reemplaza `TU_PROYECTO_ID` con el ID de tu proyecto Supabase
     - El parámetro `on_conflict=lead_id` permite hacer UPSERT
   - **Send Headers**: `true`
   - **Headers** (igual que el anterior):
     - `apikey`: `TU_SERVICE_ROLE_KEY`
     - `Authorization`: `Bearer TU_SERVICE_ROLE_KEY`
     - `Prefer`: `return=representation,resolution=merge-duplicates`
     - `Content-Type`: `application/json`
   - **Send Body**: `true`
   - **Specify Body**: `json`
   - **JSON Body**:
     ```json
     {
       "user_id": "{{ $('Webhook').item.json.body.user_id }}",
       "lead_id": "{{ $('HTTP Request').item.json.id }}",
       "client_name": "{{ $('HTTP Request').item.json.title }}",
       "website": "{{ $json.website }}",
       "emails": {{ JSON.stringify($json.emails || []) }},
       "linkedin": "{{ $json.linkedin }}",
       "facebook": "{{ $json.facebook }}",
       "instagram": "{{ $json.instagram }}",
       "twitter": "{{ $json.twitter }}"
     }
     ```

**IMPORTANTE**: 
- `$('HTTP Request').item.json.id` se refiere al ID devuelto por el primer HTTP Request (thor_leads)
- Los emails deben ser un array, por eso usamos `JSON.stringify()`

---

## Paso 12: Responder al Webhook

### 12.1: Añadir nodo Respond to Webhook
1. Arrastra el nodo **"Respond to Webhook"** 
2. Conecta Split In Batches (cuando termine el batch) → Respond to Webhook
3. Configuración:
   - No necesita configuración adicional
   - Responde automáticamente al webhook original

---

## Estructura Final del Workflow

```
Webhook
  ↓
Start Apify Scraping Job (HTTP Request)
  ↓
Wait for Job Succeed
  ↓
Check Scraping Status (HTTP Request)
  ↓
Loop Until Complete (IF) → [Si no completo] → Wait
  ↓ [Si completo]
Fetch Scraped Results (HTTP Request)
  ↓
Save to thor_leads (HTTP Request)
  ↓
Filter Businesses with Websites
  ↓
Batch Processing Logic (Split In Batches)
  ↓
  ├─→ Respond to Webhook (cuando termine)
  └─→ Scrape a url (Firecrawl) → [éxito] → Extract Contact Information
       ↓ [error]
       Scrape a url 1 (Firecrawl fallback)
       ↓
       Extract Contact Information
       ↓
       Clean Data (Code)
       ↓
       Save to thor_lead_details (HTTP Request)
       ↓
       Batch Processing Logic (continúa con siguiente item)
```

---

## Pruebas

1. **Activa el workflow** en modo Production
2. **Prueba desde tu app Next.js**:
   - Ve a `/dashboard`
   - Ingresa keyword y location
   - Haz clic en "Buscar"
   - Verifica que el webhook recibe la petición
3. **Verifica en Supabase**:
   - Ve a Table Editor → `thor_leads`
   - Deberías ver nuevos leads con `status = 'en_progreso'`
   - Después del scraping, los detalles estarán en `thor_lead_details`

---

## Troubleshooting

### El webhook no recibe peticiones
- Verifica que el workflow esté en modo **Production**
- Verifica que la URL en `.env.local` sea correcta
- Verifica los logs de n8n

### Apify no devuelve resultados
- Verifica que el API key de Apify sea válido
- Verifica que el actor `compass~crawler-google-places` esté disponible
- Revisa los logs de Apify

### Supabase rechaza las peticiones
- Verifica que uses `SERVICE_ROLE_KEY` (NO anon key)
- Verifica que las políticas RLS permitan inserts (deberían funcionar con service role)
- Verifica el formato del JSON

### Firecrawl falla
- Verifica que la API key de Firecrawl sea válida
- Algunos sitios pueden bloquear scraping - esto es normal
- El workflow continúa aunque Firecrawl falle gracias a `continueErrorOutput`

---

## Notas Importantes

1. **Deduplicación**: El constraint `UNIQUE(user_id, website)` en Supabase evitará duplicados automáticamente
2. **Límite de 15**: Respeta el `limit` del payload inicial
3. **Service Role Key**: NUNCA uses la anon key para inserts desde n8n, solo service role
4. **Error Handling**: Configura `Continue On Fail: true` o `continueErrorOutput` en nodos críticos para que un error no detenga todo el flujo
5. **Loop de espera**: El workflow espera automáticamente hasta que Apify termine el scraping
6. **Doble intento Firecrawl**: Se intentan dos URLs diferentes para maximizar la extracción de contactos
