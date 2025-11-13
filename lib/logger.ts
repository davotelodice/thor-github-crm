/**
 * Sistema de logging estructurado
 * No loggea datos sensibles (emails, passwords, tokens)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

/**
 * Sanitiza datos sensibles antes de loggear
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'email',
    'token',
    'api_key',
    'apiKey',
    'authorization',
    'auth',
    'secret',
    'access_token',
    'refresh_token',
  ]

  const sanitized = { ...data }

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]'
    }
  }

  // Sanitizar objetos anidados
  for (const [key, value] of Object.entries(sanitized)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>)
    }
  }

  return sanitized
}

/**
 * Formatea el log entry como JSON
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry)
}

/**
 * Logger principal
 */
class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? sanitizeData(context) : undefined,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          }
        : undefined,
    }

    const formatted = formatLog(entry)

    // En desarrollo, usar console con colores
    if (process.env.NODE_ENV === 'development') {
      switch (level) {
        case 'error':
          console.error(formatted)
          break
        case 'warn':
          console.warn(formatted)
          break
        case 'debug':
          console.debug(formatted)
          break
        default:
          console.log(formatted)
      }
    } else {
      // En producción, siempre usar console.log (para servicios como Vercel Logs)
      console.log(formatted)
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('warn', message, context, error)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error)
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context)
    }
  }
}

export const logger = new Logger()

