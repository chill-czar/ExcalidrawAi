/**
 * Structured Logger
 *
 * Provides consistent logging across the application with contextual information.
 * Can be extended to support external logging services (e.g., Datadog, Sentry).
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogContext {
  module?: string;
  operation?: string;
  userId?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Format log entry for output
   */
  private format(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
    ];

    if (entry.context?.module) {
      parts.push(`[${entry.context.module}]`);
    }

    if (entry.context?.operation) {
      parts.push(`[${entry.context.operation}]`);
    }

    parts.push(entry.message);

    return parts.join(" ");
  }

  /**
   * Should log based on minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formatted = this.format(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted, context, error);
        break;
      case LogLevel.INFO:
        console.info(formatted, context);
        break;
      case LogLevel.WARN:
        console.warn(formatted, context, error);
        break;
      case LogLevel.ERROR:
        console.error(formatted, context, error);
        break;
    }

    // Future: Send to external logging service
    this.sendToExternalService(entry);
  }

  /**
   * Send logs to external service (future implementation)
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging (Datadog, Sentry, etc.)
    // Only send errors and warnings in production
    if (!this.isDevelopment && (entry.level === LogLevel.ERROR || entry.level === LogLevel.WARN)) {
      // Implement external service integration here
    }
  }

  /**
   * Public logging methods
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Create a child logger with default context
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

/**
 * Child Logger with preset context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.parent.warn(message, this.mergeContext(context), error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.parent.error(message, this.mergeContext(context), error);
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;

/**
 * Create module-specific loggers
 */
export function createModuleLogger(moduleName: string): ChildLogger {
  return logger.child({ module: moduleName });
}

/**
 * Example usage:
 *
 * // In a module file:
 * const log = createModuleLogger('drawing');
 *
 * // In service methods:
 * log.info('Generating drawing', { operation: 'generateDrawing', prompt: 'example' });
 * log.error('Failed to generate drawing', { operation: 'generateDrawing' }, error);
 */
