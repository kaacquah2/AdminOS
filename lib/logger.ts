type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private isProduction = process.env.NODE_ENV === "production"

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""
    const errorStr = error ? `\nError: ${error.message}\nStack: ${error.stack}` : ""
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    const formatted = this.formatMessage(entry)

    // In development, log to console with colors
    if (this.isDevelopment) {
      switch (level) {
        case "debug":
          console.debug(formatted)
          break
        case "info":
          console.info(formatted)
          break
        case "warn":
          console.warn(formatted)
          break
        case "error":
          console.error(formatted)
          break
      }
    } else {
      // In production, use structured logging
      // TODO: Integrate with logging service (e.g., Datadog, CloudWatch, etc.)
      console.log(JSON.stringify(entry))
    }

    // TODO: Send critical errors to error tracking service (e.g., Sentry)
    if (level === "error" && this.isProduction) {
      // logErrorToService(entry)
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      this.log("debug", message, context)
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log("error", message, context, error)
  }
}

export const logger = new Logger()

// Request logging middleware helper
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  logger.info("HTTP Request", {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    userId,
  })
}

