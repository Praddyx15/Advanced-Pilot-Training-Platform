import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketOptions {
  onOpen?: (ev: Event) => void;
  onMessage?: (data: any) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options?: WebSocketOptions) => {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const subscribedChannels = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const manualConnectRef = useRef(false);

  const reconnectDelay = options?.reconnectDelay || 3000;
  const maxReconnectAttempts = options?.maxReconnectAttempts || 5;

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Create new WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = (ev) => {
        console.log('[WebSocket] Connected');
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        options?.onOpen?.(ev);

        // Resubscribe to all channels after reconnection
        subscribedChannels.current.forEach((channel) => {
          socket.send(JSON.stringify({ type: 'subscribe', channel }));
        });
      };

      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          setLastMessage(data);
          options?.onMessage?.(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      socket.onclose = (ev) => {
        console.log('[WebSocket] Connection closed', ev.code, ev.reason);
        setConnected(false);
        options?.onClose?.(ev);
        
        // Only auto-reconnect if not manually closed and within reconnect attempts limit
        if (manualConnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`[WebSocket] Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            initWebSocket();
          }, reconnectDelay);
        }
      };

      socket.onerror = (ev) => {
        console.error('[WebSocket] Error:', ev);
        options?.onError?.(ev);
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
    }
  }, [options, reconnectDelay, maxReconnectAttempts]);

  // Connect manually
  const connect = useCallback(() => {
    manualConnectRef.current = true;
    initWebSocket();
  }, [initWebSocket]);

  // Disconnect manually
  const disconnect = useCallback(() => {
    manualConnectRef.current = false;
    
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  }, []);

  // Initialize connection when component mounts
  useEffect(() => {
    initWebSocket();
    
    return () => {
      // Clean up on unmount
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnect on unmount
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
      }
    };
  }, [initWebSocket]);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    subscribedChannels.current.add(channel);
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }
    
    return () => unsubscribe(channel);
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    subscribedChannels.current.delete(channel);
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        channel
      }));
    }
  }, []);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  return {
    connected,
    lastMessage,
    socket: socketRef.current,
    subscribe,
    unsubscribe,
    sendMessage,
    connect,
    disconnect
  };
};