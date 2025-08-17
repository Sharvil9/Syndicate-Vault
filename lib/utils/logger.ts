type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  userId?: string
  requestId?: string
  sessionId?: string
  action?: string
  resource?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info"
  private logs: Array<{ level: LogLevel; message: string; context?: LogContext; timestamp: string }> = []
  private maxLogs = 1000

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }
    return levels[level] >= levels[this.logLevel]
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  private storeLog(level: LogLevel, message: string, context?: LogContext): void {
    this.logs.push({
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    })

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog("debug")) {
      this.storeLog("debug", message, context)
      console.debug(this.formatMessage("debug", message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog("info")) {
      this.storeLog("info", message, context)
      console.info(this.formatMessage("info", message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog("warn")) {
      this.storeLog("warn", message, context)
      console.warn(this.formatMessage("warn", message, context))
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog("error")) {
      const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context
      this.storeLog("error", message, errorContext)
      console.error(this.formatMessage("error", message, errorContext))
    }
  }

  getLogs(
    level?: number,
    limit?: number,
  ): Array<{ level: LogLevel; message: string; context?: LogContext; timestamp: string }> {
    let filteredLogs = this.logs

    if (level !== undefined) {
      const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
      const levelNames = Object.keys(levels) as LogLevel[]
      const targetLevel = levelNames[level]
      if (targetLevel) {
        filteredLogs = this.logs.filter((log) => levels[log.level] >= levels[targetLevel])
      }
    }

    return limit ? filteredLogs.slice(-limit) : filteredLogs
  }

  // Audit logging for security-sensitive operations
  audit(action: string, context: LogContext): void {
    this.info(`AUDIT: ${action}`, { ...context, audit: true })
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`PERF: ${operation} took ${duration}ms`, { ...context, performance: true, duration })
  }
}

export const logger = new Logger()

// Performance measurement utility
export function measurePerformance<T>(operation: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      logger.performance(operation, duration, context)
      resolve(result)
    } catch (error) {
      const duration = Date.now() - start
      logger.error(`${operation} failed after ${duration}ms`, context, error as Error)
      reject(error)
    }
  })
}

// Request ID generator
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}
