import React from 'react';
import { useWebSocketStatus } from '@/providers/websocket-provider';
import { WebSocketStatus } from '@/lib/websocket';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  [WebSocketStatus.CONNECTED]: {
    icon: Wifi,
    color: 'text-green-500',
    label: 'Connected',
    description: 'Real-time connection is active'
  },
  [WebSocketStatus.CONNECTING]: {
    icon: Loader2,
    color: 'text-blue-500 animate-spin',
    label: 'Connecting',
    description: 'Establishing real-time connection...'
  },
  [WebSocketStatus.DISCONNECTED]: {
    icon: WifiOff,
    color: 'text-orange-500',
    label: 'Disconnected',
    description: 'Real-time connection is inactive'
  },
  [WebSocketStatus.RECONNECTING]: {
    icon: Loader2,
    color: 'text-amber-500 animate-spin',
    label: 'Reconnecting',
    description: 'Attempting to restore connection...'
  },
  [WebSocketStatus.FAILED]: {
    icon: AlertTriangle,
    color: 'text-red-500',
    label: 'Connection Failed',
    description: 'Unable to establish real-time connection'
  }
};

interface WebSocketStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: number;
}

export function WebSocketStatusIndicator({
  className,
  showLabel = false,
  size = 16
}: WebSocketStatusIndicatorProps) {
  const { status, connectionAttempts } = useWebSocketStatus();
  const config = statusConfig[status];
  const IconComponent = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <IconComponent className={cn(config.color)} size={size} />
            {showLabel && <span className="text-sm">{config.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex flex-col">
            <span className="font-semibold">{config.label}</span>
            <span className="text-xs text-muted-foreground">{config.description}</span>
            {(status === WebSocketStatus.RECONNECTING || status === WebSocketStatus.FAILED) && (
              <span className="text-xs mt-1">
                {status === WebSocketStatus.RECONNECTING 
                  ? `Attempt ${connectionAttempts}/10`
                  : 'Try refreshing the page'}
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default WebSocketStatusIndicator;