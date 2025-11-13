# Guía de Configuración n8n - Flujo EMAIL

Esta guía te ayudará a configurar el workflow de n8n para el flujo de envío de emails a leads.

## Prerequisitos:

1. **Cuenta de n8n**: Debes tener una cuenta activa en n8n (self-hosted o cloud)
2. **Credenciales de Email Provider**: 
   - **Opción 1**: SMTP (Gmail, Outlook, etc.)
   - **Opción 2**: Servicio de email transaccional (SendGrid, Mailgun, Resend, etc.)
3. **Credenciales de Supabase**: 
   - `SUPABASE_URL`: URL de tu proyecto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (NO la anon key)
4. **Credenciales de OpenAI (Opcional)**: Si quieres generar emails personalizados con LLM

## Credenciales Necesarias

**NO necesitas configurar variables de entorno en n8n**. Simplemente necesitas tener estas credenciales a mano para pegarlas directamente en los nodos:

1. **Supabase Service Role Key**: 
   - Obtener en: Supabase Dashboard → Settings → API → `service_role` key (secret)
   - La usarás en los headers de los nodos HTTP Request a Supabase

2. **Email Provider Credentials**:
   - **SMTP**: Usuario, contraseña, servidor SMTP, puerto
   - **SendGrid/Mailgun/Resend**: API Key del servicio

3. **OpenAI API Key (Opcional)**:
   - Obtener en: https://platform.openai.com/api-keys
   - Solo si quieres generar emails personalizados con LLM

4. **URLs**:
   - **Supabase URL**: `https://TU_PROYECTO_ID.supabase.co` (reemplaza `TU_PROYECTO_ID` con el ID de tu proyecto Supabase)
   - **Next.js URL (Producción)**: `https://tu-dominio.vercel.app` (reemplaza con tu URL de producción)

---

## F6.1: Configurar Webhook EMAIL

### Paso 1: Crear nuevo workflow
1. En n8n, haz clic en "Add workflow"
2. Nombra el workflow: "EMAIL Leads"

### Paso 2: Añadir nodo Webhook
1. Arrastra el nodo **"Webhook"** al canvas
2. Configuración:
   - **HTTP Method**: `POST`
   - **Path**: `/email-request`
   - **Response Mode**: "Respond to Webhook"
   - **Activa "Production"** (botón toggle arriba a la derecha)
3. Haz clic en **"Listen for Test Event"** y luego en **"Execute Node"**
4. **COPIA LA URL** que aparece (ej: `https://tu-n8n.com/webhook/email-request`)
5. **Guarda esta URL** en tu `.env.local` como `EMAIL_WEBHOOK_URL`

### Paso 3: Configurar para recibir payload
El webhook recibirá este payload:
```json
{
  "user_id": "uuid-del-usuario",
  "lead_id": "uuid-del-lead",
  "to": "email@ejemplo.com",
  "nombre": "Nombre del Cliente",
  "website": "https://ejemplo.com",
  "informe": {
    "resumen": "...",
    "servicios": [...],
    "presencia_online": {...},
    "logros_y_prensa": [...],
    "puntos_dolor": [...],
    "problemas_automatizables": [
      "Atención al cliente limitada a horario de oficina - puede automatizarse 24/7",
      "No tienen sistema para que clientes consulten estatus de procesos - automatizable con IA",
      "Falta conexión a WhatsApp para atención inmediata - automatizable"
    ],
    "propuesta_valor": "Basándome en el análisis de su página web, he identificado oportunidades de automatización que pueden mejorar significativamente su operación: atención al cliente 24/7 mediante chatbot con IA conectado a WhatsApp, sistema automatizado para que sus clientes consulten el estatus de sus procesos migratorios en tiempo real, cualificación automática de clientes potenciales que agenden citas directamente, y notificaciones automáticas para mantener a los clientes informados...",
    "fuentes": ["https://ejemplo.com", ...]
  },
  "website_rrss": {
    "linkedin": "https://linkedin.com/...",
    "facebook": "https://facebook.com/...",
    "instagram": "https://instagram.com/...",
    "twitter": "https://twitter.com/..."
  }
}
```

**IMPORTANTE**: El campo `informe.propuesta_valor` contiene la propuesta específica generada por el LLM basada en los problemas automatizables detectados. Esta propuesta se usará directamente en el email.

**Mapeo en n8n**:
- `user_id`: `{{ $json.body.user_id }}` o `{{ $json.user_id }}`
- `lead_id`: `{{ $json.body.lead_id }}` o `{{ $json.lead_id }}`
- `to`: `{{ $json.body.to }}` o `{{ $json.to }}`
- `nombre`: `{{ $json.body.nombre }}` o `{{ $json.nombre }}`
- `website`: `{{ $json.body.website }}` o `{{ $json.website }}`
- `informe`: `{{ $json.body.informe }}` o `{{ $json.informe }}`
- `website_rrss`: `{{ $json.body.website_rrss }}` o `{{ $json.website_rrss }}`

---

## F6.2: Generar Email Personalizado (Opcional)

### Opción A: Usar LLM (OpenAI) para generar email personalizado

#### Paso 1: Añadir nodo OpenAI
1. Arrastra el nodo **"OpenAI"** al canvas (o usa "HTTP Request" si no está disponible)
2. Conecta después del nodo Webhook
3. Configuración:
   - **Operation**: "Chat"
   - **Model**: `gpt-4o` o `gpt-3.5-turbo`
   - **Credential**: Configura tu OpenAI API Key
   - **Messages**:
     ```json
     [
       {
         "role": "system",
         "content": "Eres un experto en redacción de emails comerciales profesionales. Genera emails personalizados, concisos y persuasivos."
       },
       {
         "role": "user",
         "content": "Genera un email profesional para contactar a {{ $json.nombre }} ({{ $json.website }}).\n\nInformación del cliente:\n- Nombre: {{ $json.nombre }}\n- Website: {{ $json.website }}\n- Propuesta de valor según investigación: {{ $json.informe.propuesta_valor }}\n- Puntos de dolor detectados: {{ $json.informe.puntos_dolor }}\n\nEl email debe:\n1. Ser profesional pero cercano\n2. Mencionar algo específico de su negocio\n3. Incluir nuestra propuesta de valor\n4. Tener un call-to-action claro\n5. Ser conciso (máximo 150 palabras)\n\nGenera SOLO el cuerpo del email (sin subject)."
       }
     ]
     ```
4. Guarda la respuesta en una variable (ej: `email_body`)

#### Paso 2: Generar Subject y Body usando Propuesta del Informe
1. Usa el nodo "Set" para crear el email:
   - **Subject**: `"Oportunidad de automatización para {{ $json.nombre }}"`
   - **Body**: Usa `{{ $json.informe.propuesta_valor }}` directamente o envuélvelo en HTML

**VENTAJA**: La propuesta_valor ya está generada específicamente para este negocio basada en el análisis de su página web, así que puedes usarla directamente sin necesidad de generar contenido adicional.

### Opción B: Usar Plantilla con Propuesta de Valor del Informe (RECOMENDADO)

#### Paso 1: Añadir nodo "Set" o "Code"
1. Arrastra el nodo **"Set"** al canvas
2. Configuración:
   - **Subject**: 
     ```
     Oportunidad de automatización para {{ $json.nombre }}
     ```
   - **Body** (HTML) - Usa directamente la propuesta_valor del informe:
     ```html
     <html>
     <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
       <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
         <p>Hola {{ $json.nombre }},</p>
         
         <p>He analizado profundamente tu sitio web ({{ $json.website }}) y he identificado oportunidades específicas de automatización con inteligencia artificial que pueden transformar tu operación.</p>
         
         {{#if $json.informe.problemas_automatizables}}
         <p><strong>Problemas detectados que pueden automatizarse:</strong></p>
         <ul style="margin-left: 20px;">
           {{#each $json.informe.problemas_automatizables}}
           <li style="margin-bottom: 8px;">{{this}}</li>
           {{/each}}
         </ul>
         {{/if}}
         
         <div style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
           <p style="margin: 0;"><strong>Mi Propuesta:</strong></p>
           <p style="margin-top: 10px; margin-bottom: 0;">{{ $json.informe.propuesta_valor }}</p>
         </div>
         
         <p>¿Te gustaría que conversemos sobre cómo podemos implementar estas automatizaciones para tu negocio?</p>
         
         <p>Saludos,<br>
         [Tu nombre]</p>
       </div>
     </body>
     </html>
     ```

**NOTA**: Esta plantilla usa directamente `{{ $json.informe.propuesta_valor }}` que ya contiene la propuesta específica generada por el LLM basada en el análisis de su página web.

---

## F6.3: Enviar Email

### Opción A: Usar SMTP (Gmail, Outlook, etc.)

#### Paso 1: Añadir nodo "Send Email"
1. Arrastra el nodo **"Send Email"** al canvas
2. Conecta después del nodo de generación de email
3. Configuración:
   - **From Email**: Tu email (ej: `tu@email.com`)
   - **To Email**: `{{ $json.to }}`
   - **Subject**: `{{ $json.subject }}` (del nodo anterior)
   - **Email Type**: "HTML"
   - **Message**: `{{ $json.body }}` (del nodo anterior)
   - **SMTP Settings**: Configura tus credenciales SMTP
     - **Host**: `smtp.gmail.com` (para Gmail)
     - **Port**: `587` (TLS) o `465` (SSL)
     - **User**: Tu email
     - **Password**: Tu contraseña o App Password

#### Paso 2: Capturar Message ID
1. Después del nodo Send Email, añade un nodo "Set"
2. Guarda el `messageId` o `message_id` de la respuesta:
   - Variable: `provider_message_id`
   - Valor: `{{ $json.messageId }}` o `{{ $json.message_id }}` (depende del proveedor)

### Opción B: Usar SendGrid

#### Paso 1: Añadir nodo "HTTP Request"
1. Arrastra el nodo **"HTTP Request"** al canvas
2. Configuración:
   - **Method**: `POST`
   - **URL**: `https://api.sendgrid.com/v3/mail/send`
   - **Authentication**: "Generic Credential Type"
   - **Send Headers**:
     - `Authorization`: `Bearer TU_SENDGRID_API_KEY`
     - `Content-Type`: `application/json`
   - **Body** (JSON):
     ```json
     {
       "personalizations": [
         {
           "to": [
             {
               "email": "{{ $json.to }}"
             }
           ],
           "subject": "{{ $json.subject }}"
         }
       ],
       "from": {
         "email": "tu@email.com",
         "name": "Tu Nombre"
       },
       "content": [
         {
           "type": "text/html",
           "value": "{{ $json.body }}"
         }
       ]
     }
     ```

#### Paso 2: Capturar Message ID
1. La respuesta de SendGrid incluye headers con el message ID
2. Usa un nodo "Set" para extraerlo:
   - Variable: `provider_message_id`
   - Valor: `{{ $json.headers['x-message-id'][0] }}`

### Opción C: Usar Resend (Recomendado para producción)

#### Paso 1: Añadir nodo "HTTP Request"
1. Arrastra el nodo **"HTTP Request"** al canvas
2. Configuración:
   - **Method**: `POST`
   - **URL**: `https://api.resend.com/emails`
   - **Send Headers**:
     - `Authorization`: `Bearer TU_RESEND_API_KEY`
     - `Content-Type`: `application/json`
   - **Body** (JSON):
     ```json
     {
       "from": "Tu Nombre <onboarding@resend.dev>",
       "to": ["{{ $json.to }}"],
       "subject": "{{ $json.subject }}",
       "html": "{{ $json.body }}"
     }
     ```

#### Paso 2: Capturar Message ID
1. La respuesta de Resend incluye `id`:
   - Variable: `provider_message_id`
   - Valor: `{{ $json.id }}`

---

## F6.4: Callback a Next.js

### Paso 1: Obtener n8n Run ID
1. Añade un nodo "Set" antes del callback
2. Guarda el `execution_id` o `run_id` de n8n:
   - Variable: `n8n_run_id`
   - Valor: `{{ $execution.id }}` o `{{ $workflow.id }}`

### Paso 2: Añadir nodo HTTP Request (Callback)
1. Arrastra el nodo **"HTTP Request"** al canvas
2. Conecta después del nodo de envío de email
3. Configuración:
   - **Method**: `POST`
   - **URL**: `https://tu-dominio.vercel.app/api/n8n/email-callback` (reemplaza `tu-dominio.vercel.app` con tu URL de producción)
   - **Send Headers**:
     - `Content-Type`: `application/json`
   - **Body** (JSON):
     ```json
     {
       "n8n_run_id": "{{ $json.n8n_run_id }}",
       "lead_id": "{{ $('Webhook').item.json.body.lead_id }}",
       "status": "entregado",
       "provider_message_id": "{{ $json.provider_message_id }}"
     }
     ```

### Paso 3: Manejar Errores
1. Añade un nodo "IF" después del HTTP Request
2. Condición: `{{ $json.statusCode }} === 200`
3. **Si éxito**: Continúa normalmente
4. **Si error**: 
   - Opción A: Reintentar (añadir nodo "Wait" y volver a intentar)
   - Opción B: Enviar notificación de error
   - Opción C: Loggear el error

---

## F6.5: Monitoreo de Respuestas (Opcional - Avanzado)

### Paso 1: Configurar Webhook Entrante para Respuestas
1. Crea un nuevo workflow en n8n llamado "EMAIL Response Handler"
2. Añade un nodo "Webhook" (Catch):
   - **Path**: `/email-response`
   - **Method**: `POST`
   - Activa "Production"

### Paso 2: Configurar en tu Proveedor de Email
- **SendGrid**: Configura "Inbound Parse" en Settings → Inbound Parse
- **Mailgun**: Configura "Routes" para reenviar respuestas al webhook
- **Resend**: Usa "Webhooks" en Settings para recibir eventos

### Paso 3: Detectar Respuesta
1. En el webhook, verifica si el email es respuesta a un mensaje enviado
2. Busca el `lead_id` asociado al email original
3. Llama al callback de Next.js con `status: 'respondido'`:
   ```json
   {
     "n8n_run_id": "...",
     "lead_id": "...",
     "status": "respondido",
     "response_text": "{{ $json.body }}"
   }
   ```

---

## Estructura Completa del Workflow

```
[Webhook] → [Generar Email (Opcional)] → [Enviar Email] → [Callback Next.js]
                ↓                              ↓
         [OpenAI/Plantilla]            [Capturar Message ID]
```

---

## Payload de Ejemplo para Testing

Puedes usar este payload para probar el workflow:

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "lead_id": "123e4567-e89b-12d3-a456-426614174001",
  "to": "test@ejemplo.com",
  "nombre": "Empresa Ejemplo",
  "website": "https://ejemplo.com",
  "informe": {
    "resumen": "Empresa dedicada a servicios legales...",
    "servicios": ["Asesoría legal", "Consultoría"],
    "presencia_online": {
      "website_titulo": "Bufete Ejemplo",
      "seguidores_aprox": {
        "instagram": 500,
        "facebook": 300,
        "linkedin": null,
        "twitter": null
      }
    },
    "logros_y_prensa": [],
    "puntos_dolor": ["Web desactualizada", "Poca presencia en redes"],
    "propuesta_valor": "Podemos ayudar a modernizar su presencia online",
    "fuentes": ["https://ejemplo.com"]
  },
  "website_rrss": {
    "linkedin": null,
    "facebook": "https://facebook.com/ejemplo",
    "instagram": "https://instagram.com/ejemplo",
    "twitter": null
  }
}
```

---

## Troubleshooting

### Error: "Email no enviado"
- Verifica las credenciales SMTP/API
- Revisa los logs de n8n
- Verifica que el formato del email es correcto

### Error: "Callback falló"
- Verifica que la URL de Next.js es correcta
- Verifica que el endpoint `/api/n8n/email-callback` existe
- Revisa los logs de Next.js en Vercel

### Email no personalizado
- Verifica que el nodo de generación de email está conectado correctamente
- Revisa que las variables están mapeadas correctamente
- Verifica que el prompt del LLM es correcto

---

## Notas Importantes

1. **Rate Limits**: Respeta los límites de tu proveedor de email
2. **SPAM**: Asegúrate de cumplir con las políticas anti-spam
3. **Privacidad**: No expongas información sensible en los logs
4. **Testing**: Prueba primero con tu propio email antes de enviar a leads reales

---

## Checklist de Configuración

- [ ] Webhook configurado y URL guardada en `.env.local`
- [ ] Credenciales de email provider configuradas
- [ ] Nodo de generación de email funcionando (si aplica)
- [ ] Nodo de envío de email funcionando
- [ ] `provider_message_id` capturado correctamente
- [ ] Callback a Next.js funcionando
- [ ] Probado con email de prueba
- [ ] Verificado que el callback actualiza `thor_outbound_messages`
- [ ] Verificado que el status del lead se actualiza a `email_enviado`

---

## Próximos Pasos

Después de configurar este workflow:
1. Prueba enviando un email desde la UI del CRM
2. Verifica que aparece en `thor_outbound_messages`
3. Verifica que el callback actualiza el estado correctamente
4. Configura monitoreo de respuestas (F6.5) si es necesario

