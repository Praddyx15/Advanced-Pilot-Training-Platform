/**
 * Standard routes file for deployment outside of Replit
 * Uses the standard WebSocket implementation
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import setupWebSocketServer from "./websocket-standard";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wsServer = setupWebSocketServer(httpServer);
  
  // Make the broadcast function available globally (optional)
  // You can also export it directly or pass it to your route handlers
  (global as any).broadcastNotification = (channel: string, data: any) => {
    wsServer.broadcast(channel, data);
  };

  // Example API endpoints - add your actual endpoints here
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Additional application routes would go here
  // Example:
  // app.get('/api/trainees', traineeController.getAll);
  // app.post('/api/trainees', traineeController.create);
  // etc.

  return httpServer;
}

export default registerRoutes;