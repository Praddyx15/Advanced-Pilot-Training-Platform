// Vercel API entry point adapter with enhanced error handling 
// This file specifically addresses FUNCTION_INVOCATION_FAILED and BODY_NOT_A_STRING_FROM_FUNCTION errors

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create fallback express app in case main handler fails
function createFallbackApp() {
  const app = express();
  
  // Add essential middleware
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Add baseline route handler for all routes
  app.all('*', (req, res) => {
    res.status(503).json({
      error: 'Service Temporarily Unavailable',
      message: 'The application is currently being deployed or experiencing technical difficulties.'
    });
  });
  
  return app;
}

// Import the handler with proper error handling
let handler;
try {
  // Try to import the main handler
  handler = require('./api/index.js');
  console.log('Successfully loaded API handler');
} catch (err) {
  console.error('Failed to load API handler:', err);
  
  // Create a fallback handler that returns a proper response
  const fallbackApp = createFallbackApp();
  handler = (req, res) => fallbackApp(req, res);
}

// Wrap the handler with additional error handling
const wrapHandler = (originalHandler) => {
  return (req, res) => {
    // Add safety wrappers to response methods
    const originalJson = res.json;
    res.json = function(body) {
      try {
        return originalJson.call(this, body || {});
      } catch (err) {
        console.error('JSON response error:', err);
        if (!this.headersSent) {
          return originalJson.call(this, { 
            error: 'Response Error',
            message: 'An error occurred while generating the response.'
          });
        }
      }
    };
    
    // Handle the request with error trapping
    try {
      return originalHandler(req, res);
    } catch (err) {
      console.error('Serverless function error:', err);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'The server encountered an unexpected error while processing your request.'
        });
      }
    }
  };
};

// Export wrapped handler
module.exports = wrapHandler(handler);