/**
 * Helpers HTTP para comunicación con n8n webhooks
 */

interface ScrapeWebhookPayload {
  run_id: string
  user_id: string
  keyword: string
  location: string
  limit: number
}

interface EmailWebhookPayload {
  user_id: string
  lead_id: string
  to: string
  nombre: string
  website: string
  informe: any
  website_rrss: {
    linkedin?: string | null
    facebook?: string | null
    instagram?: string | null
    twitter?: string | null
  }
}

/**
 * POST a webhook de SCRAPE de n8n
 * SIN TIMEOUT - permite esperar el tiempo necesario
 */
export async function postToScrapeWebhook(
  payload: ScrapeWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.SCRAPE_WEBHOOK_URL

  if (!webhookUrl) {
    return {
      success: false,
      error: 'SCRAPE_WEBHOOK_URL no está configurada',
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // SIN timeout - permite esperar el tiempo necesario
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Error desconocido')
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'Error desconocido al comunicarse con n8n',
    }
  }
}

/**
 * POST a webhook de EMAIL de n8n
 * SIN TIMEOUT - permite esperar el tiempo necesario para generar y enviar el email
 */
export async function postToEmailWebhook(
  payload: EmailWebhookPayload
): Promise<{ success: boolean; n8n_run_id?: string; error?: string }> {
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL

  if (!webhookUrl) {
    return {
      success: false,
      error: 'EMAIL_WEBHOOK_URL no está configurada',
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // SIN timeout - permite esperar el tiempo necesario para generar y enviar el email
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Error desconocido')
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      }
    }

    // n8n puede devolver un run_id en el body
    const responseData = await response.json().catch(() => ({}))
    const n8n_run_id = responseData.execution_id || responseData.run_id || null

    return { success: true, n8n_run_id: n8n_run_id || undefined }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'Error desconocido al comunicarse con n8n',
    }
  }
}

