/**
 * Factory pattern para obtener el proveedor LLM activo
 */

import { getLLMConfig, validateLLMConfig } from './config'
import { generateInvestigationReport as openaiGenerate } from './providers/openai'
import { generateInvestigationReport as perplexityGenerate } from './providers/perplexity'
import type { InformeJSON } from '@/lib/types'

interface InvestigateData {
  nombre: string | null
  website: string | null
  emails: string[]
  linkedin: string | null
  facebook: string | null
  instagram: string | null
  twitter: string | null
}

/**
 * Obtiene el proveedor LLM activo según configuración
 */
export function getLLMProvider() {
  const config = getLLMConfig()

  if (!config) {
    throw new Error('LLM no está configurado. Verifica las variables de entorno.')
  }

  const validation = validateLLMConfig()
  if (!validation.valid) {
    throw new Error(validation.error || 'Configuración LLM inválida')
  }

  return config.provider
}

/**
 * Genera un informe de investigación usando el proveedor LLM configurado
 */
export async function investigateLead(data: InvestigateData): Promise<InformeJSON> {
  const provider = getLLMProvider()

  if (provider === 'openai') {
    return await openaiGenerate(data)
  }

  if (provider === 'perplexity') {
    return await perplexityGenerate(data)
  }

  throw new Error(`Proveedor LLM no soportado: ${provider}`)
}

