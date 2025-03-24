import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Bell, MessageSquare, Send, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardContainer from "@/components/dashboard-container";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  conversationId: number;
  content: string;
  timestamp: string;
  read: boolean;
  senderName: string;
  senderAvatar?: string;
}

interface Conversation {
  id: number;
  participants: number[];
  title: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isGroup: boolean;
}

interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: string;
  linkUrl?: string;
}

const MessagingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, lastMessage, subscribe, sendMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
  });

  const [activeTab, setActiveTab] = useState("messages");
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  // Subscribe to WebSocket notifications channel
  useEffect(() => {
    if (isConnected && user) {
      subscribe(`user-${user.id}`);
    }
  }, [isConnected, user, subscribe]);

  // Handle incoming WebSocket messages
  function handleWebSocketMessage(data: any) {
    if (data.type === "new_message") {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (activeConversation !== data.conversationId) {
        toast({
          title: "New message",
          description: `${data.senderName}: ${data.preview}`,
        });
      }
    } else if (data.type === "notification") {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: data.title,
        description: data.content,
      });
    }
  }

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      // Since this is a pending feature, we'll simulate data
      const mockConversations: Conversation[] = [
        {
          id: 1,
          participants: [1, 2],
          title: "John Smith",
          lastMessage: "When is the next simulator session?",
          lastMessageTime: new Date().toISOString(),
          unreadCount: 2,
          isGroup: false,
        },
        {
          id: 2,
          participants: [1, 3, 4],
          title: "Simulator Training Group",
          lastMessage: "I've uploaded the new checklist procedures",
          lastMessageTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          unreadCount: 0,
          isGroup: true,
        },
        {
          id: 3,
          participants: [1, 5],
          title: "Captain Richardson",
          lastMessage: "Your progress is looking good",
          lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          unreadCount: 0,
          isGroup: false,
        },
      ];
      return mockConversations;
    },
  });

  // Fetch messages for active conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeConversation],
    queryFn: async () => {
      if (!activeConversation) return [];

      // Since this is a pending feature, we'll simulate data
      const mockMessages: Message[] = [
        {
          id: 1,
          senderId: 2,
          recipientId: 1,
          conversationId: 1,
          content: "Hi, how's your training going?",
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          read: true,
          senderName: "John Smith",
        },
        {
          id: 2,
          senderId: 1,
          recipientId: 2,
          conversationId: 1,
          content: "It's going well! I'm preparing for the next simulator session.",
          timestamp: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
          read: true,
          senderName: user?.firstName + " " + user?.lastName,
        },
        {
          id: 3,
          senderId: 2,
          recipientId: 1,
          conversationId: 1,
          content: "When is the next simulator session?",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false,
          senderName: "John Smith",
        },
      ];
      return mockMessages.filter(msg => msg.conversationId === activeConversation);
    },
    enabled: !!activeConversation,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      // Since this is a pending feature, we'll simulate data
      const mockNotifications: Notification[] = [
        {
          id: 1,
          userId: 1,
          title: "New Assessment",
          content: "You have a new assessment scheduled for tomorrow",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          type: "assessment",
          linkUrl: "/assessments",
        },
        {
          id: 2,
          userId: 1,
          title: "Document Approved",
          content: "Your flight log has been approved by Capt. Richardson",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          read: true,
          type: "document",
          linkUrl: "/documents",
        },
        {
          id: 3,
          userId: 1,
          title: "Training Update",
          content: "The training curriculum for B737 Type Rating has been updated",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          type: "training",
          linkUrl: "/training",
        },
      ];
      return mockNotifications;
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: number; content: string }) => {
      // In a real implementation, this would call the API
      // return apiRequest("POST", "/api/messages", data);
      return { success: true };
    },
    onSuccess: () => {
      setMessageInput("");
      // In a real implementation, we'd invalidate the query cache
      // queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation] });
      // queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // For the demo, we'll just add the message to the UI
      const newMessage: Message = {
        id: Math.floor(Math.random() * 1000),
        senderId: user?.id || 0,
        recipientId: 2, // Assuming we're sending to the first conversation participant
        conversationId: activeConversation || 0,
        content: messageInput,
        timestamp: new Date().toISOString(),
        read: true,
        senderName: user?.firstName + " " + user?.lastName || "You",
      };
      
      queryClient.setQueryData(["/api/messages", activeConversation], 
        [...(messages || []), newMessage]);
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Mark notification as read mutation
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      // In a real implementation, this would call the API
      // return apiRequest("PATCH", `/api/notifications/${notificationId}`, { read: true });
      return { success: true };
    },
    onSuccess: (_, notificationId) => {
      // Update the notifications data
      queryClient.setQueryData<Notification[]>(["/api/notifications"], 
        (oldData) => oldData?.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        ) || []
      );
    }
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: activeConversation,
      content: messageInput
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationReadMutation.mutate(notification.id);
    }
    
    // Navigate to the linked page if available
    if (notification.linkUrl) {
      // In a real implementation, this would navigate to the URL
      console.log(`Navigate to: ${notification.linkUrl}`);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.title;
    }
    // In a real implementation, we would get the other participant's name
    return conversation.title;
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardContainer>
      <Helmet>
        <title>Messaging & Notifications | Advanced Pilot Training Platform</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Communications Center</h1>
            <TabsList>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Messages</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
                {unreadNotificationsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {unreadNotificationsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="messages" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
              {/* Conversations List */}
              <Card className="col-span-1 h-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Conversations</CardTitle>
                    <Button variant="outline" size="icon">
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Conversations</SelectItem>
                        <SelectItem value="instructors">Instructors</SelectItem>
                        <SelectItem value="trainees">Trainees</SelectItem>
                        <SelectItem value="groups">Groups</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(70vh-120px)]">
                    <div className="space-y-2">
                      {conversations.map(conversation => (
                        <div 
                          key={conversation.id}
                          className={`p-3 flex items-center gap-3 rounded-md cursor-pointer hover:bg-accent ${activeConversation === conversation.id ? 'bg-accent' : ''}`}
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback className={conversation.isGroup ? "bg-primary text-primary-foreground" : ""}>
                              {conversation.isGroup ? <Users className="h-4 w-4" /> : conversation.title.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm truncate">{getConversationTitle(conversation)}</h4>
                              <span className="text-xs text-muted-foreground">
                                {conversation.lastMessageTime && formatTimestamp(conversation.lastMessageTime)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="ml-auto h-5 w-5 p-0 flex items-center justify-center rounded-full">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Message Thread */}
              <Card className="col-span-2 h-full">
                {activeConversation ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {conversations.find(c => c.id === activeConversation)?.isGroup 
                              ? <Users className="h-4 w-4" /> 
                              : conversations.find(c => c.id === activeConversation)?.title.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {conversations.find(c => c.id === activeConversation)?.title}
                          </CardTitle>
                          <CardDescription>
                            {conversations.find(c => c.id === activeConversation)?.isGroup 
                              ? "Group conversation" 
                              : "Direct message"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ScrollArea className="h-[calc(70vh-220px)]">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div 
                              key={message.id}
                              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] ${message.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {message.senderId !== user?.id && (
                                    <span className="text-xs font-medium">{message.senderName}</span>
                                  )}
                                  <span className="text-xs opacity-70">{formatTimestamp(message.timestamp)}</span>
                                </div>
                                <p className="text-sm">{message.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="border-t p-3">
                      <div className="flex w-full gap-2">
                        <Input 
                          placeholder="Type your message..." 
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                    <p className="text-muted-foreground max-w-md">
                      Select a conversation from the list on the left to begin messaging with your trainers, instructors, or fellow trainees.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Stay updated with the latest information about your training program, assessments, and more.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(70vh-120px)]">
                  <div className="space-y-1">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`p-4 border-b last:border-0 cursor-pointer hover:bg-accent ${!notification.read ? 'bg-accent/40' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`rounded-full p-2 ${getNotificationTypeColor(notification.type)}`}>
                              {getNotificationTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>{notification.title}</h4>
                                <span className="text-xs text-muted-foreground">{formatTimestamp(notification.timestamp)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{notification.content}</p>
                            </div>
                            {!notification.read && (
                              <Badge className="bg-primary" variant="default">New</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No notifications</h3>
                        <p className="text-muted-foreground">You don't have any notifications at the moment.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardContainer>
  );
};

function getNotificationTypeIcon(type: string) {
  switch (type) {
    case 'assessment':
      return <Bell className="h-4 w-4" />;
    case 'document':
      return <MessageSquare className="h-4 w-4" />;
    case 'training':
      return <User className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function getNotificationTypeColor(type: string) {
  switch (type) {
    case 'assessment':
      return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200';
    case 'document':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200';
    case 'training':
      return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200';
  }
}

export default MessagingPage;