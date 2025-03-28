/**
 * Standard WebSocket Fix for Vite HMR and application WebSockets
 * 
 * This script patches the native WebSocket to properly handle WebSocket 
 * connections in the Vite development environment and in production.
 * It works in any deployment environment, not just Replit.
 */

// Store the original WebSocket constructor
const OriginalWebSocket = window.WebSocket;

// Create a patched version of WebSocket
class PatchedWebSocket extends OriginalWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    // Convert URL object to string if needed
    const urlString = url instanceof URL ? url.toString() : url;
    
    // Check if this is a Vite HMR WebSocket connection
    if (urlString.includes('vite-hmr') || urlString.includes('__vite_hmr')) {
      // Handle any HMR URL normalization if needed
      if (urlString.includes('ws://localhost:undefined')) {
        const fixedUrl = urlString.replace('ws://localhost:undefined', 
                                        `ws://localhost:${window.location.port}`);
        super(fixedUrl, protocols);
      } else {
        super(urlString, protocols);
      }
    } 
    // Check if this is our application WebSocket connection
    else if (urlString.includes('/ws')) {
      // For our app WebSockets, ensure we're using the correct protocol and host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      // Build the proper WebSocket URL
      const fixedUrl = `${protocol}//${host}/ws`;
      super(fixedUrl, protocols);
    }
    // For all other WebSocket connections, use them as-is
    else {
      super(urlString, protocols);
    }
  }
}

// Apply the patch by replacing the global WebSocket constructor
window.WebSocket = PatchedWebSocket;

// Debug output to confirm patch is applied
console.log('[vite-hmr-fix] WebSocket patch applied (standard version)');

export default {};