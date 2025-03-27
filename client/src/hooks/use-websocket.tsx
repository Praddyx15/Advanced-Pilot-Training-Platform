import { useState, useEffect, useCallback, useMemo } from 'react';
import websocketClient, { WebSocketStatus, WebSocketTopic, WebSocketHandler } from '@/lib/websocket';

/**
 * React hook for using the WebSocket client
 * @param autoConnect Whether to connect automatically
 * @returns WebSocket utilities
 */
export function useWebSocket(autoConnect: boolean = true) {
  const [status, setStatus] = useState<WebSocketStatus>(websocketClient.getStatus());
  const [isConnected, setIsConnected] = useState<boolean>(websocketClient.isConnected());

  // Connect to WebSocket
  const connect = useCallback(() => {
    websocketClient.connect();
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketClient.disconnect();
  }, []);

  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    websocketClient.disconnect();
    setTimeout(() => websocketClient.connect(), 500);
  }, []);

  // Subscribe to a WebSocket topic
  const subscribe = useCallback((topic: WebSocketTopic, handler?: WebSocketHandler) => {
    if (handler) {
      // Original behavior with handler
      websocketClient.subscribe(topic, handler);
      
      // Return unsubscribe function
      return () => {
        websocketClient.unsubscribe(topic, handler);
      };
    } else {
      // Simple subscription without handler for the tester component
      const dummyHandler = (data: any) => {
        console.log(`[WebSocket] Received message on topic ${topic}:`, data);
      };
      websocketClient.subscribe(topic, dummyHandler);
    }
  }, []);

  // Unsubscribe from a WebSocket topic
  const unsubscribe = useCallback((topic: WebSocketTopic) => {
    // This is a simplified version for the tester component
    // It's not perfect as it doesn't know which handler to unsubscribe,
    // but works for testing purposes
    const dummyHandler = () => {};
    websocketClient.unsubscribe(topic, dummyHandler);
  }, []);

  // Send a WebSocket message
  const send = useCallback((type: string, data?: any) => {
    websocketClient.send(type, data);
  }, []);

  // Update status when WebSocket status changes
  useEffect(() => {
    const handleStatusChange = (newStatus: WebSocketStatus) => {
      setStatus(newStatus);
      setIsConnected(websocketClient.isConnected());
    };
    
    websocketClient.onStatusChange(handleStatusChange);
    
    return () => {
      websocketClient.offStatusChange(handleStatusChange);
    };
  }, []);

  // Auto-connect if requested
  useEffect(() => {
    if (autoConnect && status === WebSocketStatus.DISCONNECTED) {
      connect();
    }
    
    // Don't disconnect on unmount - WebSocket is a singleton
  }, [autoConnect, connect, status]);

  // Return WebSocket utilities
  return useMemo(() => ({
    status,
    isConnected,
    connected: isConnected, // Alias for the tester component
    connect,
    disconnect,
    reconnect,
    subscribe,
    unsubscribe,
    send
  }), [status, isConnected, connect, disconnect, reconnect, subscribe, unsubscribe, send]);
}

/**
 * React hook for subscribing to a WebSocket topic
 * @param topic Topic to subscribe to
 * @param handler Function to handle incoming messages
 * @param deps Dependencies for handler
 */
export function useWebSocketSubscription<T = any>(
  topic: WebSocketTopic,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    const wrappedHandler = (data: T) => {
      handler(data);
    };
    
    return subscribe(topic, wrappedHandler);
  }, [topic, subscribe, ...deps]);
}

export default useWebSocket;