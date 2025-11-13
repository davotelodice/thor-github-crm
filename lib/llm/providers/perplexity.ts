/**
 * Implementación del proveedor Perplexity
 */

import { z } from 'zod'
import { getLLMConfig } from '../config'
import { buildInvestigationPrompt } from '../prompts/investigation'
import { InformeSchema } from '../validation'
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
 * Genera un informe de investigación usando Perplexity
 */
export async function generateInvestigationReport(
  data: InvestigateData
): Promise<InformeJSON> {
  const config = getLLMConfig()

  if (!config || config.provider !== 'perplexity') {
    throw new Error('Perplexity no está configurado correctamente')
  }

  const prompt = buildInvestigationPrompt(data)

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online', // Modelo con capacidad de búsqueda web en tiempo real
        messages: [
          {
            role: 'system',
            content:
              'Eres un experto en análisis de negocios con acceso a búsqueda web en tiempo real. Realiza búsquedas activas en internet para investigar empresas y personas. Responde SOLO con JSON válido, sin markdown, sin explicaciones adicionales.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000, // Aumentado para permitir informes más detallados
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Perplexity API error: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`
      )
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Perplexity no devolvió contenido')
    }

    // Parsear JSON
    let parsed: any
    try {
      // Limpiar markdown code blocks si existen
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsed = JSON.parse(cleanedContent)
    } catch (parseError) {
      throw new Error(`Error al parsear JSON de Perplexity: ${parseError}`)
    }

    // Validar con Zod
    const validated = InformeSchema.parse(parsed)

    return validated as InformeJSON
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Informe inválido: ${error.issues.map((i) => i.message).join(', ')}`
      )
    }
    throw error
  }
}

