/**
 * Core Module Index
 * 
 * Central exports for core modules to simplify imports elsewhere in the application
 */

// Configuration management
export { default as configManager } from './config-manager';

// Logging system
export { default as logger, LogLevel } from './logger';

// Error handling
export { 
  default as errorHandler, 
  AppError, 
  ErrorType, 
  globalErrorHandler, 
  asyncHandler,
  handleAsync,
  zodErrorToAppError
} from './error-handler';

// Database management
export { default as dbManager } from './db-manager';

// Security utilities
export { default as securityManager } from './security-manager';

// Export a function to initialize all core modules
export function initializeCore() {
  // Initialize in order of dependencies
  const config = configManager.getConfig();
  logger.info('Core modules initialized', { 
    environment: config.server.environment 
  });
  
  return {
    config: configManager,
    logger,
    error: errorHandler,
    db: dbManager,
    security: securityManager
  };
}

export default {
  configManager,
  logger,
  errorHandler,
  dbManager,
  securityManager,
  initializeCore
};