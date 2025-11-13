/**
 * Tipos de error personalizados para el sistema
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} con ID ${id} no encontrado`
      : `${resource} no encontrado`
    super(message, 'NOT_FOUND', 404)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado para realizar esta acción') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    public originalError?: Error,
    public url?: string
  ) {
    super(message, 'NETWORK_ERROR', 503)
  }
}

export class LLMError extends AppError {
  constructor(
    message: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message, 'LLM_ERROR', 502)
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = 'Límite de solicitudes excedido',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429)
  }
}

/**
 * Helper para convertir errores a formato de respuesta
 */
export function errorToResponse(error: unknown): {
  success: false
  error: string
  code?: string
  statusCode?: number
} {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    }
  }

  return {
    success: false,
    error: 'Error desconocido',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  }
}

