/**
 * Standard WebSocket connection helper for non-Replit environments
 * This is a simplified version of vite-hmr-fix.ts that works in any environment
 */

export const socketProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const socketHost = window.location.host;
export const socketUrl = `${socketProtocol}//${socketHost}/ws`;

/**
 * Standardized WebSocket connection for any environment
 * This function attempts to connect to a WebSocket server at the same host
 * on the standard /ws path
 */
export function connectToWebSocket() {
  // This function is called in client/src/lib/websocket.ts when creating connections
  // It offers a standard approach to setting up WebSockets in any environment
  
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