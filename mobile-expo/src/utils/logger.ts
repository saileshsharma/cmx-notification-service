/**
 * Logger Utility - Enhanced logging service with:
 * - File persistence for crash reports
 * - Log rotation and size limits
 * - Export functionality for debugging
 * - Sentry integration for error tracking
 */
import { Paths, File } from 'expo-file-system';
import {
  captureException,
  captureMessage,
  addSentryBreadcrumb,
  SENTRY_DSN,
} from '../config/sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

interface LoggerConfig {
  maxMemoryLogs: number;
  maxFileLogs: number;
  persistErrors: boolean;
  persistWarnings: boolean;
  logFileName: string;
}

const DEFAULT_CONFIG: LoggerConfig = {
  maxMemoryLogs: 100,
  maxFileLogs: 500,
  persistErrors: true,
  persistWarnings: true,
  logFileName: 'app-logs.json',
};

class Logger {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private isDebugMode: boolean = __DEV__;
  private sentryEnabled: boolean = !!SENTRY_DSN;
  private config: LoggerConfig;
  private logFile: File;
  private isPersisting: boolean = false;
  private pendingPersist: boolean = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logFile = new File(Paths.document, this.config.logFileName);

    // Load persisted logs on init
    this.loadPersistedLogs();
  }

  private async loadPersistedLogs(): Promise<void> {
    try {
      if (this.logFile.exists) {
        const content = await this.logFile.text();
        const persistedLogs = JSON.parse(content) as LogEntry[];
        // Prepend persisted logs (older logs)
        this.logs = [...persistedLogs.slice(-50), ...this.logs]; // Keep last 50 from file
      }
    } catch (error) {
      // Ignore errors loading persisted logs
    }
  }

  private createEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    // Only persist errors and warnings
    if (entry.level !== 'error' && entry.level !== 'warn') {
      return;
    }

    if (!this.config.persistErrors && entry.level === 'error') return;
    if (!this.config.persistWarnings && entry.level === 'warn') return;

    // Debounce persistence
    if (this.isPersisting) {
      this.pendingPersist = true;
      return;
    }

    this.isPersisting = true;

    try {
      let existingLogs: LogEntry[] = [];

      if (this.logFile.exists) {
        const content = await this.logFile.text();
        existingLogs = JSON.parse(content) as LogEntry[];
      }

      // Add new log and trim to max size
      existingLogs.push(entry);
      if (existingLogs.length > this.config.maxFileLogs) {
        existingLogs = existingLogs.slice(-this.config.maxFileLogs);
      }

      await this.logFile.write(JSON.stringify(existingLogs, null, 2));
    } catch (error) {
      // Silently fail file operations
    } finally {
      this.isPersisting = false;

      // Handle pending persist
      if (this.pendingPersist) {
        this.pendingPersist = false;
        // Get last error/warn log that needs persisting
        const lastImportant = this.logs.filter(
          l => l.level === 'error' || l.level === 'warn'
        ).pop();
        if (lastImportant) {
          this.persistLog(lastImportant);
        }
      }
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry = this.createEntry(level, message, data);
    this.logs.push(entry);

    // Keep only last maxMemoryLogs entries in memory
    if (this.logs.length > this.config.maxMemoryLogs) {
      this.logs = this.logs.slice(-this.config.maxMemoryLogs);
    }

    // Output to console in development
    if (this.isDebugMode || level === 'error' || level === 'warn') {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
      switch (level) {
        case 'debug':
          console.log(prefix, message, data ?? '');
          break;
        case 'info':
          console.info(prefix, message, data ?? '');
          break;
        case 'warn':
          console.warn(prefix, message, data ?? '');
          break;
        case 'error':
          console.error(prefix, message, data ?? '');
          break;
      }
    }

    // Add breadcrumb to Sentry for all log levels
    if (this.sentryEnabled) {
      const sentryLevel = level === 'warn' ? 'warning' : level;
      addSentryBreadcrumb({
        category: 'log',
        message: message,
        level: sentryLevel,
        data: data ? { data } : undefined,
      });
    }

    // Persist errors and warnings to file
    if (level === 'error' || level === 'warn') {
      this.persistLog(entry);
    }

    this.notifyListeners();
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown): void {
    let errorData: unknown;
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorData = { error: error.message, stack: error.stack };
    } else if (error && typeof error === 'object') {
      // Handle plain objects (like { type: 'error', url: '...' })
      errorMessage = JSON.stringify(error);
      errorData = error;
    } else if (error !== undefined) {
      errorMessage = String(error);
      errorData = { error: errorMessage };
    } else {
      errorMessage = 'Unknown error';
      errorData = undefined;
    }

    this.log('error', message, errorData);

    // Send error to Sentry
    if (this.sentryEnabled && error instanceof Error) {
      captureException(error, { logMessage: message });
    } else if (this.sentryEnabled && error) {
      captureMessage(`${message}: ${errorMessage}`, 'error', errorData as Record<string, unknown>);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  clear(): void {
    this.logs = [];
    this.notifyListeners();
  }

  async clearPersistedLogs(): Promise<void> {
    try {
      if (this.logFile.exists) {
        await this.logFile.delete();
      }
    } catch (error) {
      // Ignore errors
    }
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getLogs()));
  }

  setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  /**
   * Export logs as a JSON string (for debugging/support)
   */
  async exportLogs(): Promise<string> {
    const allLogs = await this.getAllLogs();
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      deviceInfo: {
        platform: 'expo',
        timestamp: Date.now(),
      },
      logs: allLogs,
    }, null, 2);
  }

  /**
   * Get all logs (memory + persisted)
   */
  async getAllLogs(): Promise<LogEntry[]> {
    try {
      if (this.logFile.exists) {
        const content = await this.logFile.text();
        const persistedLogs = JSON.parse(content) as LogEntry[];
        // Merge and dedupe by timestamp
        const allLogs = [...persistedLogs, ...this.logs];
        const uniqueLogs = allLogs.filter(
          (log, index, self) =>
            index === self.findIndex(l => l.timestamp === log.timestamp && l.message === log.message)
        );
        return uniqueLogs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      }
    } catch (error) {
      // Fall back to memory logs
    }
    return [...this.logs];
  }

  /**
   * Get log file size
   */
  async getLogFileSize(): Promise<number> {
    try {
      if (this.logFile.exists) {
        return this.logFile.size ?? 0;
      }
    } catch (error) {
      // Ignore
    }
    return 0;
  }

  // Format logs for display
  formatLog(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const levelIcon = {
      debug: '?',
      info: 'i',
      warn: '!',
      error: 'X',
    }[entry.level];
    return `[${levelIcon}] [${time}] ${entry.message}`;
  }

  /**
   * Get statistics about logs
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    oldestTimestamp: string | null;
    newestTimestamp: string | null;
  } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    this.logs.forEach(log => {
      byLevel[log.level]++;
    });

    return {
      total: this.logs.length,
      byLevel,
      oldestTimestamp: this.logs[0]?.timestamp || null,
      newestTimestamp: this.logs[this.logs.length - 1]?.timestamp || null,
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogEntry };
