/**
 * Configuración del proveedor LLM
 * Soporta OpenAI y Perplexity
 */

export type LLMProvider = 'openai' | 'perplexity'

interface LLMConfig {
  provider: LLMProvider
  apiKey: string
}

/**
 * Obtiene la configuración del LLM desde variables de entorno
 */
export function getLLMConfig(): LLMConfig | null {
  const provider = (process.env.LLM_PROVIDER || 'openai') as LLMProvider

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.warn('OPENAI_API_KEY no está configurada')
      return null
    }
    return { provider: 'openai', apiKey }
  }

  if (provider === 'perplexity') {
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      console.warn('PERPLEXITY_API_KEY no está configurada')
      return null
    }
    return { provider: 'perplexity', apiKey }
  }

  console.warn(`Proveedor LLM desconocido: ${provider}`)
  return null
}

/**
 * Valida que la configuración del LLM esté completa
 */
export function validateLLMConfig(): { valid: boolean; error?: string } {
  const config = getLLMConfig()
  if (!config) {
    const provider = process.env.LLM_PROVIDER || 'openai'
    const keyName =
      provider === 'openai' ? 'OPENAI_API_KEY' : 'PERPLEXITY_API_KEY'
    return {
      valid: false,
      error: `${keyName} no está configurada`,
    }
  }
  return { valid: true }
}

