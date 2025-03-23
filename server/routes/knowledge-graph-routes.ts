import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { logger } from '../core/logger';
import { extractKnowledgeGraph, KnowledgeExtractionOptions } from '../services/knowledge-graph';
import { NodeType, EdgeRelationship } from '../services/knowledge-graph';

/**
 * Register knowledge graph routes
 */
export function registerKnowledgeGraphRoutes(app: Express) {
  /**
   * Generate knowledge graph from document
   */
  app.post('/api/knowledge-graph/generate', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Validate request schema
      const requestSchema = z.object({
        documentId: z.number(),
        options: z.object({
          extractEntities: z.boolean().optional(),
          extractConcepts: z.boolean().optional(),
          extractRelationships: z.boolean().optional(),
          minimumConfidence: z.number().optional(),
          useExistingNodes: z.boolean().optional(),
          connectToExistingGraph: z.boolean().optional(),
          filterNodeTypes: z.array(z.string()).optional(),
          maxNodes: z.number().optional(),
          maxEdgesPerNode: z.number().optional(),
        }).optional(),
      });
      
      const { documentId, options } = requestSchema.parse(req.body);
      
      // Get document
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Extract knowledge graph
      const result = await extractKnowledgeGraph(documentId, options as KnowledgeExtractionOptions);
      
      // Save the knowledge graph
      await storage.saveKnowledgeGraph(result);
      
      res.json(result);
    } catch (error) {
      logger.error('Error generating knowledge graph', { context: { error } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to generate knowledge graph' });
    }
  });

  /**
   * Get knowledge graph for document
   */
  app.get('/api/knowledge-graph/document/:id', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      
      // Get the knowledge graph nodes and edges for this document
      const nodes = await storage.getKnowledgeGraphNodesByDocument(documentId);
      const edges = await storage.getKnowledgeGraphEdgesByDocument(documentId);
      
      res.json({
        documentId,
        nodes,
        edges,
      });
    } catch (error) {
      logger.error('Error fetching knowledge graph', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch knowledge graph' });
    }
  });

  /**
   * Get knowledge graph for program
   */
  app.get('/api/knowledge-graph/program/:id', async (req: Request, res: Response) => {
    try {
      const programId = parseInt(req.params.id);
      
      // Get the knowledge graph nodes and edges for this program
      const nodes = await storage.getKnowledgeGraphNodesByProgram(programId);
      const edges = await storage.getKnowledgeGraphEdgesByProgram(programId);
      
      res.json({
        programId,
        nodes,
        edges,
      });
    } catch (error) {
      logger.error('Error fetching knowledge graph', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch knowledge graph' });
    }
  });

  /**
   * Search knowledge graph
   */
  app.post('/api/knowledge-graph/search', async (req: Request, res: Response) => {
    try {
      // Validate request schema
      const requestSchema = z.object({
        query: z.string(),
        nodeTypes: z.array(z.string()).optional(),
        limit: z.number().optional().default(20),
        threshold: z.number().optional().default(0.6),
      });
      
      const { query, nodeTypes, limit, threshold } = requestSchema.parse(req.body);
      
      // Search for nodes
      const results = await storage.searchKnowledgeGraph(query, {
        nodeTypes: nodeTypes as NodeType[],
        limit,
        threshold,
      });
      
      res.json(results);
    } catch (error) {
      logger.error('Error searching knowledge graph', { context: { error } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to search knowledge graph' });
    }
  });

  /**
   * Get related nodes
   */
  app.get('/api/knowledge-graph/nodes/:id/related', async (req: Request, res: Response) => {
    try {
      const nodeId = req.params.id;
      
      // Get related nodes
      const relatedNodes = await storage.getRelatedKnowledgeGraphNodes(nodeId);
      
      res.json(relatedNodes);
    } catch (error) {
      logger.error('Error fetching related nodes', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch related nodes' });
    }
  });

  /**
   * Create knowledge graph node
   */
  app.post('/api/knowledge-graph/nodes', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Validate request schema
      const nodeSchema = z.object({
        id: z.string().optional(),
        type: z.string(),
        content: z.string(),
        metadata: z.record(z.any()).optional(),
        documentId: z.number().optional(),
        programId: z.number().optional(),
        importance: z.number().optional(),
        confidence: z.number().optional(),
      });
      
      const nodeData = nodeSchema.parse(req.body);
      
      // Create node
      const node = await storage.createKnowledgeGraphNode(nodeData);
      
      res.status(201).json(node);
    } catch (error) {
      logger.error('Error creating knowledge graph node', { context: { error } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid node data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to create knowledge graph node' });
    }
  });

  /**
   * Create knowledge graph edge
   */
  app.post('/api/knowledge-graph/edges', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Validate request schema
      const edgeSchema = z.object({
        source: z.string(),
        target: z.string(),
        relationship: z.string(),
        weight: z.number().optional(),
        metadata: z.record(z.any()).optional(),
        documentId: z.number().optional(),
        programId: z.number().optional(),
        confidence: z.number().optional(),
      });
      
      const edgeData = edgeSchema.parse(req.body);
      
      // Create edge
      const edge = await storage.createKnowledgeGraphEdge(edgeData);
      
      res.status(201).json(edge);
    } catch (error) {
      logger.error('Error creating knowledge graph edge', { context: { error } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid edge data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to create knowledge graph edge' });
    }
  });

  /**
   * Delete knowledge graph node
   */
  app.delete('/api/knowledge-graph/nodes/:id', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const nodeId = req.params.id;
      
      // Delete node and associated edges
      await storage.deleteKnowledgeGraphNode(nodeId);
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting knowledge graph node', { context: { error } });
      res.status(500).json({ error: 'Failed to delete knowledge graph node' });
    }
  });

  /**
   * Delete knowledge graph edge
   */
  app.delete('/api/knowledge-graph/edges/:source/:target', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { source, target } = req.params;
      
      // Delete edge
      await storage.deleteKnowledgeGraphEdge(source, target);
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting knowledge graph edge', { context: { error } });
      res.status(500).json({ error: 'Failed to delete knowledge graph edge' });
    }
  });

  /**
   * Get knowledge graph visualization data
   */
  app.get('/api/knowledge-graph/visualization', async (req: Request, res: Response) => {
    try {
      // Parse query parameters
      const documentId = req.query.documentId ? parseInt(req.query.documentId as string) : undefined;
      const programId = req.query.programId ? parseInt(req.query.programId as string) : undefined;
      const nodeTypes = req.query.nodeTypes ? (req.query.nodeTypes as string).split(',') as NodeType[] : undefined;
      const includeMetadata = req.query.includeMetadata === 'true';
      
      let nodes = [];
      let edges = [];
      
      if (documentId) {
        nodes = await storage.getKnowledgeGraphNodesByDocument(documentId);
        edges = await storage.getKnowledgeGraphEdgesByDocument(documentId);
      } else if (programId) {
        nodes = await storage.getKnowledgeGraphNodesByProgram(programId);
        edges = await storage.getKnowledgeGraphEdgesByProgram(programId);
      } else {
        // Get a sample of the knowledge graph
        nodes = await storage.getSampleKnowledgeGraphNodes(100);
        edges = await storage.getKnowledgeGraphEdgesByNodes(nodes.map(n => n.id));
      }
      
      // Filter by node types if specified
      if (nodeTypes && nodeTypes.length > 0) {
        const nodeIds = new Set(nodes.filter(n => nodeTypes.includes(n.type as NodeType)).map(n => n.id));
        nodes = nodes.filter(n => nodeIds.has(n.id));
        edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
      }
      
      // Clean up the data for visualization
      const visualizationData = {
        nodes: nodes.map(node => ({
          id: node.id,
          label: node.content.substring(0, 50) + (node.content.length > 50 ? '...' : ''),
          type: node.type,
          group: node.type, // For visual grouping
          importance: node.importance || 1,
          ...(includeMetadata ? { metadata: node.metadata } : {}),
        })),
        edges: edges.map(edge => ({
          from: edge.source,
          to: edge.target,
          label: edge.relationship,
          arrows: 'to',
          weight: edge.weight || 1,
          ...(includeMetadata ? { metadata: edge.metadata } : {}),
        })),
      };
      
      res.json(visualizationData);
    } catch (error) {
      logger.error('Error generating visualization data', { context: { error } });
      res.status(500).json({ error: 'Failed to generate visualization data' });
    }
  });
}