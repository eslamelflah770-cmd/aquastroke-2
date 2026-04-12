/**
 * AQUASTROKE Backend - Logger
 * Comprehensive logging utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  error?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production'

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
    }
  }

  private output(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    
    if (this.isDevelopment) {
      const color = this.getColorCode(entry.level)
      const reset = '\x1b[0m'
      
      if (entry.data) {
        console.log(`${color}${prefix}${reset} ${entry.message}`, entry.data)
      } else {
        console.log(`${color}${prefix}${reset} ${entry.message}`)
      }
    } else {
      // Production: output as JSON for structured logging
      console.log(JSON.stringify(entry))
    }
  }

  private getColorCode(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    }
    return colors[level]
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      this.output(this.formatLog('debug', message, data))
    }
  }

  info(message: string, data?: any): void {
    this.output(this.formatLog('info', message, data))
  }

  warn(message: string, data?: any): void {
    this.output(this.formatLog('warn', message, data))
  }

  error(message: string, error?: any): void {
    const entry = this.formatLog('error', message)
    if (error instanceof Error) {
      entry.error = error.stack
    } else if (typeof error === 'object') {
      entry.data = error
    } else {
      entry.error = String(error)
    }
    this.output(entry)
  }

  log(level: LogLevel, message: string, data?: any): void {
    this.output(this.formatLog(level, message, data))
  }

  // HTTP request logging
  httpRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    const message = `${method} ${path}`
    const data = {
      statusCode,
      duration: `${duration}ms`,
      userId: userId || 'anonymous',
    }
    
    const level = statusCode >= 400 ? 'warn' : 'info'
    this.log(level, message, data)
  }

  // Database operation logging
  dbOperation(operation: string, table: string, duration: number, success: boolean): void {
    const message = `DB ${operation} on ${table}`
    const data = {
      duration: `${duration}ms`,
      success,
    }
    
    const level = success ? 'debug' : 'warn'
    this.log(level, message, data)
  }

  // API call logging
  apiCall(method: string, endpoint: string, statusCode: number, duration: number): void {
    const message = `API ${method} ${endpoint}`
    const data = {
      statusCode,
      duration: `${duration}ms`,
    }
    
    const level = statusCode >= 400 ? 'warn' : 'debug'
    this.log(level, message, data)
  }

  // Authentication logging
  authentication(action: string, userId?: string, success?: boolean): void {
    const message = `Auth ${action}`
    const data = {
      userId: userId || 'unknown',
      success,
    }
    
    const level = success === false ? 'warn' : 'info'
    this.log(level, message, data)
  }

  // Validation logging
  validation(field: string, error: string): void {
    this.warn(`Validation error on ${field}`, { error })
  }

  // Performance logging
  performance(operation: string, duration: number, threshold = 1000): void {
    if (duration > threshold) {
      this.warn(`Slow operation: ${operation}`, { duration: `${duration}ms` })
    } else {
      this.debug(`Operation completed: ${operation}`, { duration: `${duration}ms` })
    }
  }
}

export const logger = new Logger()
