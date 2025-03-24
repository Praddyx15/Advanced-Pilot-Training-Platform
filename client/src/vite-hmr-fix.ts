/**
 * This module creates a workaround for Vite's HMR WebSocket connection issues in Replit
 * It catches and suppresses WebSocket connection errors
 */

// Create a simpler solution by adding a global error handler
// This just suppresses the WebSocket error without monkey-patching the WebSocket constructor
window.addEventListener('error', function(event) {
  // Check if the error is related to WebSocket with undefined port
  if (event.message && (
    event.message.includes('wss://localhost:undefined') ||
    event.message.includes('WebSocket connection to \'wss://localhost:undefined\'')
  )) {
    // Prevent the error from showing in the console
    event.preventDefault();
    console.info('[HMR] WebSocket connection error suppressed');
    return false;
  }
}, true);

// Intercept error events on the window
const originalConsoleError = console.error;
console.error = function(...args: any[]) {
  // Check if this is a WebSocket error message
  if (args.length > 0 && 
      typeof args[0] === 'string' && 
      (args[0].includes('WebSocket connection to') || 
       args[0].includes('localhost:undefined'))) {
    console.info('[HMR] Suppressed WebSocket error:', args[0].substring(0, 50) + '...');
    return;
  }
  
  // Otherwise, pass through to the original console.error
  originalConsoleError.apply(console, args);
};

export {};