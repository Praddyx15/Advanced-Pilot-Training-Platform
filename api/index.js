// Vercel API handler with enhanced error handling
// Specifically addressing FUNCTION_INVOCATION_FAILED and BODY_NOT_A_STRING_FROM_FUNCTION issues

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { parse: parseUrl } = require('url');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const session = require('express-session');
const memorystore = require('memorystore');
const path = require('path');
const fs = require('fs');

// Global error variable to track initialization
let initializationError = null;

// Create memory store for sessions
const MemoryStore = memorystore(session);

// Create a properly configured Express app
function createExpressApp() {
  const app = express();
  
  // Add middleware
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Configure session middleware
  const sessionSecret = process.env.SESSION_SECRET || 'pilot-training-platform-session-secret';
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    })
  }));

  // Add global error handling middleware
  app.use((err, req, res, next) => {
    console.error('Express error handler:', err);
    
    // Don't expose stack traces in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message;
    
    res.status(500).json({
      error: 'Server Error',
      message: errorMessage
    });
  });

  return app;
}

// Initialize Express app
let app = createExpressApp();

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server if not in serverless environment
if (!process.env.VERCEL) {
  try {
    const wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });
    
    // Handle WebSocket connections
    wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      
      // Handle messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          // Handle subscribe action
          if (data.action === 'subscribe' && data.channel) {
            ws.channels = ws.channels || new Set();
            ws.channels.add(data.channel);
            console.log(`WebSocket client subscribed to: ${data.channel}`);
          }
          
          // Handle unsubscribe action
          if (data.action === 'unsubscribe' && data.channel) {
            if (ws.channels) {
              ws.channels.delete(data.channel);
              console.log(`WebSocket client unsubscribed from: ${data.channel}`);
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      });
      
      // Handle disconnections
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      // Send heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);
    });
  } catch (err) {
    console.error('Failed to initialize WebSocket server:', err);
    initializationError = err;
  }
}

// Try to load the actual application routes
try {
  // Import server-side routes (with modules potentially compiled from TypeScript)
  const serverDir = path.join(process.cwd(), 'dist', 'server');
  
  // First attempt: Try to use the routes.js file if it exists
  if (fs.existsSync(path.join(serverDir, 'routes.js'))) {
    const { registerRoutes } = require(path.join(serverDir, 'routes.js'));
    
    // Register routes with the Express app
    registerRoutes(app);
    console.log('Successfully registered application routes');
  } else {
    console.warn('Could not find routes.js file. Using fallback routes.');
    
    // Add fallback routes
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    app.all('/api/*', (req, res) => {
      res.status(503).json({
        error: 'Service Temporarily Unavailable',
        message: 'The API is currently being deployed or experiencing technical difficulties.'
      });
    });
  }
} catch (err) {
  console.error('Failed to register routes:', err);
  initializationError = err;
  
  // Add fallback error route
  app.all('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(500).json({
        error: 'Server Initialization Failed',
        message: 'The server encountered an error during initialization. Please try again later.'
      });
    } else {
      // For non-API routes, serve the SPA
      res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
    }
  });
}

// Serve static files for single-page application
if (!process.env.VERCEL) {
  app.use(express.static(path.join(process.cwd(), 'dist', 'public')));
  
  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
    }
  });
}

// Start server if not in serverless environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  try {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    initializationError = err;
  }
}

// Serverless function handler with proper error handling
const serverlessHandler = (req, res) => {
  try {
    // Wrap response object methods to prevent common serverless errors
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;
    
    // Fix for BODY_NOT_A_STRING_FROM_FUNCTION errors
    res.json = function(body) {
      try {
        // Ensure body exists and is serializable
        const safeBody = body === undefined ? {} : body;
        return originalJson.call(this, safeBody);
      } catch (err) {
        console.error('Error in res.json:', err);
        if (!this.headersSent) {
          return originalJson.call(this, { error: 'Response Error' });
        }
      }
    };
    
    res.send = function(body) {
      try {
        // Convert non-string, non-Buffer responses to strings
        if (body && typeof body !== 'string' && !Buffer.isBuffer(body)) {
          try {
            body = JSON.stringify(body);
          } catch (e) {
            console.error('Failed to stringify response:', e);
            body = JSON.stringify({ error: 'Response conversion error' });
          }
        }
        return originalSend.call(this, body);
      } catch (err) {
        console.error('Error in res.send:', err);
        if (!this.headersSent) {
          return originalSend.call(this, '{"error": "Internal Server Error"}');
        }
      }
    };
    
    res.end = function(chunk, encoding) {
      try {
        return originalEnd.call(this, chunk, encoding);
      } catch (err) {
        console.error('Error in res.end:', err);
        if (!this.headersSent) {
          this.setHeader('Content-Type', 'application/json');
          return originalEnd.call(this, '{"error": "Internal Server Error"}', 'utf8');
        }
      }
    };
    
    // Pass the request to Express
    return app(req, res);
  } catch (err) {
    console.error('Global serverless handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Unhandled Runtime Error',
        message: 'The application encountered an unexpected error.'
      });
    }
  }
};

// Export the handler for serverless use
module.exports = serverlessHandler;