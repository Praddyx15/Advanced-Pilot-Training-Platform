// Vercel API entry point adapter
// This file redirects API requests to our serverless function

// Simple wrapper around our api/index.js handler
module.exports = require('./api/index.js');