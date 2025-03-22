/**
 * Multi-Factor Authentication Service
 *
 * This service provides MFA capabilities:
 * - TOTP (Time-based One-Time Password) generation and validation
 * - QR code generation for TOTP setup
 * - Biometric authentication integration
 * - Recovery codes management
 * - Session verification with MFA status
 */

import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { User } from '@shared/schema';
import { logger } from '../core';

// Constants
const TOKEN_LENGTH = 6;
const TOKEN_WINDOW = 1; // Window of 1 means ±30 seconds (one period before and after)
const SECRET_LENGTH = 20; // 20 bytes for TOTP secret
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;
const APP_NAME = 'APTP'; // Advanced Pilot Training Platform

export enum MfaType {
  TOTP = 'totp',
  BIOMETRIC = 'biometric',
  RECOVERY = 'recovery'
}

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACE = 'face',
  VOICE = 'voice'
}

export interface MfaSecret {
  secret: string;
  uri: string;
  qrCode: string;
}

export interface MfaCredential {
  id: string;
  userId: number;
  type: MfaType;
  secret?: string;
  biometricType?: BiometricType;
  biometricTemplate?: string;
  recoveryCodes?: string[];
  lastUsed?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BiometricData {
  type: BiometricType;
  template: string;
  deviceInfo?: {
    deviceId: string;
    name: string;
    platform: string;
  };
}

/**
 * Generate a new TOTP secret for a user
 */
export async function generateTotpSecret(user: User): Promise<MfaSecret> {
  // Generate a random secret
  const secret = crypto.randomBytes(SECRET_LENGTH).toString('base64');
  
  // Create an otpauth URL for QR code
  const uri = `otpauth://totp/${APP_NAME}:${user.username}?secret=${secret}&issuer=${APP_NAME}&algorithm=SHA1&digits=${TOKEN_LENGTH}&period=30`;
  
  // Generate QR code as data URL
  const qrCode = await QRCode.toDataURL(uri);
  
  logger.info(`Generated TOTP secret for user ${user.id}`, { userId: user.id });
  
  return {
    secret,
    uri,
    qrCode
  };
}

/**
 * Validate a TOTP token against a secret
 */
export function validateTotpToken(token: string, secret: string): boolean {
  // Convert base32 secret to buffer
  const secretBuffer = Buffer.from(secret, 'base64');
  
  // Get current time in seconds
  const now = Math.floor(Date.now() / 1000);
  
  // Check current time period and surrounding periods based on window
  for (let i = -TOKEN_WINDOW; i <= TOKEN_WINDOW; i++) {
    const time = now + (i * 30); // 30-second time period
    const expectedToken = generateTotpToken(secretBuffer, time);
    
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate a TOTP token for a given time
 */
function generateTotpToken(secret: Buffer, time: number): string {
  // Calculate number of time periods since Unix epoch
  const counter = Math.floor(time / 30);
  
  // Convert counter to buffer
  const counterBuffer = Buffer.alloc(8);
  let tempCounter = counter;
  for (let i = 0; i < 8; i++) {
    counterBuffer[7 - i] = tempCounter & 0xff;
    tempCounter = tempCounter >> 8;
  }
  
  // Generate HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(counterBuffer);
  const hmacResult = hmac.digest();
  
  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  ) % 10 ** TOKEN_LENGTH;
  
  // Left pad with zeros to ensure correct length
  return code.toString().padStart(TOKEN_LENGTH, '0');
}

/**
 * Generate recovery codes for a user
 */
export function generateRecoveryCodes(): string[] {
  const recoveryCodes: string[] = [];
  
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const code = crypto.randomBytes(RECOVERY_CODE_LENGTH / 2)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join('-');
    
    if (code) {
      recoveryCodes.push(code);
    }
  }
  
  return recoveryCodes;
}

/**
 * Validate a recovery code
 */
export function validateRecoveryCode(code: string, storedCodes: string[]): boolean {
  // Normalize the input code
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  
  // Check if code exists in stored codes
  for (let i = 0; i < storedCodes.length; i++) {
    const storedCode = storedCodes[i].replace(/-/g, '').toUpperCase();
    if (normalizedCode === storedCode) {
      return true;
    }
  }
  
  return false;
}

/**
 * Register a new biometric template
 */
export function registerBiometricTemplate(data: BiometricData): string {
  // In a real implementation, this would process and securely store the template
  // For now, we simply return the template as a placeholder
  logger.info(`Registered new biometric template type: ${data.type}`);
  
  return data.template;
}

/**
 * Verify a biometric sample against a stored template
 */
export function verifyBiometricSample(sample: string, template: string): boolean {
  // In a real implementation, this would use a biometric comparison algorithm
  // For demonstration purposes, we'll just compare the samples directly
  // This is NOT how real biometric verification works - it should use proper algorithms
  return sample === template;
}

/**
 * Check if MFA is required for a user
 */
export function isMfaRequired(user: User): boolean {
  // This could be based on user role, organization settings, etc.
  // For now, we'll implement a simple rule based on user role
  return ['admin', 'instructor', 'examiner'].includes(user.role);
}

/**
 * Verify MFA status for a session
 */
export function verifyMfaSession(session: any): boolean {
  if (!session) return false;
  
  // Check if MFA has been completed for this session
  return session.mfaVerified === true;
}

/**
 * Sets MFA as verified for the current session
 */
export function setMfaVerified(session: any): void {
  if (session) {
    session.mfaVerified = true;
    session.mfaVerifiedAt = new Date();
  }
}