import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketOptions {
  onOpen?: (ev: Event) => void;
  onMessage?: (data: any) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
}

export const useWebSocket = (options?: WebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const subscribedChannels = useRef<Set<string>>(new Set());

  // Connect to the WebSocket server
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = (ev) => {
        setIsConnected(true);
        options?.onOpen?.(ev);

        // Resubscribe to existing channels
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
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      socket.onclose = (ev) => {
        setIsConnected(false);
        options?.onClose?.(ev);
      };

      socket.onerror = (ev) => {
        console.error('WebSocket error:', ev);
        options?.onError?.(ev);
      };

      return () => {
        // Clean up the socket on component unmount
        if (socket.readyState === 1) { // 1 = OPEN
          socket.close();
        }
      };
    }
  }, [options]);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    subscribedChannels.current.add(channel);
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }
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
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
    sendMessage
  };
};