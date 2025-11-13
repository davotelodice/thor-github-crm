/**
 * Schema Zod para validar el informe JSON del LLM
 */

import { z } from 'zod'

export const InformeSchema = z.object({
  resumen: z.string().min(10, 'El resumen debe tener al menos 10 caracteres'),
  servicios: z.array(z.string()).min(0),
  presencia_online: z.object({
    website_titulo: z.string(),
    seguidores_aprox: z.object({
      instagram: z.number().nullable(),
      facebook: z.number().nullable(),
      linkedin: z.number().nullable(),
      twitter: z.number().nullable(),
    }),
  }),
  logros_y_prensa: z.array(z.string()).min(0),
  puntos_dolor: z.array(z.string()).min(0),
  problemas_automatizables: z.array(z.string()).min(0, 'Debe identificar al menos problemas potenciales de automatización'),
  propuesta_valor: z.string().min(50, 'La propuesta de valor debe tener al menos 50 caracteres y ser específica'),
  fuentes: z.array(z.string()).min(1, 'Debe incluir al menos una fuente (el website analizado)'),
})

export type InformeValidated = z.infer<typeof InformeSchema>

