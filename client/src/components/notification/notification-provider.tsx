import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWebSocket, WebSocketMessage } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isConnected: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  
  // WebSocket connection
  const { 
    isConnected,
    lastMessage,
    subscribe 
  } = useWebSocket({
    onOpen: () => {
      // Subscribe to notifications channel when connected
      subscribe('notifications');
    },
    onMessage: (data) => {
      // Handle different message types
      if (data.type === 'notification') {
        addNotification(data);
      }
    }
  });

  // Add a new notification
  const addNotification = (data: WebSocketMessage) => {
    const newNotification: Notification = {
      id: data.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: data.notificationType || 'info',
      title: data.title || 'New Notification',
      message: data.message || '',
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      priority: data.priority || 'medium',
      metadata: data.metadata
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast for high priority notifications
    if (newNotification.priority === 'high' || newNotification.priority === 'critical') {
      toast({
        title: newNotification.title,
        description: newNotification.message,
        variant: newNotification.priority === 'critical' ? 'destructive' : undefined
      });
    }
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== id)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add sample notification if needed for testing
  useEffect(() => {
    // This is just for demo purposes - in a real app, notifications would come from the server
    if (process.env.NODE_ENV === 'development' && notifications.length === 0) {
      // Optional: Add a sample notification for testing UI
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      isConnected
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}