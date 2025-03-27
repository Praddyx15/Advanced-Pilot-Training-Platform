import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  initializeCore, 
  logger, 
  configManager, 
  AppError,
  globalErrorHandler,
  asyncHandler,
  ErrorType
} from "./core";

// Initialize core modules
initializeCore();

// Get configuration
const serverConfig = configManager.get('server');
const securityConfig = configManager.get('security');
const performanceConfig = configManager.get('performance');

// Create Express application
const app = express();

// Security middleware
if (securityConfig.helmetEnabled) {
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP in development
  }));
}

if (securityConfig.corsEnabled) {
  app.use(cors({
    origin: '*', // Allow all origins in development
    credentials: true,
  }));
}

// Performance middleware
// Enable compression by default
app.use(compression());

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Define a type for our log context
interface ApiLogContext {
  status: number;
  duration: string;
  contentLength: string | undefined;
  response?: Record<string, any>;
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Track request context for logger
  logger.setContext({
    requestId: req.headers['x-request-id'] || crypto.randomUUID(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response data for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log on request completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    if (path.startsWith("/api")) {
      // Create initial log context
      const initialLogContext: ApiLogContext = {
        status: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('content-length'),
      };
      
      // Final log context (potentially with response data)
      let logContext = initialLogContext;
      
      // Don't log response body for large responses
      if (capturedJsonResponse && 
          JSON.stringify(capturedJsonResponse).length < 500) {
        logContext = {
          ...initialLogContext,
          response: capturedJsonResponse
        };
      }
      
      if (res.statusCode >= 500) {
        logger.error(`${req.method} ${path} ${res.statusCode} in ${duration}ms`, logContext);
      } else if (res.statusCode >= 400) {
        logger.warn(`${req.method} ${path} ${res.statusCode} in ${duration}ms`, logContext);
      } else {
        logger.info(`${req.method} ${path} ${res.statusCode} in ${duration}ms`, logContext);
      }
      
      // Legacy logging for compatibility
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
    
    // Clear request context
    logger.clearContext();
  });

  next();
});

(async () => {
  // Register all routes
  const server = await registerRoutes(app);
  
  // Global error handler
  app.use(globalErrorHandler);
  
  // Set up Vite for development or static serving for production
  if (serverConfig.environment === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Get the configured port (default: 5000)
  const port = serverConfig.port;
  
  // Start the server
  server.listen(port, () => {
    logger.info(`Server started`, { 
      port, 
      environment: serverConfig.environment,
      host: serverConfig.host 
    });
    log(`serving on port ${port}`);
  });
  
  // Handle graceful shutdown
  const handleShutdown = async () => {
    logger.info('Received shutdown signal, closing server...');
    
    // Close the HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Perform any other cleanup here
      process.exit(0);
    });
    
    // Force exit after timeout
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
})();
