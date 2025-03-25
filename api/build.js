/**
 * Vercel Serverless Function Build Script
 * 
 * This script is used by Vercel during the build process to create serverless functions.
 * It ensures that the API is properly set up for a serverless environment.
 */

const fs = require('fs');
const path = require('path');

// Ensure the API directory exists
const apiDir = path.join(__dirname);
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Create a minimal index.js file if it doesn't exist
const apiIndexPath = path.join(apiDir, 'index.js');
if (!fs.existsSync(apiIndexPath)) {
  const apiIndexContent = `
/**
 * API entry point for serverless function handling
 * Created by build.js during Vercel deployment
 */
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const MemoryStore = require('memorystore')(session);

const app = express();
app.use(express.json());

// Session setup
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Default 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Export for serverless function handling
module.exports = (req, res) => {
  return app(req, res);
};
`;
  fs.writeFileSync(apiIndexPath, apiIndexContent);
  console.log(`Created ${apiIndexPath}`);
}

// Create a fallback vercel.json config if it doesn't exist at the root
const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
if (!fs.existsSync(vercelConfigPath)) {
  const vercelConfig = {
    "version": 2,
    "builds": [
      {
        "src": "api/index.js",
        "use": "@vercel/node"
      },
      {
        "src": "client/dist/**",
        "use": "@vercel/static"
      }
    ],
    "routes": [
      {
        "src": "/api/(.*)",
        "dest": "api/index.js"
      },
      {
        "src": "/(.*)",
        "dest": "client/dist/$1"
      }
    ]
  };
  fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
  console.log(`Created ${vercelConfigPath}`);
}

console.log('Build script completed successfully');