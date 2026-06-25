type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const log: Record<string, unknown> = {
      timestamp,
      level,
      message,
    };
    if (data !== undefined) {
      log.data = data;
    }
    return log;
  }

  debug(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown) {
    const log = this.formatMessage('info', message, data);
    console.info(log);
    // TODO: Send to observability service
  }

  warn(message: string, data?: unknown) {
    const log = this.formatMessage('warn', message, data);
    console.warn(log);
    // TODO: Send to observability service
  }

  error(message: string, data?: unknown) {
    const log = this.formatMessage('error', message, data);
    console.error(log);
    // TODO: Send to observability service (e.g., Sentry)
  }
}

export const logger = new Logger();
