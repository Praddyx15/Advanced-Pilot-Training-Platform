import { useState } from 'react';
import { useNotifications } from './notification-provider';
import { Button } from '@/components/ui/button';
import { BellIcon, BellOffIcon, CheckIcon, TrashIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications,
    isConnected 
  } = useNotifications();

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getPriorityStyles = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default: // low or undefined
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckIcon className="h-4 w-4 text-green-500" />;
      case 'error':
        return <BellIcon className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <BellIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <BellIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          {isConnected ? (
            <BellIcon className="h-5 w-5" />
          ) : (
            <BellOffIcon className="h-5 w-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Notifications</CardTitle>
              <Badge
                variant={isConnected ? "outline" : "secondary"}
                className="text-xs px-2"
              >
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
            </div>
            <CardDescription className="flex justify-between">
              <span>
                {notifications.length === 0
                  ? 'No notifications'
                  : `${unreadCount} unread of ${notifications.length} notifications`}
              </span>
              {notifications.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all read
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={clearAllNotifications}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="flex flex-col divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 hover:bg-muted transition-colors",
                        !notification.read && "bg-muted/50"
                      )}
                      role="button"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span>{getTypeIcon(notification.type)}</span>
                          <h4 className="text-sm font-medium">
                            {notification.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <time className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </time>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      {notification.priority && (
                        <Badge 
                          variant="outline" 
                          className={cn("mt-2 text-[10px] px-1 py-0", 
                            getPriorityStyles(notification.priority)
                          )}
                        >
                          {notification.priority}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <BellOffIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No new notifications</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 p-2 text-xs text-muted-foreground">
            <span className="w-full text-center">
              {isConnected 
                ? "Connected to notification service" 
                : "Notification service disconnected"}
            </span>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}