/**
 * Standard routes file for deployment outside of Replit
 * Uses the standard WebSocket implementation
 */

import { Express } from "express";
import { createServer, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import * as syllabusGenerator from "./services/syllabus-generator";
import * as templateManager from "./services/syllabus-template-manager";
import { 
  registerDocumentRoutes,
  registerSessionRoutes,
  registerSyllabusRoutes,
  registerKnowledgeGraphRoutes,
  registerTrainingRoutes,
  registerAssessmentRoutes,
  registerResourceRoutes,
  registerNotificationRoutes,
  registerFlightRecordRoutes,
  registerAchievementRoutes,
  registerOcrRoutes,
  registerDocumentAnalysisRoutes,
  registerScheduleRoutes,
  setupThemeRoutes,
  riskAssessmentRouter,
  registerTraineeRoutes
} from "./routes/index";
import { apiVersioning } from "./api/api-versioning";
import { setupApiDocs } from "./api/api-docs";
import v1Router from "./api/v1-router";
import { logger } from "./core";

// Global WebSocket clients map
let wsClients = new Map<string, WebSocket>();

/**
 * Register all routes and set up the HTTP server with WebSocket support
 * This version is specifically for non-Replit environments
 * @param app Express application instance
 * @returns HTTP Server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);
  
  // Set up API versioning
  apiVersioning.registerVersion({
    version: 'v1',
    status: 'stable',
    releaseDate: new Date('2025-03-22'),
    router: v1Router
  });
  
  // Apply API versioning middleware
  apiVersioning.applyVersioning(app);
  
  // Set up Swagger API documentation
  setupApiDocs(app);
  
  // Log API setup
  logger.info('API versioning and documentation initialized');

  // Initialize with seed data if no users exist
  const seedDatabase = async () => {
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      // TODO: Initialize with seed data here if needed
    }
  };

  seedDatabase();
  
  // Register all routes from dedicated route files
  registerDocumentRoutes(app);
  registerSessionRoutes(app);
  registerSyllabusRoutes(app);
  registerKnowledgeGraphRoutes(app);
  registerTrainingRoutes(app);
  registerAssessmentRoutes(app);
  registerResourceRoutes(app);
  registerNotificationRoutes(app);
  registerFlightRecordRoutes(app);
  registerAchievementRoutes(app);
  registerOcrRoutes(app);
  registerDocumentAnalysisRoutes(app);
  registerScheduleRoutes(app);
  setupThemeRoutes(app);
  registerTraineeRoutes(app);
  
  // Risk Assessment API
  app.use('/api/risk-assessments', riskAssessmentRouter);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    logger.info('WebSocket client connected');
    
    // Generate client ID
    const clientId = Math.random().toString(36).substring(2, 15);
    wsClients.set(clientId, ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to APTP WebSocket Server',
      timestamp: new Date().toISOString(),
      clientId
    }));
    
    // Handle incoming messages
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        
        // Handle message based on type
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
            break;
            
          case 'subscribe':
            // Handle subscription requests
            logger.info(`WebSocket client ${clientId} subscribed to: ${data.channel}`);
            ws.send(JSON.stringify({
              type: 'subscription_confirm',
              channel: data.channel,
              timestamp: new Date().toISOString()
            }));
            break;
            
          default:
            logger.warn(`Received unknown WebSocket message type: ${data.type}`);
        }
      } catch (error) {
        logger.error('Error processing WebSocket message', { context: { error } });
      }
    });
    
    // Handle client disconnection
    ws.addEventListener('close', () => {
      logger.info(`WebSocket client disconnected: ${clientId}`);
      wsClients.delete(clientId);
    });
    
    // Handle errors
    ws.addEventListener('error', (error) => {
      logger.error('WebSocket error', { context: { error, clientId } });
      wsClients.delete(clientId);
    });
    
    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'ping', 
          timestamp: new Date().toISOString() 
        }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });
  
  // Set up the broadcast notification function for global use
  (globalThis as any).broadcastNotification = (channel: string, data: any) => {
    const message = JSON.stringify({
      type: 'notification',
      channel,
      data,
      timestamp: new Date().toISOString()
    });
    
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
  
  return httpServer;
}