// This file serves as a Vercel serverless function handler
// It follows the Vercel serverless function pattern & fixes BODY_NOT_A_STRING_FROM_FUNCTION error

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require = require('esm')(module);

// Initialize env variables
try {
  const dotenvPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }
} catch (err) {
  console.warn('Error loading .env.local file', err);
}

// Create an Express app instance that can handle errors gracefully
const fallbackApp = express();
fallbackApp.use(bodyParser.json({ limit: '50mb' }));
fallbackApp.use(bodyParser.urlencoded({ extended: true }));
fallbackApp.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Get the main app or use the fallback
let app;
try {
  // Import the TypeScript-compiled Express application
  app = require('../dist/server/index.js').default;
  console.log('Successfully loaded main Express application');
} catch (err) {
  console.error('Error loading main application:', err);
  
  // Set up fallback routes
  fallbackApp.all('*', (req, res) => {
    // Use a properly formatted response to avoid BODY_NOT_A_STRING_FROM_FUNCTION
    res.status(503).json({
      error: 'Service Temporarily Unavailable',
      message: 'The server is currently experiencing technical difficulties. Please try again later.'
    });
  });
  
  // Use the fallback app
  app = fallbackApp;
}

// This is the actual serverless function handler
const serverlessHandler = (req, res) => {
  try {
    // Ensure URL has a consistent format
    if (!req.url.startsWith('/')) {
      req.url = '/' + req.url;
    }

    // Special handling for WebSocket upgrade requests
    if (req.method === 'GET' && req.headers && req.headers.upgrade === 'websocket') {
      req.url = '/ws';
    }

    // Add error handling wrapper around the response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      try {
        return originalEnd.call(this, chunk, encoding);
      } catch (error) {
        console.error('Response end error:', error);
        // Try to send a fallback response if headers haven't been sent
        if (!this.headersSent) {
          this.setHeader('Content-Type', 'application/json');
          return originalEnd.call(
            this, 
            JSON.stringify({ error: 'Internal Server Error' }),
            'utf8'
          );
        }
      }
    };

    // Call the Express app
    app(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    
    // Send a failsafe response
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

// Export the handler for Vercel
module.exports = serverlessHandler;