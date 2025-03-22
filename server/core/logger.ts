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
import * as util from 'util';
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
    [LogLevel.DEBUG]: '\x1b[90m'  // Gray
  };
  private resetColor = '\x1b[0m';

  private constructor() {
    this.currentDate = this.getCurrentDate();
    this.updateLogFilePath();
    
    // Set up file rotation check interval (every hour)
    if (this._isFileLoggingEnabled()) {
      this.ensureLogDirectoryExists();
      this.rotationCheckInterval = setInterval(() => {
        this.checkLogRotation();
      }, 60 * 60 * 1000); // Check every hour
    }
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
    const store = this.contextStorage.getStore();
    if (store) {
      for (const [key, value] of Object.entries(context)) {
        store.set(key, value);
      }
    } else {
      const newStore = new Map<string, any>();
      for (const [key, value] of Object.entries(context)) {
        newStore.set(key, value);
      }
      this.contextStorage.enterWith(newStore);
    }
  }

  /**
   * Add a single value to the current context
   */
  public addToContext(key: string, value: any): void {
    const store = this.contextStorage.getStore();
    if (store) {
      store.set(key, value);
    } else {
      const newStore = new Map<string, any>();
      newStore.set(key, value);
      this.contextStorage.enterWith(newStore);
    }
  }

  /**
   * Get the current context
   */
  public getContext(): LogContext {
    const store = this.contextStorage.getStore();
    const context: LogContext = {};
    
    if (store) {
      for (const [key, value] of store.entries()) {
        context[key] = value;
      }
    }
    
    return context;
  }

  /**
   * Remove a key from the current context
   */
  public removeFromContext(key: string): void {
    const store = this.contextStorage.getStore();
    if (store) {
      store.delete(key);
    }
  }

  /**
   * Clear the entire current context
   */
  public clearContext(): void {
    const store = this.contextStorage.getStore();
    if (store) {
      store.clear();
    }
  }

  /**
   * Execute a function with a specific context
   */
  public withContext<T>(context: LogContext, fn: () => T): T {
    const previousContext = this.getContext();
    const newContext = { ...previousContext, ...context };
    
    const store = new Map<string, any>();
    for (const [key, value] of Object.entries(newContext)) {
      store.set(key, value);
    }
    
    return this.contextStorage.run(store, fn);
  }

  /**
   * Get a child logger with a specific context
   */
  public child(context: LogContext): Logger {
    const childLogger = Object.create(this) as Logger;
    const parentContext = this.getContext();
    const combinedContext = { ...parentContext, ...context };
    
    childLogger.log = function(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
      const mergedContext = { ...combinedContext, ...(context || {}) };
      Logger.getInstance().log(level, message, mergedContext, error);
    };
    
    return childLogger;
  }

  /**
   * Log an error message
   */
  public error(message: string, contextOrError?: LogContext | Error, error?: Error): void {
    let context: LogContext | undefined;
    let errorObj: Error | undefined;
    
    if (contextOrError instanceof Error) {
      errorObj = contextOrError;
    } else {
      context = contextOrError;
      errorObj = error;
    }
    
    this.log(LogLevel.ERROR, message, context, errorObj);
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
    const minLevel = this._getMinLogLevel();
    
    if (!this._shouldLog(level, minLevel)) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const storedContext = this.getContext();
    
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context: { ...storedContext, ...(context || {}) }
    };
    
    if (error) {
      logEntry.stack = error.stack;
      if (!logEntry.context) {
        logEntry.context = {};
      }
      logEntry.context.error = {
        name: error.name,
        message: error.message,
      };
    }
    
    // Write to console
    this.writeToConsole(logEntry);
    
    // Write to file if enabled
    if (this._isFileLoggingEnabled()) {
      this.writeToFile(logEntry);
    }
  }

  /**
   * Check if we need to rotate the log file
   */
  private checkLogRotation(): void {
    const currentDate = this.getCurrentDate();
    
    // If the date has changed, rotate the log file
    if (currentDate !== this.currentDate) {
      this.currentDate = currentDate;
      this.updateLogFilePath();
    }
    
    // Check file size
    this.checkFileSize();
  }

  /**
   * Write a log entry to the console
   */
  private writeToConsole(logEntry: LogEntry): void {
    const format = configManager.getValue('logging', 'format') || 'text';
    const colorize = configManager.getValue('logging', 'colorize') !== false;
    
    if (format === 'json') {
      console.log(JSON.stringify(logEntry));
      return;
    }
    
    let levelDisplay = `[${logEntry.level.toUpperCase()}]`;
    
    if (colorize) {
      levelDisplay = `${this.levelColors[logEntry.level]}${levelDisplay}${this.resetColor}`;
    }
    
    let output = `${logEntry.timestamp} ${levelDisplay} ${logEntry.message}`;
    
    // Add context if available
    if (logEntry.context && Object.keys(logEntry.context).length > 0) {
      output += `\n  Context: ${util.inspect(logEntry.context, { depth: 4, colors: colorize })}`;
    }
    
    // Add stack trace if available
    if (logEntry.stack) {
      output += `\n  Stack: ${logEntry.stack}`;
    }
    
    if (logEntry.level === LogLevel.ERROR) {
      console.error(output);
    } else if (logEntry.level === LogLevel.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Write a log entry to a file
   */
  private writeToFile(logEntry: LogEntry): void {
    try {
      const format = configManager.getValue('logging', 'format') || 'text';
      let content = '';
      
      if (format === 'json') {
        content = JSON.stringify(logEntry) + '\n';
      } else {
        content = `${logEntry.timestamp} [${logEntry.level.toUpperCase()}] ${logEntry.message}`;
        
        // Add context if available
        if (logEntry.context && Object.keys(logEntry.context).length > 0) {
          content += ` | Context: ${JSON.stringify(logEntry.context)}`;
        }
        
        // Add stack trace if available
        if (logEntry.stack) {
          content += ` | Stack: ${logEntry.stack}`;
        }
        
        content += '\n';
      }
      
      fs.appendFileSync(this.logFilePath, content);
    } catch (error) {
      console.error(`Failed to write to log file: ${(error as Error).message}`);
    }
  }

  /**
   * Check if the log file exceeds the maximum size and rotate if needed
   */
  private checkFileSize(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return;
      }
      
      const stats = fs.statSync(this.logFilePath);
      const maxSize = configManager.getValue('logging', 'maxFileSize');
      
      // If maxSize is a number and the file size exceeds it, rotate the log file
      if (typeof maxSize === 'number' && stats.size >= maxSize * 1024 * 1024) {
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
      
      const dir = path.dirname(this.logFilePath);
      const ext = path.extname(this.logFilePath);
      const baseName = path.basename(this.logFilePath, ext);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newPath = path.join(dir, `${baseName}.${timestamp}${ext}`);
      
      fs.renameSync(this.logFilePath, newPath);
      
      // Clean up old log files if there are too many
      this.cleanupOldLogs(dir, baseName);
    } catch (error) {
      console.error(`Failed to rotate log file: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up old log files if we exceed the maximum number of files
   */
  private cleanupOldLogs(dir: string, baseFileName: string): void {
    try {
      const maxFiles = configManager.getValue('logging', 'maxFiles') || 10;
      const files = fs.readdirSync(dir)
        .filter(file => file.startsWith(baseFileName) && file !== `${baseFileName}.log`)
        .map(file => path.join(dir, file))
        .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
      
      // If we have more files than the maximum, delete the oldest ones
      if (files.length > maxFiles) {
        files.slice(maxFiles).forEach(file => {
          fs.unlinkSync(file);
        });
      }
    } catch (error) {
      console.error(`Failed to clean up old log files: ${(error as Error).message}`);
    }
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectoryExists(): void {
    const logDir = path.dirname(this.logFilePath);
    
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to create log directory: ${(error as Error).message}`);
    }
  }

  /**
   * Get the current date in YYYY-MM-DD format
   */
  private getCurrentDate(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  /**
   * Get the log file path based on configuration and current date
   */
  private getLogFilePath(): string {
    const directory = configManager.getValue('logging', 'directory') || 'logs';
    // Use server.environment to ensure it exists in our config schema
    const appName = configManager.getValue('server', 'environment') ? 'aptp' : 'app';
    const rotationFrequency = configManager.getValue('logging', 'rotationFrequency') || 'daily';
    
    let fileName = `${appName}`;
    
    if (rotationFrequency === 'daily') {
      fileName += `.${this.currentDate}`;
    }
    
    fileName += '.log';
    
    return path.join(directory, fileName);
  }

  /**
   * Update the log file path based on the current date
   */
  private updateLogFilePath(): void {
    this.logFilePath = this.getLogFilePath();
    this.ensureLogDirectoryExists();
  }

  /**
   * Get the minimum log level from configuration
   */
  private _getMinLogLevel(): LogLevel {
    const configLevel = configManager.getValue('logging', 'level');
    
    if (configLevel && Object.values(LogLevel).includes(configLevel as LogLevel)) {
      return configLevel as LogLevel;
    }
    
    return LogLevel.INFO; // Default to INFO level
  }

  /**
   * Check if a log level should be logged
   */
  private _shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) <= levels.indexOf(minLevel);
  }

  /**
   * Check if file logging is enabled
   */
  private _isFileLoggingEnabled(): boolean {
    return configManager.getValue('logging', 'file') === true;
  }
}

// Create a temporary logger before initialization
function createInitialLogger() {
  return {
    error: (message: string, context?: any, error?: Error) => console.error(message, context, error),
    warn: (message: string, context?: any) => console.warn(message, context),
    info: (message: string, context?: any) => console.info(message, context),
    debug: (message: string, context?: any) => console.debug(message, context),
    log: (level: string, message: string, context?: any, error?: Error) => console.log(level, message, context, error),
    setContext: (context: any) => {},
    addToContext: (key: string, value: any) => {},
    getContext: () => ({}),
    removeFromContext: (key: string) => {},
    clearContext: () => {},
    withContext: (_: any, fn: Function) => fn(),
    child: (context: any) => createInitialLogger(),
  };
}

// Export a temporary logger that will be replaced during initialization
export let logger = createInitialLogger();

// Initialize the logger (should be called from the core initialization)
export function initializeLogger() {
  logger = Logger.getInstance();
  return logger;
}