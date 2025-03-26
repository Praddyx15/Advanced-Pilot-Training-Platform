/**
 * Document Management Routes
 * 
 * API endpoints for document management, upload, analysis and sharing.
 */
import { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { documents, insertDocumentSchema, documentShares } from '@shared/schema';
import { db } from '../db';
import { eq, and, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../core/logger';
import * as documentAnalysis from '../services/document-analysis-service';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create the upload middleware
const upload = multer({ 
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit
  },
  fileFilter: function(req, file, cb) {
    // Accept common document types
    const allowedTypes = [
      '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

/**
 * Register document management routes
 */
export function registerDocumentRoutes(app: Express) {
  /**
   * Get all documents
   * 
   * Filter by role: instructors see all documents, trainees see assigned documents
   */
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { role } = req.user;
      const userId = req.user.id;
      
      // Different queries based on user role
      let documents;
      
      if (role === 'admin') {
        // Admin sees all documents
        documents = await db.select()
          .from(documents)
          .orderBy(desc(documents.createdAt));
      } else if (role === 'instructor') {
        // Instructors see their documents and shared docs
        documents = await db.select()
          .from(documents)
          .where(
            or(
              eq(documents.uploadedById, userId),
              eq(documents.isPublic, true)
            )
          )
          .orderBy(desc(documents.createdAt));
          
        // Also get documents shared with instructor
        const sharedDocs = await db.select()
          .from(documents)
          .innerJoin(documentShares, eq(documents.id, documentShares.documentId))
          .where(eq(documentShares.userId, userId))
          .orderBy(desc(documents.createdAt));
          
        // Combine results (avoiding duplicates)
        const docIds = new Set(documents.map(d => d.id));
        for (const doc of sharedDocs) {
          if (!docIds.has(doc.documents.id)) {
            documents.push(doc.documents);
          }
        }
      } else {
        // Trainees only see documents shared with them or public docs
        documents = await db.select()
          .from(documents)
          .where(eq(documents.isPublic, true))
          .orderBy(desc(documents.createdAt));
          
        // Also get documents shared with trainee
        const sharedDocs = await db.select()
          .from(documents)
          .innerJoin(documentShares, eq(documents.id, documentShares.documentId))
          .where(eq(documentShares.userId, userId))
          .orderBy(desc(documents.createdAt));
          
        // Combine results (avoiding duplicates)
        const docIds = new Set(documents.map(d => d.id));
        for (const doc of sharedDocs) {
          if (!docIds.has(doc.documents.id)) {
            documents.push(doc.documents);
          }
        }
      }
      
      res.json(documents);
    } catch (error) {
      logger.error(`Error getting documents: ${error}`);
      res.status(500).json({ message: 'Failed to retrieve documents' });
    }
  });
  
  /**
   * Get a single document by ID
   */
  app.get('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const documentId = parseInt(req.params.id);
      const userId = req.user.id;
      const role = req.user.role;
      
      // Get the document
      const [document] = await db.select()
        .from(documents)
        .where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Check access permission
      const canAccess = 
        role === 'admin' || 
        document.uploadedById === userId || 
        document.isPublic;
      
      if (!canAccess) {
        // Check if document is shared with user
        const [shared] = await db.select()
          .from(documentShares)
          .where(
            and(
              eq(documentShares.documentId, documentId),
              eq(documentShares.userId, userId)
            )
          );
        
        if (!shared) {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        // Update last accessed time
        await db.update(documentShares)
          .set({ 
            lastAccessed: new Date(),
            isRead: true
          })
          .where(
            and(
              eq(documentShares.documentId, documentId),
              eq(documentShares.userId, userId)
            )
          );
      }
      
      res.json(document);
    } catch (error) {
      logger.error(`Error getting document: ${error}`);
      res.status(500).json({ message: 'Failed to retrieve document' });
    }
  });
  
  /**
   * Upload a new document
   */
  app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { title, description, category, isPublic } = req.body;
      const uploadedById = req.user.id;
      const uploadedByName = req.user.name || 'Unknown';
      const uploadedByRole = req.user.role || 'user';
      
      // File details
      const filePath = req.file.path;
      const fileType = path.extname(req.file.originalname).substring(1);
      const fileSize = req.file.size;
      
      // Create document record
      const documentData = {
        title,
        description,
        filePath,
        fileType,
        fileSize,
        uploadedById,
        uploadedByName,
        uploadedByRole,
        category,
        isPublic: isPublic === 'true',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert into database
      const [document] = await db.insert(documents)
        .values({
          title: documentData.title,
          description: documentData.description,
          filePath: documentData.filePath,
          url: `/uploads/${path.basename(documentData.filePath)}`,
          fileType: documentData.fileType,
          fileSize: documentData.fileSize,
          uploadedById: documentData.uploadedById,
          uploadedByRole: documentData.uploadedByRole,
          isProcessed: false,
          createdAt: documentData.createdAt,
          updatedAt: documentData.updatedAt
        })
        .returning();
      
      // Start processing the document in the background
      documentAnalysis.analyzeDocument(document.id)
        .catch(err => {
          logger.error(`Background document analysis error: ${err}`);
        });
      
      res.status(201).json(document);
    } catch (error) {
      logger.error(`Error uploading document: ${error}`);
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });
  
  /**
   * Share a document with users
   */
  app.post('/api/documents/:id/share', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const documentId = parseInt(req.params.id);
      const { userIds, shareType } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ message: 'User IDs are required' });
      }
      
      // Get the document
      const [document] = await db.select()
        .from(documents)
        .where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Only document owner or admin can share
      if (document.uploadedById !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Share with each user
      await documentAnalysis.shareDocumentWithUsers(
        documentId,
        userIds,
        shareType || 'read',
        req.user.id
      );
      
      res.status(200).json({ message: 'Document shared successfully' });
    } catch (error) {
      logger.error(`Error sharing document: ${error}`);
      res.status(500).json({ message: 'Failed to share document' });
    }
  });
  
  /**
   * Get users who have access to a document
   */
  app.get('/api/documents/:id/shares', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const documentId = parseInt(req.params.id);
      
      // Get the document
      const [document] = await db.select()
        .from(documents)
        .where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Only document owner or admin can see shares
      if (document.uploadedById !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get shares
      const shares = await db.select()
        .from(documentShares)
        .where(eq(documentShares.documentId, documentId));
      
      res.json(shares);
    } catch (error) {
      logger.error(`Error getting document shares: ${error}`);
      res.status(500).json({ message: 'Failed to retrieve shares' });
    }
  });
  
  /**
   * Remove document access for a user
   */
  app.delete('/api/documents/:id/shares/:userId', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const documentId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      // Get the document
      const [document] = await db.select()
        .from(documents)
        .where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Only document owner or admin can remove shares
      if (document.uploadedById !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Remove share
      await db.delete(documentShares)
        .where(
          and(
            eq(documentShares.documentId, documentId),
            eq(documentShares.userId, userId)
          )
        );
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error removing document share: ${error}`);
      res.status(500).json({ message: 'Failed to remove share' });
    }
  });
  
  /**
   * Get document content (text)
   */
  app.get('/api/documents/:id/content', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const documentId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the document
      const [document] = await db.select()
        .from(documents)
        .where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Check access permission
      const canAccess = 
        req.user.role === 'admin' || 
        document.uploadedById === userId || 
        document.isPublic;
      
      if (!canAccess) {
        // Check if document is shared with user
        const [shared] = await db.select()
          .from(documentShares)
          .where(
            and(
              eq(documentShares.documentId, documentId),
              eq(documentShares.userId, userId)
            )
          );
        
        if (!shared) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      // Get document content
      const [content] = await db.select()
        .from(documentContent)
        .where(eq(documentContent.documentId, documentId));
      
      if (!content) {
        return res.status(404).json({ message: 'Document content not found' });
      }
      
      res.json(content);
    } catch (error) {
      logger.error(`Error getting document content: ${error}`);
      res.status(500).json({ message: 'Failed to retrieve document content' });
    }
  });
  
  /**
   * Get document analysis data
   */
  app.get('/api/documents/:id/analysis', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const documentId = parseInt(req.params.id);
      
      // Get the document
      const [document] = await db.select()
        .from(documents)
        .where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Get document analysis
      const [analysis] = await db.select()
        .from(documentAnalysis)
        .where(eq(documentAnalysis.documentId, documentId));
      
      if (!analysis) {
        return res.status(404).json({ message: 'Document analysis not found' });
      }
      
      res.json(analysis);
    } catch (error) {
      logger.error(`Error getting document analysis: ${error}`);
      res.status(500).json({ message: 'Failed to retrieve document analysis' });
    }
  });
  
  /**
   * Download the original document file
   */
  app.get('/api/documents/:id/download', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const documentId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the document
      const [document] = await db.select()
        .from(documents)
        .where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Check access permission
      const canAccess = 
        req.user.role === 'admin' || 
        document.uploadedById === userId || 
        document.isPublic;
      
      if (!canAccess) {
        // Check if document is shared with user
        const [shared] = await db.select()
          .from(documentShares)
          .where(
            and(
              eq(documentShares.documentId, documentId),
              eq(documentShares.userId, userId)
            )
          );
        
        if (!shared) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Send file
      res.download(document.filePath, document.title + path.extname(document.filePath));
    } catch (error) {
      logger.error(`Error downloading document: ${error}`);
      res.status(500).json({ message: 'Failed to download document' });
    }
  });
}