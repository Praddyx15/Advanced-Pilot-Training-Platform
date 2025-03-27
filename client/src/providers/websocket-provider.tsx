import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import useWebSocket from '@/hooks/use-websocket';
import { WebSocketStatus } from '@/lib/websocket';

// WebSocket connection status context
interface WebSocketContextType {
  isConnected: boolean;
  status: WebSocketStatus;
  connectionAttempts: number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Hook to use WebSocket context
export const useWebSocketStatus = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketStatus must be used within a WebSocketProvider');
  }
  return context;
};

// Toast messages for different connection states
const CONNECTION_MESSAGES = {
  [WebSocketStatus.CONNECTED]: { 
    title: 'Connected',
    description: 'Real-time connection established',
    variant: 'default' as const
  },
  [WebSocketStatus.DISCONNECTED]: { 
    title: 'Disconnected',
    description: 'Real-time connection lost. Trying to reconnect...',
    variant: 'destructive' as const 
  },
  [WebSocketStatus.RECONNECTING]: { 
    title: 'Reconnecting',
    description: 'Attempting to restore real-time connection...',
    variant: 'warning' as const
  },
  [WebSocketStatus.FAILED]: { 
    title: 'Connection Failed',
    description: 'Unable to establish real-time connection. Some features may be limited.',
    variant: 'destructive' as const
  }
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  showToasts?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children,
  showToasts = true
}) => {
  const { toast } = useToast();
  const { status, isConnected } = useWebSocket(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [prevStatus, setPrevStatus] = useState<WebSocketStatus | null>(null);

  // Track connection attempts and show toast messages on status changes
  useEffect(() => {
    if (status !== prevStatus) {
      // Update connection attempts counter
      if (status === WebSocketStatus.RECONNECTING) {
        setConnectionAttempts(prev => prev + 1);
      } else if (status === WebSocketStatus.CONNECTED) {
        setConnectionAttempts(0);
      }

      // Show toast message on significant changes
      if (showToasts && (
          (status === WebSocketStatus.CONNECTED && prevStatus !== null) ||  // Connected after initial load
          status === WebSocketStatus.FAILED ||
          (status === WebSocketStatus.DISCONNECTED && prevStatus === WebSocketStatus.CONNECTED) // Only on actual disconnection
        )) {
        const message = CONNECTION_MESSAGES[status];
        toast(message);
      }

      // Update previous status
      setPrevStatus(status);
    }
  }, [status, prevStatus, toast, showToasts]);

  return (
    <WebSocketContext.Provider value={{ isConnected, status, connectionAttempts }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;