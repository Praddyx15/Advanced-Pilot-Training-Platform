/**
 * Standard WebSocket connection helper for non-Replit environments
 * This is a version that works in any environment and serves as a direct
 * replacement for the Replit-specific vite-hmr-fix.ts file
 */

// Store the original WebSocket constructor for later use
const OriginalWebSocket = window.WebSocket;

// Create a patched version of WebSocket that ensures connections work in all environments
class PatchedWebSocket extends OriginalWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    // Convert URL object to string if needed
    const urlString = url instanceof URL ? url.toString() : url;
    
    // Handle Vite HMR WebSocket connection
    if (urlString.includes('vite-hmr') || urlString.includes('__vite_hmr')) {
      // Fix potential connection issues with localhost
      if (urlString.includes('ws://localhost:undefined')) {
        const fixedUrl = urlString.replace('ws://localhost:undefined', 
                                          `ws://localhost:${window.location.port}`);
        super(fixedUrl, protocols);
      } else {
        super(urlString, protocols);
      }
    } 
    // Handle application WebSocket connection
    else if (urlString.includes('/ws')) {
      // Ensure we're using the correct protocol and host for our app WebSockets
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      // Build the proper WebSocket URL
      const fixedUrl = `${protocol}//${host}/ws`;
      super(fixedUrl, protocols);
    }
    // For all other WebSocket connections, use as-is
    else {
      super(urlString, protocols);
    }
  }
}

// Apply the patch by replacing the global WebSocket constructor
window.WebSocket = PatchedWebSocket;

// Export common WebSocket utilities
export const socketProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const socketHost = window.location.host;
export const socketUrl = `${socketProtocol}//${socketHost}/ws`;

/**
 * Standardized WebSocket connection for any environment
 * This function attempts to connect to a WebSocket server at the same host
 * on the standard /ws path
 */
export function connectToWebSocket() {
  try {
    console.log('[WebSocket] Connecting to', socketUrl);
    const socket = new WebSocket(socketUrl);
    
    socket.addEventListener('open', () => {
      console.log('[WebSocket] Connected');
    });
    
    socket.addEventListener('close', (event) => {
      console.log('[WebSocket] Connection closed', event.code, event.reason);
    });
    
    socket.addEventListener('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
    
    return socket;
  } catch (error) {
    console.error('[WebSocket] Connection failed:', error);
    return null;
  }
}

/**
 * Create a WebSocket URL based on the current environment
 * @param path - The path to connect to (defaults to "/ws")
 */
export function createWebSocketURL(path = '/ws'): string {
  return `${socketProtocol}//${socketHost}${path}`;
}

/**
 * Standard reconnection logic for WebSockets
 * @param createConnection - Function to create a new WebSocket connection
 * @param maxRetries - Maximum number of reconnection attempts (default: 10)
 * @param retryDelay - Initial delay between retries in ms (default: 1000, increases exponentially)
 */
export function setupReconnection(
  createConnection: () => WebSocket | null,
  maxRetries = 10,
  retryDelay = 1000
): WebSocket | null {
  let retries = 0;
  let socket: WebSocket | null = null;
  
  function connect() {
    socket = createConnection();
    
    if (!socket) {
      scheduleReconnect();
      return null;
    }
    
    socket.addEventListener('close', () => {
      scheduleReconnect();
    });
    
    return socket;
  }
  
  function scheduleReconnect() {
    if (retries >= maxRetries) {
      console.log('[WebSocket] Max retries reached, giving up');
      return;
    }
    
    const delay = retryDelay * Math.pow(1.5, retries);
    retries++;
    
    console.log(`[WebSocket] Reconnecting in ${Math.round(delay/1000)}s (attempt ${retries}/${maxRetries})`);
    
    setTimeout(() => {
      connect();
    }, delay);
  }
  
  return connect();
}

// Debug output to confirm patch is applied
console.log('[vite-hmr-fix-standard] WebSocket patch applied for non-Replit environment');

export default {};