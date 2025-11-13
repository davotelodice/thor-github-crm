/**
 * Función LLM de investigación
 * Usa el factory pattern para seleccionar el proveedor activo
 */

import { investigateLead } from './index'
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
 * Genera un informe de investigación usando LLM (OpenAI o Perplexity)
 */
export async function generateInvestigationReport(
  data: InvestigateData
): Promise<InformeJSON> {
  return await investigateLead(data)
}

