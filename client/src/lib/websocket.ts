import { toast } from "@/hooks/use-toast";

/**
 * WebSocket connection statuses
 */
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

/**
 * WebSocket subscription topics
 */
export type WebSocketTopic = 'notifications' | 'status' | 'messages' | string;

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: string;
  topic?: WebSocketTopic;
  data?: any;
  timestamp: number;
}

/**
 * WebSocket subscription handler type
 */
export type WebSocketHandler = (data: any) => void;

/**
 * WebSocket client with auto-reconnect and subscription capabilities
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 2000; // Start with 2 seconds
  private subscriptions: Map<WebSocketTopic, Set<WebSocketHandler>> = new Map();
  private statusHandlers: Set<(status: WebSocketStatus) => void> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPongTime: number = 0;

  /**
   * Create a new WebSocket client
   * @param url WebSocket server URL
   */
  constructor(url?: string) {
    // Determine the WebSocket URL from the window location if not provided
    if (!url) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${protocol}//${window.location.host}/ws`;
    } else {
      this.url = url;
    }
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    this.setStatus(WebSocketStatus.CONNECTING);
    
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      
      console.log('[WebSocket] Connecting to', this.url);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.setStatus(WebSocketStatus.FAILED);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.clearReconnectTimer();
    this.clearPingInterval();
    
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('[WebSocket] Error closing connection:', e);
      }
      
      this.socket = null;
      this.setStatus(WebSocketStatus.DISCONNECTED);
    }
  }

  /**
   * Subscribe to a WebSocket topic
   * @param topic Topic to subscribe to
   * @param handler Function to handle incoming messages
   */
  public subscribe(topic: WebSocketTopic, handler: WebSocketHandler): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      
      // If we're already connected, send a subscription message
      if (this.isConnected()) {
        this.sendSubscription(topic);
      }
    }
    
    this.subscriptions.get(topic)?.add(handler);
  }

  /**
   * Unsubscribe from a WebSocket topic
   * @param topic Topic to unsubscribe from
   * @param handler Function to remove from handlers
   */
  public unsubscribe(topic: WebSocketTopic, handler: WebSocketHandler): void {
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(topic);
      }
    }
  }

  /**
   * Subscribe to WebSocket status changes
   * @param handler Function to handle status changes
   */
  public onStatusChange(handler: (status: WebSocketStatus) => void): void {
    this.statusHandlers.add(handler);
    // Immediately call with current status
    handler(this.status);
  }

  /**
   * Remove a status change handler
   * @param handler Handler to remove
   */
  public offStatusChange(handler: (status: WebSocketStatus) => void): void {
    this.statusHandlers.delete(handler);
  }

  /**
   * Send a message through the WebSocket
   * @param type Message type
   * @param data Message data
   */
  public send(type: string, data?: any): void {
    if (!this.isConnected()) {
      console.warn('[WebSocket] Cannot send message, not connected');
      this.connect();
      return;
    }
    
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now()
    };
    
    try {
      this.socket!.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      this.reconnect();
    }
  }

  /**
   * Check if the WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current WebSocket status
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[WebSocket] Connected');
    this.setStatus(WebSocketStatus.CONNECTED);
    this.reconnectAttempts = 0;
    
    // Set up ping interval to keep connection alive
    this.startPingInterval();
    
    // Send subscriptions for all topics
    this.subscriptions.forEach((_, topic) => {
      this.sendSubscription(topic);
    });
  }

  /**
   * Handle WebSocket close event
   * @param event Close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[WebSocket] Connection closed ${event.code} ${event.reason}`);
    
    this.clearPingInterval();
    
    if (this.status !== WebSocketStatus.DISCONNECTED) {
      this.setStatus(WebSocketStatus.DISCONNECTED);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   * @param event Error event
   */
  private handleError(event: Event): void {
    console.error('[WebSocket] Error:', event);
    
    if (this.status === WebSocketStatus.CONNECTING) {
      this.setStatus(WebSocketStatus.FAILED);
    }
    
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket message event
   * @param event Message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Handle pong messages
      if (message.type === 'pong') {
        this.lastPongTime = Date.now();
        return;
      }
      
      // Dispatch message to subscribers
      if (message.topic && this.subscriptions.has(message.topic)) {
        this.subscriptions.get(message.topic)?.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            console.error(`[WebSocket] Error in handler for topic ${message.topic}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  }

  /**
   * Send a subscription message
   * @param topic Topic to subscribe to
   */
  private sendSubscription(topic: WebSocketTopic): void {
    if (this.isConnected()) {
      this.send('subscribe', { topic });
      console.log(`[WebSocket] Subscribed to topic: ${topic}`);
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[WebSocket] Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.setStatus(WebSocketStatus.FAILED);
      toast({
        title: "Connection Error",
        description: "Failed to establish a stable connection. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    const delay = Math.min(30000, this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts));
    
    console.log(`[WebSocket] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    this.setStatus(WebSocketStatus.RECONNECTING);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Clear the reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start the ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.clearPingInterval();
    this.lastPongTime = Date.now();
    
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        // Check if we've received a pong recently
        if (Date.now() - this.lastPongTime > 30000) {
          console.warn('[WebSocket] No pong received in 30s, reconnecting');
          this.reconnect();
          return;
        }
        
        this.send('ping');
      } else {
        this.clearPingInterval();
      }
    }, 15000); // Send ping every 15 seconds
  }

  /**
   * Clear the ping interval
   */
  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Force a reconnection
   */
  public reconnect(): void {
    this.disconnect();
    this.scheduleReconnect();
  }

  /**
   * Set the WebSocket status and notify handlers
   * @param status New status
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      
      // Notify all status handlers
      this.statusHandlers.forEach(handler => {
        try {
          handler(status);
        } catch (error) {
          console.error('[WebSocket] Error in status handler:', error);
        }
      });
    }
  }
}

// Create a singleton instance
const websocketClient = new WebSocketClient();

export default websocketClient;