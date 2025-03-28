/**
 * Standard routes file for deployment outside of Replit
 * Uses the standard WebSocket implementation
 */

import { Express } from "express";
import { createServer, Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { setupAPIRoutes } from "./api/routes";
import { setupDocumentProcessor } from "./services/document-processor";
import { setupKnowledgeGraph } from "./services/knowledge-graph";
import { setupTimersAndScheduler } from "./services/schedulers";
import { setupSyllabusGenerator } from "./services/syllabus-generator";
import { setupTerminologyServices } from "./services/terminology";
import { setupNotificationHandler } from "./services/notifications";
import { broadcastNotification } from "./services/notifications";

// Global WebSocket clients map
let wsClients = new Map<string, WebSocket>();

/**
 * Register all routes and set up the HTTP server with WebSocket support
 * @param app Express application instance
 * @returns HTTP Server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Set up API routes
  setupAPIRoutes(app);
  
  // Set up services
  await setupDocumentProcessor(app);
  await setupKnowledgeGraph(app);
  await setupTimersAndScheduler(app);
  await setupSyllabusGenerator(app);
  await setupTerminologyServices(app);
  await setupNotificationHandler(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client connected');
    
    // Generate client ID
    const clientId = Math.random().toString(36).substring(2, 15);
    wsClients.set(clientId, ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Connected to Advanced Pilot Training Platform WebSocket server',
      clientId
    }));
    
    // Handle incoming messages
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('[WebSocket] Received message:', data.type || 'UNKNOWN');
        
        // Handle message based on type
        switch (data.type) {
          case 'PING':
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
            break;
            
          case 'SUBSCRIBE':
            // Handle channel subscription
            if (data.channel) {
              console.log(`[WebSocket] Client ${clientId} subscribed to ${data.channel}`);
              // Subscriptions would be managed here
            }
            break;
            
          case 'UNSUBSCRIBE':
            // Handle channel unsubscription
            if (data.channel) {
              console.log(`[WebSocket] Client ${clientId} unsubscribed from ${data.channel}`);
              // Subscription removal would be managed here
            }
            break;
            
          default:
            console.log('[WebSocket] Unhandled message type:', data.type);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected:', clientId);
      wsClients.delete(clientId);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      wsClients.delete(clientId);
    });
    
    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });
  
  // Add broadcast function to the notification service
  (globalThis as any).broadcastNotification = (channel: string, data: any) => {
    const message = JSON.stringify({
      type: 'NOTIFICATION',
      channel,
      data,
      timestamp: Date.now()
    });
    
    wsClients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  };
  
  return httpServer;
}