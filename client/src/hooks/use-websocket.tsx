import { useState, useEffect, useRef, useCallback } from 'react';

export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type UseWebSocketOptions = {
  onOpen?: (event: Event) => void;
  onMessage?: (data: any) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  autoConnect?: boolean;
};

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    reconnectInterval = 5000,
    reconnectAttempts = 10,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectCountRef = useRef(0);

  // Create connection string
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    // Clear any existing socket
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = (event) => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
        if (onOpen) onOpen(event);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (event) => {
        if (onError) onError(event);
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        
        if (onClose) onClose(event);
        
        // Try to reconnect if not explicitly closed by the client
        if (event.code !== 1000) {
          reconnectCountRef.current += 1;
          if (reconnectCountRef.current <= reconnectAttempts) {
            reconnectTimeoutRef.current = window.setTimeout(() => {
              connect();
            }, reconnectInterval);
          }
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [getWebSocketUrl, onOpen, onMessage, onError, onClose, reconnectInterval, reconnectAttempts]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnected');
      socketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Send message to WebSocket server
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Ping the server
  const ping = useCallback(() => {
    return sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
  }, [sendMessage]);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    return sendMessage({ 
      type: 'subscribe', 
      channel,
      timestamp: new Date().toISOString() 
    });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    ping,
    subscribe,
  };
}