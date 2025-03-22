/**
 * Database Manager
 * 
 * Provides database connection management with:
 * - Connection pooling for PostgreSQL
 * - Prepared statement caching
 * - Transaction management
 * - Query builders for common operations
 * - Migrations support
 */

import * as pg from 'pg';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { configManager } from './config-manager';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

interface QueryParams {
  text: string;
  values?: any[];
  name?: string;
}

interface PreparedStatement {
  name: string;
  text: string;
  values?: any[];
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: pg.Pool;
  private drizzleDb: PostgresJsDatabase | null = null;
  private preparedStatements: Map<string, PreparedStatement> = new Map();
  private migrationLock: boolean = false;

  private constructor() {
    // Get database configuration
    const dbConfig = configManager.get('database');
    
    // Configure connection pool options
    const poolConfig: pg.PoolConfig = {
      max: dbConfig.connectionPoolSize,
      database: dbConfig.database,
      port: dbConfig.port,
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      ssl: dbConfig.ssl ? {
        rejectUnauthorized: dbConfig.rejectUnauthorized,
      } : undefined,
      // Connect using connection string if provided
      connectionString: dbConfig.url,
      // Add performance monitoring
      statement_timeout: configManager.get('performance').queryTimeout * 1000,
      idle_in_transaction_session_timeout: configManager.get('performance').idleTimeout * 1000,
      // Add application name for identification in PostgreSQL logs
      application_name: 'aptp-server',
    };
    
    // Create the connection pool
    this.pool = new pg.Pool(poolConfig);
    
    // Set up event listeners on the pool
    this.setupPoolEventListeners();
    
    // Initialize Drizzle ORM
    this.initializeDrizzle();
    
    logger.info('Database manager initialized', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      maxConnections: dbConfig.connectionPoolSize,
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize Drizzle ORM
   */
  private initializeDrizzle(): void {
    try {
      // Import DB schema from separate file
      // We'll use postgres.js as the driver with Drizzle ORM
      const dbConfig = configManager.get('database');
      const connectionString = dbConfig.url ||
        `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
      
      // Create Drizzle instance
      // Note: We're using the import dynamically to avoid circular dependencies
      // This is just a placeholder until we implement the actual schema import
      const postgres = require('postgres');
      const sql = postgres(connectionString, {
        max: 1,
        ssl: dbConfig.ssl ? {
          rejectUnauthorized: dbConfig.rejectUnauthorized,
        } : undefined,
      });
      
      this.drizzleDb = drizzle(sql);
      logger.info('Drizzle ORM initialized');
    } catch (error) {
      logger.error('Failed to initialize Drizzle ORM', { error: (error as Error).message });
      // We'll continue without Drizzle ORM if it fails to initialize
    }
  }

  /**
   * Get the Drizzle ORM instance
   */
  public getDrizzle(): PostgresJsDatabase {
    if (!this.drizzleDb) {
      throw new Error('Drizzle ORM is not initialized');
    }
    return this.drizzleDb;
  }

  /**
   * Run database migrations
   */
  public async runMigrations(migrationDirectory = './migrations'): Promise<void> {
    try {
      // Check if migrations directory exists
      if (!fs.existsSync(migrationDirectory)) {
        logger.warn(`Migrations directory ${migrationDirectory} does not exist, skipping migrations`);
        return;
      }
      
      // Check if we're already running migrations
      if (this.migrationLock) {
        logger.warn('Migration is already in progress, skipping');
        return;
      }
      
      this.migrationLock = true;
      
      // Get all migration files
      const migrationFiles = fs.readdirSync(migrationDirectory)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      if (migrationFiles.length === 0) {
        logger.info('No migration files found');
        this.migrationLock = false;
        return;
      }
      
      logger.info(`Found ${migrationFiles.length} migration files`);
      
      try {
        // Use Drizzle's migrate function
        if (this.drizzleDb) {
          await migrate(this.drizzleDb, { migrationsFolder: migrationDirectory });
          logger.info('Migrations completed successfully using Drizzle');
        } else {
          // Fallback to manual migrations if Drizzle is not available
          const client = await this.getClient();
          
          try {
            // Begin transaction
            await client.query('BEGIN');
            
            // Create migrations table if it doesn't exist
            await client.query(`
              CREATE TABLE IF NOT EXISTS "migrations" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(255) NOT NULL,
                "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              )
            `);
            
            // Get already applied migrations
            const { rows: appliedMigrations } = await client.query(
              'SELECT name FROM "migrations"'
            );
            const appliedMigrationNames = appliedMigrations.map(m => m.name);
            
            // Apply new migrations
            for (const file of migrationFiles) {
              if (appliedMigrationNames.includes(file)) {
                logger.debug(`Migration ${file} already applied, skipping`);
                continue;
              }
              
              logger.info(`Applying migration: ${file}`);
              const migrationPath = path.join(migrationDirectory, file);
              const migrationSql = fs.readFileSync(migrationPath, 'utf8');
              
              // Execute migration
              await client.query(migrationSql);
              
              // Record that we applied this migration
              await client.query(
                'INSERT INTO "migrations" (name) VALUES ($1)',
                [file]
              );
            }
            
            // Commit transaction
            await client.query('COMMIT');
            logger.info('Migrations completed successfully');
          } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        }
      } finally {
        this.migrationLock = false;
      }
    } catch (error) {
      logger.error('Migration failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get a client from the connection pool
   */
  public async getClient(): Promise<pg.PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      logger.error('Failed to get database client', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Execute a query
   */
  public async query<T>(
    textOrParams: string | QueryParams,
    values?: any[]
  ): Promise<pg.QueryResult<T>> {
    const client = await this.getClient();
    
    try {
      let query: QueryParams;
      
      if (typeof textOrParams === 'string') {
        query = {
          text: textOrParams,
          values: values,
        };
      } else {
        query = textOrParams;
      }
      
      const start = Date.now();
      const result = await client.query<T>(query);
      const duration = Date.now() - start;
      
      // Log slow queries
      const slowQueryThreshold = configManager.get('performance').slowQueryThreshold;
      if (duration > slowQueryThreshold) {
        logger.warn('Slow query detected', {
          query: query.text,
          duration: `${duration}ms`,
          threshold: `${slowQueryThreshold}ms`,
          rowCount: result.rowCount,
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Query failed', {
        query: textOrParams,
        error: (error as Error).message,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a prepared statement
   */
  public async executeStatement<T>(
    name: string,
    values?: any[]
  ): Promise<pg.QueryResult<T>> {
    const statement = this.preparedStatements.get(name);
    
    if (!statement) {
      throw new Error(`Prepared statement '${name}' not found`);
    }
    
    return this.query<T>({
      name,
      text: statement.text,
      values: values || statement.values,
    });
  }

  /**
   * Prepare a statement
   */
  public async prepareStatement(
    name: string,
    text: string,
    values?: any[]
  ): Promise<void> {
    const client = await this.getClient();
    
    try {
      // Store the prepared statement
      this.preparedStatements.set(name, {
        name,
        text,
        values,
      });
      
      // Prepare the statement on the server
      await client.query(`PREPARE ${name} AS ${text}`);
      
      logger.debug('Prepared statement created', { name });
    } catch (error) {
      logger.error('Failed to prepare statement', {
        name,
        error: (error as Error).message,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(
    callback: (client: pg.PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Execute callback with transaction
      const result = await callback(client);
      
      // Commit transaction
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      logger.error('Transaction failed', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  public async transactionQueries<T = any>(
    queries: QueryParams[]
  ): Promise<pg.QueryResult<T>[]> {
    return this.transaction(async (client) => {
      const results: pg.QueryResult<T>[] = [];
      
      for (const query of queries) {
        const result = await client.query<T>(query);
        results.push(result);
      }
      
      return results;
    });
  }

  /**
   * Build a simple INSERT query
   */
  public buildInsertQuery(
    table: string,
    data: Record<string, any>,
    returning: string = '*'
  ): QueryParams {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    
    const query = {
      text: `
        INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')})
        VALUES (${placeholders.join(', ')})
        ${returning ? `RETURNING ${returning}` : ''}
      `,
      values,
    };
    
    return query;
  }

  /**
   * Build a simple UPDATE query
   */
  public buildUpdateQuery(
    table: string,
    data: Record<string, any>,
    whereConditions: Record<string, any>,
    returning: string = '*'
  ): QueryParams {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    const setClauses = columns.map((col, index) => `"${col}" = $${index + 1}`);
    
    const whereColumns = Object.keys(whereConditions);
    const whereValues = Object.values(whereConditions);
    const whereStartIdx = values.length + 1;
    
    const whereClauses = whereColumns.map(
      (col, index) => `"${col}" = $${whereStartIdx + index}`
    );
    
    const query = {
      text: `
        UPDATE "${table}"
        SET ${setClauses.join(', ')}
        WHERE ${whereClauses.join(' AND ')}
        ${returning ? `RETURNING ${returning}` : ''}
      `,
      values: [...values, ...whereValues],
    };
    
    return query;
  }

  /**
   * Close the connection pool
   */
  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Failed to close database connection pool', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Set up event listeners on the connection pool
   */
  private setupPoolEventListeners(): void {
    this.pool.on('connect', (client) => {
      logger.debug('New database connection established');
    });
    
    this.pool.on('acquire', (client) => {
      logger.debug('Database connection acquired from pool');
    });
    
    this.pool.on('remove', (client) => {
      logger.debug('Database connection removed from pool');
    });
    
    this.pool.on('error', (err) => {
      logger.error('Database pool error', { error: err.message });
    });
  }
}

export const dbManager = DatabaseManager.getInstance();
export default dbManager;