/**
 * Security Manager
 * 
 * Provides security features including:
 * - Data encryption/decryption (AES-256)
 * - JWT token generation and verification
 * - Password hashing and verification
 * - CSRF token generation and verification
 * - Rate limiting utilities
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { configManager } from './config-manager';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class SecurityManager {
  private static instance: SecurityManager;
  private rateLimitCache: Map<string, RateLimitEntry> = new Map();
  private rateLimitCleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Set up the rate limit cleanup interval
    this.rateLimitCleanupInterval = setInterval(() => {
      this.cleanupRateLimitCache();
    }, 60 * 1000); // Clean up every minute
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Generate a random encryption key
   */
  public generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  public encrypt(data: string, keyString?: string): string {
    try {
      const config = configManager.get('security');
      const encKey = keyString || config.encryptionKey;
      
      if (!encKey) {
        throw new Error('Encryption key is not set');
      }
      
      // Convert the hex string key to a buffer
      const key = Buffer.from(encKey, 'hex');
      
      // Generate a random IV
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the auth tag
      const authTag = cipher.getAuthTag();
      
      // Return IV, encrypted data, and auth tag as a single string
      return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
    } catch (error) {
      logger.error('Encryption failed', { error: (error as Error).message });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  public decrypt(encryptedData: string, keyString?: string): string {
    try {
      const config = configManager.get('security');
      const encKey = keyString || config.encryptionKey;
      
      if (!encKey) {
        throw new Error('Encryption key is not set');
      }
      
      // Convert the hex string key to a buffer
      const key = Buffer.from(encKey, 'hex');
      
      // Split the encrypted data into IV, encrypted data, and auth tag
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error: (error as Error).message });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate a JWT token
   */
  public generateToken(
    payload: any,
    expiresIn?: string,
    subject?: string
  ): string {
    try {
      const config = configManager.get('security');
      const secret = config.jwtSecret;
      
      if (!secret) {
        throw new Error('JWT secret is not set');
      }
      
      return jwt.sign(payload, secret, {
        expiresIn: expiresIn || config.jwtExpiresIn,
        issuer: config.jwtIssuer,
        ...(subject && { subject }),
      });
    } catch (error) {
      logger.error('Token generation failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Verify a JWT token
   */
  public verifyToken<T = any>(token: string): T {
    try {
      const config = configManager.get('security');
      const secret = config.jwtSecret;
      
      if (!secret) {
        throw new Error('JWT secret is not set');
      }
      
      return jwt.verify(token, secret, {
        issuer: config.jwtIssuer,
      }) as T;
    } catch (error) {
      logger.error('Token verification failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Hash a password using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    try {
      const config = configManager.get('security');
      const saltRounds = config.saltRounds;
      
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      logger.error('Password hashing failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Verify a password against a hash
   */
  public async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Password verification failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Generate a CSRF token
   */
  public generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Handle rate limiting
   */
  public checkRateLimit(
    key: string,
    limit: number = 100,
    windowMs: number = 60000
  ): { limited: boolean; remaining: number; resetAt: Date } {
    const now = Date.now();
    const resetAt = now + windowMs;
    
    // Get the current rate limit entry or create a new one
    let entry = this.rateLimitCache.get(key);
    
    if (!entry || entry.resetAt < now) {
      // Create a new entry if none exists or the existing one has expired
      entry = {
        count: 1,
        resetAt,
      };
    } else {
      // Increment the count
      entry.count++;
    }
    
    // Update the entry in the cache
    this.rateLimitCache.set(key, entry);
    
    // Check if the limit has been exceeded
    const limited = entry.count > limit;
    const remaining = Math.max(0, limit - entry.count);
    
    return {
      limited,
      remaining,
      resetAt: new Date(entry.resetAt),
    };
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimitCache(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.rateLimitCache.entries()) {
      if (entry.resetAt < now) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  /**
   * Generate a random MFA backup code
   */
  public generateBackupCode(): string {
    const code = randomBytes(4).toString('hex').toUpperCase();
    return code.replace(/(.{4})/, '$1-');
  }

  /**
   * Generate a set of MFA backup codes
   */
  public generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      codes.push(this.generateBackupCode());
    }
    
    return codes;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.rateLimitCleanupInterval) {
      clearInterval(this.rateLimitCleanupInterval);
      this.rateLimitCleanupInterval = null;
    }
  }
}

export const securityManager = SecurityManager.getInstance();
export default securityManager;