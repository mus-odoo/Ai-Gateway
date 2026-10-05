type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * مسجل بسيط قابل للاستبدال بـ Pino أو Winston لاحقاً
 */
export class Logger {
  constructor(
    private readonly context: string,
    private readonly level: LogLevel = 'info',
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...meta,
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }
}