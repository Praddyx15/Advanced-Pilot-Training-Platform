/**
 * Logger
 * 
 * A centralized logging system with:
 * - Different log levels (error, warn, info, debug)
 * - Structured logging with context information
 * - Console and file output options
 * - Colorized output for better readability
 * - Context tracking for request processing
 */

import * as fs from 'fs';
import * as path from 'path';
import { AsyncLocalStorage } from 'async_hooks';
import { configManager } from './config-manager';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logFilePath!: string;
  private currentDate!: string;
  private rotationCheckInterval: NodeJS.Timeout | null = null;
  private contextStorage = new AsyncLocalStorage<Map<string, any>>();
  private levelColors: Record<LogLevel, string> = {
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.INFO]: '\x1b[36m',  // Cyan
    [LogLevel.DEBUG]: '\x1b[35m', // Magenta
  };
  private resetColor = '\x1b[0m';

  private constructor() {
    // Initialize log file path
    this.currentDate = this.getCurrentDate();
    this.updateLogFilePath();
    
    // Create log directory if it doesn't exist
    this.ensureLogDirectoryExists();
    
    // Set up the rotation check interval
    this.rotationCheckInterval = setInterval(() => {
      this.checkLogRotation();
    }, 60 * 60 * 1000); // Check every hour
    
    this.debug('Logger initialized');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the context for the current execution context
   */
  public setContext(context: LogContext): void {
    const contextMap = new Map(Object.entries(context));
    this.contextStorage.enterWith(contextMap);
  }

  /**
   * Add a single value to the current context
   */
  public addToContext(key: string, value: any): void {
    const contextMap = this.contextStorage.getStore();
    if (contextMap) {
      contextMap.set(key, value);
    } else {
      const newMap = new Map<string, any>();
      newMap.set(key, value);
      this.contextStorage.enterWith(newMap);
    }
  }

  /**
   * Get the current context
   */
  public getContext(): LogContext {
    const contextMap = this.contextStorage.getStore();
    if (!contextMap) {
      return {};
    }
    
    const context: LogContext = {};
    for (const [key, value] of contextMap.entries()) {
      context[key] = value;
    }
    
    return context;
  }

  /**
   * Remove a key from the current context
   */
  public removeFromContext(key: string): void {
    const contextMap = this.contextStorage.getStore();
    if (contextMap) {
      contextMap.delete(key);
    }
  }

  /**
   * Clear the entire current context
   */
  public clearContext(): void {
    const contextMap = this.contextStorage.getStore();
    if (contextMap) {
      contextMap.clear();
    }
  }

  /**
   * Execute a function with a specific context
   */
  public withContext<T>(context: LogContext, fn: () => T): T {
    return this.contextStorage.run(new Map(Object.entries(context)), fn);
  }

  /**
   * Get a child logger with a specific context
   */
  public child(context: LogContext): Logger {
    const childLogger = Object.create(this);
    
    // Override the log method to include the child's context
    childLogger.log = function(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
      const parentContext = Logger.instance.getContext();
      const combinedContext = {
        ...parentContext,
        ...childLogger.context,
        ...context,
      };
      
      Logger.instance.log(level, message, combinedContext, error);
    };
    
    // Set the child's context
    childLogger.context = context;
    
    return childLogger;
  }

  /**
   * Log an error message
   */
  public error(message: string, contextOrError?: LogContext | Error, error?: Error): void {
    let context: LogContext | undefined;
    let err: Error | undefined;
    
    if (contextOrError instanceof Error) {
      err = contextOrError;
    } else {
      context = contextOrError;
      err = error;
    }
    
    this.log(LogLevel.ERROR, message, context, err);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log a message with a specific level
   */
  public log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Get current logging configuration
    const config = configManager.get('logging');
    
    // Check if the log level is enabled
    const levelPriority = {
      [LogLevel.ERROR]: 3,
      [LogLevel.WARN]: 2,
      [LogLevel.INFO]: 1,
      [LogLevel.DEBUG]: 0,
    };
    
    const configLevel = config.level as LogLevel;
    if (levelPriority[level] < levelPriority[configLevel]) {
      return;
    }
    
    // Merge provided context with the context from AsyncLocalStorage
    const storedContext = this.getContext();
    const mergedContext = {
      ...storedContext,
      ...context,
    };
    
    // Create the log entry
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(Object.keys(mergedContext).length > 0 && { context: mergedContext }),
    };
    
    // Add stack trace for errors
    if (error && error.stack) {
      logEntry.stack = error.stack;
    }
    
    // Write to console if enabled
    if (config.useConsole) {
      this.writeToConsole(logEntry);
    }
    
    // Write to file if enabled
    if (config.useFile) {
      this.writeToFile(logEntry);
    }
  }

  /**
   * Check if we need to rotate the log file
   */
  private checkLogRotation(): void {
    const currentDate = this.getCurrentDate();
    
    if (currentDate !== this.currentDate) {
      this.currentDate = currentDate;
      this.updateLogFilePath();
      this.debug('Log file rotated based on date', { 
        oldDate: this.currentDate, 
        newDate: currentDate,
        newLogFile: this.logFilePath
      });
    }
    
    // Check file size for rotation
    this.checkFileSize();
  }

  /**
   * Write a log entry to the console
   */
  private writeToConsole(logEntry: LogEntry): void {
    const { level, message, context, stack } = logEntry;
    
    // Format timestamp for console
    const timestamp = new Date().toLocaleTimeString();
    
    // Get colorized level
    const colorizedLevel = `${this.levelColors[level]}${level.toUpperCase()}${this.resetColor}`;
    
    // Format the message
    let formattedMessage = `[${timestamp}] ${colorizedLevel}: ${message}`;
    
    // Add context if available
    if (context && Object.keys(context).length > 0) {
      formattedMessage += `\n${JSON.stringify(context, null, 2)}`;
    }
    
    // Add stack trace if available
    if (stack) {
      formattedMessage += `\n${stack}`;
    }
    
    // Write to appropriate console method
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  /**
   * Write a log entry to a file
   */
  private writeToFile(logEntry: LogEntry): void {
    try {
      // Convert the log entry to JSON or formatted text based on configuration
      const config = configManager.get('logging');
      const logString = config.format === 'json' 
        ? JSON.stringify(logEntry) + '\n'
        : `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}` +
          (logEntry.context ? ` ${JSON.stringify(logEntry.context)}` : '') +
          (logEntry.stack ? `\n${logEntry.stack}` : '') +
          '\n';
      
      // Append to the log file
      fs.appendFileSync(this.logFilePath, logString, 'utf8');
    } catch (error) {
      console.error(`Failed to write to log file: ${(error as Error).message}`);
    }
  }

  /**
   * Check if the log file exceeds the maximum size and rotate if needed
   */
  private checkFileSize(): void {
    try {
      const config = configManager.get('logging');
      const maxSize = config.maxSize;
      
      if (!fs.existsSync(this.logFilePath)) {
        return;
      }
      
      const stats = fs.statSync(this.logFilePath);
      
      if (stats.size > maxSize) {
        this.rotateLogFile();
      }
    } catch (error) {
      console.error(`Failed to check log file size: ${(error as Error).message}`);
    }
  }

  /**
   * Rotate the log file
   */
  private rotateLogFile(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return;
      }
      
      const config = configManager.get('logging');
      const dir = path.dirname(this.logFilePath);
      const ext = path.extname(this.logFilePath);
      const base = path.basename(this.logFilePath, ext);
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const rotatedFilePath = path.join(dir, `${base}-${timestamp}${ext}`);
      
      fs.renameSync(this.logFilePath, rotatedFilePath);
      
      this.debug('Log file rotated based on size', {
        oldPath: this.logFilePath,
        newPath: rotatedFilePath,
      });
      
      // Clean up old log files if we exceed the max number
      this.cleanupOldLogs(dir, base);
    } catch (error) {
      console.error(`Failed to rotate log file: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up old log files if we exceed the maximum number of files
   */
  private cleanupOldLogs(dir: string, baseFileName: string): void {
    try {
      const config = configManager.get('logging');
      const maxFiles = config.maxFiles;
      
      // Get all log files with the same base name
      const files = fs.readdirSync(dir)
        .filter(file => file.startsWith(baseFileName) && file !== `${baseFileName}.log`)
        .map(file => path.join(dir, file));
      
      // Sort files by modification time (oldest first)
      files.sort((a, b) => {
        const aStat = fs.statSync(a);
        const bStat = fs.statSync(b);
        return aStat.mtime.getTime() - bStat.mtime.getTime();
      });
      
      // Remove the oldest files if we exceed the maximum
      const filesToRemove = files.slice(0, Math.max(0, files.length - maxFiles + 1));
      
      for (const file of filesToRemove) {
        fs.unlinkSync(file);
        this.debug('Removed old log file', { file });
      }
    } catch (error) {
      console.error(`Failed to clean up old log files: ${(error as Error).message}`);
    }
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectoryExists(): void {
    const dir = path.dirname(this.logFilePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Get the current date in YYYY-MM-DD format
   */
  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Get the log file path based on configuration and current date
   */
  private getLogFilePath(): string {
    const config = configManager.get('logging');
    const baseDir = config.directory;
    const fileName = `application-${this.currentDate}.log`;
    
    return path.join(baseDir, fileName);
  }

  /**
   * Update the log file path based on the current date
   */
  private updateLogFilePath(): void {
    this.logFilePath = this.getLogFilePath();
  }
}

// Create a simple placeholder logger that will be replaced once config is loaded
const createInitialLogger = () => {
  const logger = {
    error: (message: string, context?: any, error?: Error) => console.error(message, context, error),
    warn: (message: string, context?: any) => console.warn(message, context),
    info: (message: string, context?: any) => console.info(message, context),
    debug: (message: string, context?: any) => console.debug(message, context),
    log: (level: string, message: string, context?: any, error?: Error) => console.log(level, message, context, error),
    setContext: () => {},
    getContext: () => ({}),
    addToContext: () => {},
    removeFromContext: () => {},
    clearContext: () => {},
    withContext: (_: any, fn: () => any) => fn(),
    child: () => logger,
  };
  return logger;
};

// Export a placeholder logger that will be replaced with the real logger once config is loaded
export let logger = createInitialLogger();

// This function is called by the core initialization to set the real logger
export function initializeLogger() {
  logger = Logger.getInstance();
  return logger;
}

export default logger;