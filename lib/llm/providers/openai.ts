/**
 * Implementación del proveedor OpenAI
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
 * Genera un informe de investigación usando OpenAI
 */
export async function generateInvestigationReport(
  data: InvestigateData
): Promise<InformeJSON> {
  const config = getLLMConfig()

  if (!config || config.provider !== 'openai') {
    throw new Error('OpenAI no está configurado correctamente')
  }

  const prompt = buildInvestigationPrompt(data)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Usar gpt-4o-mini que es más económico y confiable
        messages: [
          {
            role: 'system',
            content:
              'Eres un experto en análisis de negocios. Responde SOLO con JSON válido, sin markdown, sin explicaciones adicionales. El JSON debe seguir el esquema exacto solicitado.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000, // Aumentado para permitir informes más detallados
        response_format: { type: 'json_object' }, // Forzar formato JSON
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`
      )
    }

    const result = await response.json()
    
    // Debug: Log completo de la respuesta para diagnosticar
    console.log('OpenAI Response:', JSON.stringify(result, null, 2))
    
    const choice = result.choices?.[0]
    const content = choice?.message?.content
    const finishReason = choice?.finish_reason

    if (!content) {
      // Proporcionar más información sobre por qué no hay contenido
      const errorDetails = {
        finish_reason: finishReason,
        has_choices: !!result.choices,
        choices_length: result.choices?.length || 0,
        result_keys: Object.keys(result),
        full_result: result,
      }
      console.error('OpenAI no devolvió contenido:', errorDetails)
      
      let errorMessage = 'OpenAI no devolvió contenido'
      if (finishReason === 'length') {
        errorMessage = 'La respuesta fue cortada por límite de tokens. Intenta con un prompt más corto.'
      } else if (finishReason === 'content_filter') {
        errorMessage = 'La respuesta fue filtrada por políticas de contenido.'
      } else if (finishReason === 'stop') {
        errorMessage = 'La respuesta se detuvo inesperadamente.'
      } else if (finishReason) {
        errorMessage = `OpenAI no devolvió contenido. Razón: ${finishReason}`
      }
      
      throw new Error(errorMessage)
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
      throw new Error(`Error al parsear JSON de OpenAI: ${parseError}`)
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

