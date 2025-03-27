import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PlayIcon, SendIcon, RotateCcw } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import websocketClient from '@/lib/websocket';
import { cn } from '@/lib/utils';

interface WebSocketTesterProps {
  onMessageReceived?: (message: string) => void;
  onStatusChange?: (connected: boolean) => void;
  className?: string;
}

export function WebSocketTester({
  onMessageReceived,
  onStatusChange,
  className
}: WebSocketTesterProps) {
  const [channel, setChannel] = useState<string>('notifications');
  const [message, setMessage] = useState<string>('');
  const { toast } = useToast();
  const { connected, subscribe, unsubscribe, send } = useWebSocket();

  // Handle connection status changes
  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(connected);
    }
  }, [connected, onStatusChange]);

  // Subscribe to channel
  const handleSubscribe = useCallback(() => {
    if (!channel.trim()) {
      toast({
        title: "Error",
        description: "Please enter a channel name",
        variant: "destructive",
      });
      return;
    }

    try {
      subscribe(channel);
      
      toast({
        title: "Subscribed",
        description: `Subscribed to channel: ${channel}`,
      });
    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [channel, subscribe, toast]);

  // Unsubscribe from channel
  const handleUnsubscribe = useCallback(() => {
    if (!channel.trim()) {
      toast({
        title: "Error",
        description: "Please enter a channel name",
        variant: "destructive",
      });
      return;
    }

    unsubscribe(channel);
    
    toast({
      title: "Unsubscribed",
      description: `Unsubscribed from channel: ${channel}`,
    });
  }, [channel, unsubscribe, toast]);

  // Send message
  const handleSendMessage = useCallback(() => {
    if (!channel.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please enter both channel and message",
        variant: "destructive",
      });
      return;
    }

    try {
      send(channel, message);
      
      toast({
        title: "Message Sent",
        description: `Message sent to channel: ${channel}`,
      });
      
      // Clear message input after sending
      setMessage('');
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [channel, message, send, toast]);

  // Reconnect to WebSocket
  const handleReconnect = useCallback(() => {
    websocketClient.reconnect();
    
    toast({
      title: "Reconnecting",
      description: "Attempting to reconnect WebSocket...",
    });
  }, [toast]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>WebSocket Tester</CardTitle>
        <CardDescription>
          Test WebSocket connection, send messages, and subscribe to channels
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            connected ? "bg-green-500" : "bg-red-500"
          )} />
          <span>{connected ? "Connected" : "Disconnected"}</span>
          
          <Button 
            variant="outline" 
            size="sm"
            className="ml-auto"
            onClick={handleReconnect}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Subscribe/Unsubscribe</h3>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Channel name"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              />
              
              <Button 
                variant="outline" 
                className="shrink-0" 
                onClick={handleSubscribe}
              >
                Subscribe
              </Button>
              
              <Button 
                variant="outline" 
                className="shrink-0" 
                onClick={handleUnsubscribe}
              >
                Unsubscribe
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Send Message</h3>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Message to send"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              
              <Button 
                className="shrink-0" 
                onClick={handleSendMessage}
              >
                <SendIcon className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          variant="default" 
          onClick={() => {
            handleSubscribe();
            setTimeout(() => {
              send(channel, JSON.stringify({ type: 'test', content: 'Test message' }));
            }, 500);
          }}
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          Run Test
        </Button>
      </CardFooter>
    </Card>
  );
}

export default WebSocketTester;