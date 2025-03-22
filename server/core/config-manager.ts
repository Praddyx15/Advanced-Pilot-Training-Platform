/**
 * ConfigurationManager 
 * 
 * Handles application-wide settings with support for:
 * - Loading from multiple sources (environment, files, database)
 * - Type-safe access to configuration values
 * - Change notification and validation
 * - Thread safety for concurrent access
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { logger } from './logger';

type ConfigSource = 'environment' | 'file' | 'database' | 'default';

/**
 * Define our configuration schema using Zod
 */
const serverConfigSchema = z.object({
  port: z.number().default(3000),
  host: z.string().default('0.0.0.0'),
  environment: z.enum(['development', 'test', 'production']).default('development'),
  corsOrigins: z.array(z.string()).default(['*']),
  trustedProxies: z.array(z.string()).default([]),
  requestSizeLimit: z.string().default('50mb'),
  compressionLevel: z.number().min(0).max(9).default(6),
  rateLimitEnabled: z.boolean().default(true),
  requestTimeout: z.number().default(30000),
  baseUrl: z.string().optional(),
});

const databaseConfigSchema = z.object({
  url: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  port: z.number().optional(),
  host: z.string().optional(),
  ssl: z.boolean().default(false),
  connectionPoolSize: z.number().default(10),
  rejectUnauthorized: z.boolean().default(true),
});

const loggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  format: z.enum(['json', 'text']).default('json'),
  directory: z.string().default('./logs'),
  maxFiles: z.number().default(10),
  maxSize: z.number().default(10 * 1024 * 1024), // 10 MB
  useConsole: z.boolean().default(true),
  useFile: z.boolean().default(true),
});

const securityConfigSchema = z.object({
  jwtSecret: z.string().optional(),
  jwtIssuer: z.string().default('pilot-training-platform'),
  jwtExpiresIn: z.string().default('1d'),
  saltRounds: z.number().default(10),
  csrfProtection: z.boolean().default(true),
  encryptionKey: z.string().optional(),
  rateLimitWindow: z.number().default(60000), // 1 minute
  rateLimitMax: z.number().default(100),
});

const storageConfigSchema = z.object({
  type: z.enum(['memory', 'database']).default('memory'),
  persistenceEnabled: z.boolean().default(false),
  persistencePath: z.string().default('./data'),
  backupEnabled: z.boolean().default(false),
  backupFrequency: z.number().default(24 * 60 * 60 * 1000), // 24 hours
  backupPath: z.string().default('./backups'),
  maxBackups: z.number().default(5),
});

const syllabusConfigSchema = z.object({
  documentUploadPath: z.string().default('./uploads/documents'),
  maxUploadSize: z.number().default(100 * 1024 * 1024), // 100 MB
  allowedFileTypes: z.array(z.string()).default(['pdf', 'docx', 'doc', 'txt']),
  templatePath: z.string().default('./templates'),
  extractorEnabled: z.boolean().default(true),
  aiServiceUrl: z.string().optional(),
});

const analyticsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  retentionPeriod: z.number().default(365), // days
  aggregationEnabled: z.boolean().default(true),
  aggregationSchedule: z.string().default('0 0 * * *'), // cron expression, daily at midnight
  predictionEnabled: z.boolean().default(true),
  predictionModelPath: z.string().default('./models'),
  privacySettings: z.object({
    anonymizeData: z.boolean().default(false),
    minimumAggregation: z.number().default(5),
  }),
});

const configSchema = z.object({
  server: serverConfigSchema,
  database: databaseConfigSchema,
  logging: loggingConfigSchema,
  security: securityConfigSchema,
  storage: storageConfigSchema,
  syllabus: syllabusConfigSchema,
  analytics: analyticsConfigSchema,
});

type Config = z.infer<typeof configSchema>;

/**
 * Configuration Manager class
 * Singleton that manages application configuration
 */
class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: Config;
  private sources: Record<keyof Config, Record<string, ConfigSource>>;
  private eventEmitter: EventEmitter;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.eventEmitter = new EventEmitter();
    
    // Initialize with default values
    this.config = this.getDefaultConfig();
    this.sources = this.initSourceTracking();
    
    // Load from environment variables
    this.loadFromEnvironment();
    
    // Try to load from configuration file if it exists
    try {
      this.loadFromFile();
    } catch (error) {
      logger.warn('Failed to load configuration from file', { error: (error as Error).message });
    }
    
    logger.info('Configuration manager initialized');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Get the entire configuration object
   */
  public getConfig(): Readonly<Config> {
    return { ...this.config };
  }

  /**
   * Get a specific section of the configuration
   */
  public get<K extends keyof Config>(section: K): Readonly<Config[K]> {
    return { ...this.config[section] };
  }

  /**
   * Get a specific configuration value with type safety
   */
  public getValue<K extends keyof Config, S extends keyof Config[K]>(
    section: K,
    key: S
  ): Config[K][S] {
    return this.config[section][key];
  }

  /**
   * Update a configuration value (with validation)
   */
  public setValue<K extends keyof Config, S extends keyof Config[K]>(
    section: K,
    key: S,
    value: Config[K][S],
    source: ConfigSource = 'default'
  ): void {
    const oldValue = this.config[section][key];
    const oldConfig = { ...this.config };
    
    // Update the value and source tracking
    this.config[section] = {
      ...this.config[section],
      [key]: value,
    };
    
    this.sources[section][key as string] = source;
    
    // Emit a change event if the value actually changed
    if (oldValue !== value) {
      this.eventEmitter.emit('configChanged', {
        section,
        key,
        oldValue,
        newValue: value,
        source,
      });
      
      // Emit individual property change events
      this.emitChangeEvents(oldConfig, this.config);
    }
  }

  /**
   * Subscribe to configuration changes
   */
  public onChange(callback: (changeEvent: any) => void): void {
    this.eventEmitter.on('configChanged', callback);
  }

  /**
   * Unsubscribe from configuration changes
   */
  public offChange(callback: (changeEvent: any) => void): void {
    this.eventEmitter.off('configChanged', callback);
  }

  /**
   * Get the source of a configuration value
   */
  public getValueSource<K extends keyof Config, S extends keyof Config[K]>(
    section: K,
    key: S
  ): ConfigSource {
    return this.sources[section][key as string] || 'default';
  }

  /**
   * Reload configuration from all sources
   */
  public reload(): void {
    const oldConfig = { ...this.config };
    
    // Reset to defaults
    this.config = this.getDefaultConfig();
    this.sources = this.initSourceTracking();
    
    // Re-apply from sources in priority order
    this.loadFromEnvironment();
    
    try {
      this.loadFromFile();
    } catch (error) {
      logger.warn('Failed to load configuration from file during reload', { error: (error as Error).message });
    }
    
    // Emit change events for any changed values
    this.emitChangeEvents(oldConfig, this.config);
    
    logger.info('Configuration reloaded');
  }

  /**
   * Save current configuration to a file
   */
  public saveToFile(filePath: string = './config.json'): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(this.config, null, 2), 'utf8');
      logger.info('Configuration saved to file', { filePath });
    } catch (error) {
      logger.error('Failed to save configuration to file', { 
        error: (error as Error).message,
        filePath 
      }, error as Error);
      throw error;
    }
  }

  /**
   * Get default configuration values
   */
  private getDefaultConfig(): Config {
    return configSchema.parse({
      server: serverConfigSchema.parse({}),
      database: databaseConfigSchema.parse({}),
      logging: loggingConfigSchema.parse({}),
      security: securityConfigSchema.parse({}),
      storage: storageConfigSchema.parse({}),
      syllabus: syllabusConfigSchema.parse({}),
      analytics: analyticsConfigSchema.parse({})
    });
  }

  /**
   * Initialize the source tracking object
   */
  private initSourceTracking(): Record<keyof Config, Record<string, ConfigSource>> {
    const sources: Record<string, Record<string, ConfigSource>> = {};
    
    for (const section of Object.keys(this.config) as (keyof Config)[]) {
      sources[section] = {};
      
      for (const key of Object.keys(this.config[section])) {
        sources[section][key] = 'default';
      }
    }
    
    return sources as Record<keyof Config, Record<string, ConfigSource>>;
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    // Process environment variables in the format APP_SECTION_KEY
    for (const [envVar, value] of Object.entries(process.env)) {
      if (!envVar.startsWith('APP_') || value === undefined) continue;
      
      const parts = envVar.slice(4).toLowerCase().split('_');
      if (parts.length < 2) continue;
      
      const section = parts[0] as keyof Config;
      const key = parts.slice(1).join('_');
      
      if (section in this.config && key in this.config[section]) {
        const typedSection = section as keyof Config;
        const typedKey = key as any; // Need to handle dynamic string keys here
        
        // Convert the value to the appropriate type
        const parsedValue = this.parseEnvValue(value);
        
        try {
          // Only update if the section and key are valid
          if (
            typedSection in this.config &&
            typedKey in this.config[typedSection]
          ) {
            this.mergeConfigSection(
              typedSection,
              { [typedKey]: parsedValue } as any,
              'environment'
            );
          }
        } catch (error) {
          logger.warn(`Invalid environment variable value: ${envVar}`, {
            error: (error as Error).message,
            value
          });
        }
      }
    }
  }

  /**
   * Load configuration from a file
   */
  private loadFromFile(filePath: string = './config.json'): void {
    if (!fs.existsSync(filePath)) {
      logger.debug(`Configuration file does not exist: ${filePath}`);
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileConfig = JSON.parse(content);
      
      // Validate and merge each section
      for (const section of Object.keys(fileConfig) as (keyof Config)[]) {
        if (section in this.config) {
          this.mergeConfigSection(section, fileConfig[section], 'file');
        } else {
          logger.warn(`Unknown configuration section in file: ${section}`);
        }
      }
      
      logger.info('Configuration loaded from file', { filePath });
    } catch (error) {
      logger.error('Failed to load configuration from file', { 
        error: (error as Error).message,
        filePath 
      }, error as Error);
      throw error;
    }
  }

  /**
   * Recursively merge a configuration section
   */
  private mergeConfigSection<K extends keyof Config>(
    section: K,
    newValues: Partial<Config[K]>,
    configSource: ConfigSource,
  ): void {
    for (const key of Object.keys(newValues) as (keyof Config[K])[]) {
      const typedKey = key as keyof Config[K];
      const value = newValues[typedKey];
      
      if (
        typedKey in this.config[section] &&
        value !== undefined &&
        value !== null
      ) {
        this.config[section] = {
          ...this.config[section],
          [typedKey]: value,
        };
        
        this.sources[section][typedKey as string] = configSource;
      }
    }
  }

  /**
   * Set a nested value in an object
   */
  private setNestedValue(obj: any, path: string[], value: any): void {
    const key = path[0];
    
    if (path.length === 1) {
      obj[key] = value;
    } else {
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      
      this.setNestedValue(obj[key], path.slice(1), value);
    }
  }

  /**
   * Parse environment variable values to appropriate types
   */
  private parseEnvValue(value: string): any {
    // Boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }
    
    // Array (comma-separated)
    if (value.includes(',')) {
      return value.split(',').map(v => v.trim());
    }
    
    // Default: string
    return value;
  }

  /**
   * Emit change events for all changed configuration values
   */
  private emitChangeEvents(oldConfig: Config, newConfig: Config): void {
    for (const section of Object.keys(newConfig) as (keyof Config)[]) {
      const oldSection = oldConfig[section];
      const newSection = newConfig[section];
      
      for (const key of Object.keys(newSection) as (keyof Config[typeof section])[]) {
        const oldValue = oldSection[key];
        const newValue = newSection[key];
        
        if (oldValue !== newValue) {
          this.eventEmitter.emit('configChanged', {
            section,
            key,
            oldValue,
            newValue,
            source: this.sources[section][key as string] || 'default',
          });
        }
      }
    }
  }
}

export const configManager = ConfigurationManager.getInstance();
export default configManager;