/**
 * Error Handler
 * 
 * Provides a centralized error handling system with:
 * - Standardized error types and codes
 * - Consistent error responses
 * - Detailed error logging
 * - Thread-safe error tracking
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger';

/**
 * Enum of error types for categorizing different errors
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  DATABASE = 'DATABASE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
}

/**
 * Mapping error types to HTTP status codes
 */
const HTTP_STATUS_MAP: Record<ErrorType, number> = {
  [ErrorType.VALIDATION]: 400,
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.CONFLICT]: 409,
  [ErrorType.INTERNAL]: 500,
  [ErrorType.EXTERNAL_API]: 502,
  [ErrorType.DATABASE]: 503,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.TIMEOUT]: 504,
};

/**
 * Custom application error class that extends the built-in Error class
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    code: string = '',
    details: any = null,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = HTTP_STATUS_MAP[type];
    this.code = code || type;
    this.details = details;
    this.isOperational = isOperational;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Log error when created in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('AppError created', this.toJSON());
    }
  }

  /**
   * Convert the error to a JSON object
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      isOperational: this.isOperational,
      stack: this.stack,
    };
  }

  /**
   * Factory method for validation errors
   */
  public static validation(message: string, details: any = null): AppError {
    return new AppError(
      message,
      ErrorType.VALIDATION,
      'VALIDATION_ERROR',
      details,
      true
    );
  }

  /**
   * Factory method for not found errors
   */
  public static notFound(
    resource: string = 'Resource',
    id?: string | number
  ): AppError {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    
    return new AppError(
      message,
      ErrorType.NOT_FOUND,
      'NOT_FOUND_ERROR',
      { resource, id },
      true
    );
  }

  /**
   * Factory method for unauthorized errors
   */
  public static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(
      message,
      ErrorType.AUTHENTICATION,
      'UNAUTHORIZED_ERROR',
      null,
      true
    );
  }

  /**
   * Factory method for forbidden errors
   */
  public static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(
      message,
      ErrorType.AUTHORIZATION,
      'FORBIDDEN_ERROR',
      null,
      true
    );
  }

  /**
   * Factory method for conflict errors
   */
  public static conflict(
    message: string = 'Resource already exists',
    details: any = null
  ): AppError {
    return new AppError(
      message,
      ErrorType.CONFLICT,
      'CONFLICT_ERROR',
      details,
      true
    );
  }

  /**
   * Factory method for internal errors
   */
  public static internal(message: string = 'Internal server error'): AppError {
    return new AppError(
      message,
      ErrorType.INTERNAL,
      'INTERNAL_ERROR',
      null,
      true
    );
  }

  /**
   * Factory method for external API errors
   */
  public static externalApi(
    message: string = 'External API error',
    details: any = null
  ): AppError {
    return new AppError(
      message,
      ErrorType.EXTERNAL_API,
      'EXTERNAL_API_ERROR',
      details,
      true
    );
  }

  /**
   * Factory method for database errors
   */
  public static database(message: string, details: any = null): AppError {
    return new AppError(
      message,
      ErrorType.DATABASE,
      'DATABASE_ERROR',
      details,
      true
    );
  }

  /**
   * Factory method for rate limit errors
   */
  public static rateLimit(
    message: string = 'Too many requests',
    details: any = null
  ): AppError {
    return new AppError(
      message,
      ErrorType.RATE_LIMIT,
      'RATE_LIMIT_ERROR',
      details,
      true
    );
  }

  /**
   * Factory method for timeout errors
   */
  public static timeout(
    message: string = 'Operation timed out',
    details: any = null
  ): AppError {
    return new AppError(
      message,
      ErrorType.TIMEOUT,
      'TIMEOUT_ERROR',
      details,
      true
    );
  }
}

/**
 * Convert Zod validation errors to AppError
 */
export function zodErrorToAppError(error: ZodError): AppError {
  const details = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));
  
  return AppError.validation('Validation error', details);
}

/**
 * Global error handler middleware
 */
export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log all errors
  logger.error(
    err instanceof AppError ? `[${err.type}] ${err.message}` : err.message,
    {
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      ip: req.ip,
      userId: (req.user as any)?.id,
    },
    err
  );
  
  // Handle specific types of errors
  if (err instanceof AppError) {
    // If it's our custom AppError, use the status code and details from it
    const { statusCode, message, code, details, type } = err;
    
    res.status(statusCode).json({
      status: 'error',
      code,
      type,
      message,
      details: details || undefined,
    });
  } else if (err instanceof ZodError) {
    // Convert Zod validation errors to a standardized format
    const appError = zodErrorToAppError(err);
    const { statusCode, message, code, details, type } = appError;
    
    res.status(statusCode).json({
      status: 'error',
      code,
      type,
      message,
      details,
    });
  } else if (err.name === 'UnauthorizedError') {
    // Handle JWT unauthorized errors
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED_ERROR',
      type: ErrorType.AUTHENTICATION,
      message: 'Invalid token',
    });
  } else {
    // For unexpected errors, don't expose details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      type: ErrorType.INTERNAL,
      message: 'Internal server error',
      ...(isDevelopment && {
        debug: {
          message: err.message,
          stack: err.stack,
        },
      }),
    });
  }
}

/**
 * Async handler wrapper to avoid try/catch in every route
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle async operations and wrap errors
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed',
  errorType: ErrorType = ErrorType.INTERNAL,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      errorMessage,
      errorType,
      '',
      { originalError: (error as Error).message },
      true
    );
  }
}

export const errorHandler = {
  AppError,
  asyncHandler,
  globalErrorHandler,
  handleAsync,
  zodErrorToAppError,
};

export default errorHandler;