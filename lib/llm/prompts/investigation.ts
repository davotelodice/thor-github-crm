/**
 * Prompt base para investigación de leads
 * Enfoque: Analizar página web del negocio y detectar problemas automatizables con IA
 */

interface InvestigationData {
  nombre: string | null
  website: string | null
  emails: string[]
  linkedin: string | null
  facebook: string | null
  instagram: string | null
  twitter: string | null
}

/**
 * Construye el prompt para la investigación del lead
 */
export function buildInvestigationPrompt(data: InvestigationData): string {
  const {
    nombre,
    website,
    emails,
    linkedin,
    facebook,
    instagram,
    twitter,
  } = data

  const rrssLinks = []
  if (linkedin) rrssLinks.push(`LinkedIn: ${linkedin}`)
  if (facebook) rrssLinks.push(`Facebook: ${facebook}`)
  if (instagram) rrssLinks.push(`Instagram: ${instagram}`)
  if (twitter) rrssLinks.push(`Twitter: ${twitter}`)

  const prompt = `IMPORTANTE: Debes responder SOLO con un objeto JSON válido, sin markdown, sin explicaciones adicionales. El JSON debe seguir exactamente el esquema especificado al final.

Eres un experto en análisis de negocios y automatización con inteligencia artificial. Tu tarea es INVESTIGAR PROFUNDAMENTE la página web del negocio para identificar problemas que puedan automatizarse con IA.

**INFORMACIÓN INICIAL DISPONIBLE:**
- Nombre: ${nombre || 'No disponible'}
- Website: ${website || 'No disponible'} ⚠️ **ESTE ES EL FOCO PRINCIPAL DE TU INVESTIGACIÓN**
- Emails: ${emails.length > 0 ? emails.join(', ') : 'No disponibles'}
${rrssLinks.length > 0 ? `- Redes Sociales:\n${rrssLinks.map((l) => `  - ${l}`).join('\n')}` : '- Redes Sociales: No disponibles'}

**INSTRUCCIONES CRÍTICAS - DEBES ENTRAR EN LA PÁGINA WEB:**

1. **ENTRA Y ANALIZA LA PÁGINA WEB DEL NEGOCIO** (OBLIGATORIO):
   - **DEBES VISITAR**: ${website || 'El website proporcionado'}
   - Analiza TODAS las páginas principales:
     * Página de inicio
     * Página de servicios/productos
     * Página "Sobre nosotros" o "Quiénes somos"
     * Página de contacto
     * Formularios de contacto
     * Blog o noticias (si existe)
   - Identifica:
     * Cómo se contactan los clientes actualmente
     * Qué procesos manuales tienen
     * Qué información solicitan a los clientes
     * Cómo gestionan consultas o citas
     * Cómo dan seguimiento a clientes

2. **BUSCA PROBLEMAS QUE SE PUEDAN AUTOMATIZAR CON IA**:
   Analiza la página web y busca específicamente:
   
   **Para Abogados (ejemplo, pero aplica a cualquier negocio)**:
   - ¿Tienen atención al cliente 24/7? Si no, es un problema automatizable
   - ¿Los clientes pueden consultar el estatus de su proceso/caso? Si no, es automatizable
   - ¿Tienen conexión a WhatsApp automatizada? Si no, es automatizable
   - ¿Cualifican clientes potenciales automáticamente? Si no, es automatizable
   - ¿Gestionan citas automáticamente? Si no, es automatizable
   - ¿Envían notificaciones automáticas a clientes? Si no, es automatizable
   - ¿Tienen chatbot o asistente virtual? Si no, es automatizable
   
   **Para cualquier negocio, busca**:
   - Procesos manuales que consumen tiempo
   - Falta de automatización en atención al cliente
   - Ausencia de sistemas de seguimiento automatizado
   - Falta de cualificación automática de leads
   - Procesos repetitivos que hacen manualmente
   - Falta de notificaciones automáticas
   - Ausencia de integración con WhatsApp/chat
   - Falta de sistemas de gestión automatizada

3. **INVESTIGA EN INTERNET** (para contexto adicional):
   - Busca información sobre el sector/industria del negocio
   - Identifica mejores prácticas de automatización en ese sector
   - Busca reseñas o comentarios que mencionen problemas de atención o gestión

4. **INCLUYE EVIDENCIA DE TU INVESTIGACIÓN**:
   - DEBES incluir el website analizado en "fuentes"
   - Si visitaste otras páginas del sitio, inclúyelas también
   - Si consultaste información adicional, incluye esas URLs

**OBJETIVO PRINCIPAL:**
Generar una propuesta de valor específica basada en problemas reales que detectaste en su página web y que pueden automatizarse con inteligencia artificial.

**ESTRUCTURA DEL INFORME:**

1. **Resumen**: Un resumen ejecutivo de 2-3 párrafos sobre el negocio basado en tu análisis de su página web
2. **Servicios**: Lista detallada de servicios que ofrece (extraído de su website)
3. **Presencia Online**:
   - Título del sitio web (obténlo del <title> o H1 de la página principal)
   - Seguidores aproximados en redes sociales (si puedes verificarlos)
4. **Logros y Prensa**: Logros, premios, menciones que encuentres (array de strings)
5. **Puntos de Dolor**: Problemas generales detectados (ej: web desactualizada, poca presencia online, etc.)
6. **Problemas Automatizables** (CRÍTICO): 
   - Lista específica de problemas que detectaste en su página web que pueden automatizarse con IA
   - Ejemplos:
     * "Atención al cliente limitada a horario de oficina - puede automatizarse 24/7"
     * "No tienen sistema para que clientes consulten estatus de procesos - automatizable con IA"
     * "Falta conexión a WhatsApp para atención inmediata - automatizable"
     * "No cualifican clientes potenciales automáticamente - puede automatizarse"
     * "Gestión de citas es manual - puede automatizarse con chatbot"
     * "No envían notificaciones automáticas a clientes - automatizable"
   - Sé específico y basado en lo que viste en su website
7. **Propuesta de Valor** (CRÍTICO):
   - Propuesta específica y detallada basada en los problemas automatizables que detectaste
   - Debe mencionar cómo la automatización con IA puede resolver esos problemas específicos
   - Ejemplo para abogados:
     "Basándome en el análisis de su página web, he identificado oportunidades de automatización que pueden mejorar significativamente su operación: atención al cliente 24/7 mediante chatbot con IA conectado a WhatsApp, sistema automatizado para que sus clientes consulten el estatus de sus procesos migratorios en tiempo real, cualificación automática de clientes potenciales que agenden citas directamente, y notificaciones automáticas para mantener a los clientes informados. Esto liberará tiempo de su equipo para enfocarse en casos complejos mientras la IA maneja consultas frecuentes y seguimiento."
   - Debe ser específica, convincente y basada en problemas reales detectados
8. **Fuentes**: 
   - URLs COMPLETAS de todas las páginas que visitaste
   - DEBE incluir el website principal analizado
   - Si consultaste información adicional, incluye esas URLs

**IMPORTANTE - VERIFICACIÓN:**
- DEBES incluir el website analizado en "fuentes" como prueba de que lo visitaste
- Los "problemas_automatizables" deben ser específicos y basados en lo que viste en su página web
- La "propuesta_valor" debe estar directamente relacionada con los problemas automatizables identificados
- NO inventes problemas - solo incluye lo que realmente detectaste en tu análisis
- Si no encuentras problemas automatizables específicos, menciona oportunidades generales basadas en el sector

**FORMATO DE SALIDA (JSON):**
{
  "resumen": "string",
  "servicios": ["string"],
  "presencia_online": {
    "website_titulo": "string",
    "seguidores_aprox": {
      "instagram": number | null,
      "facebook": number | null,
      "linkedin": number | null,
      "twitter": number | null
    }
  },
  "logros_y_prensa": ["string"],
  "puntos_dolor": ["string"],
  "problemas_automatizables": ["string"],
  "propuesta_valor": "string",
  "fuentes": ["string"]
}

**RECUERDA**: Tu investigación debe demostrar que realmente entraste y analizaste la página web del negocio. La propuesta de valor debe ser específica y basada en problemas reales que detectaste.

Ahora entra en la página web ${website || 'proporcionada'}, analízala profundamente, identifica problemas automatizables y genera el informe completo:`

  return prompt
}
