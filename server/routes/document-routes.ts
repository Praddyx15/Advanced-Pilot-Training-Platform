import { Express, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { insertDocumentSchema, insertDocumentVersionSchema } from '@shared/schema';
import { extractTextFromDocument } from '../services/document-extraction';
import { analyzeDocumentStructure } from '../services/document-structure';
import { classifyDocument } from '../services/document-classification';
import { compareDocumentStructures, compareExtractionResults, compareTextDocuments } from '../services/document-comparison';
import { detectLanguage, translateText } from '../services/language-translation';
import { logger } from '../core/logger';
import { AppError, ErrorType } from '../core/error-handler';

// Set up multer storage
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const originalExtension = path.extname(file.originalname);
    cb(null, `document-${uniqueSuffix}${originalExtension}`);
  }
});

// Configure upload middleware
const upload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check allowed extensions
    const allowedExtensions = [
      '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff',
      '.html', '.htm', '.txt', '.md', '.xml', '.json'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not supported`), false);
    }
  }
});

/**
 * Register document-related routes
 */
export function registerDocumentRoutes(app: Express) {
  /**
   * Get all documents
   */
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      logger.error('Error fetching documents', { context: { error } });
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  /**
   * Get document by ID
   */
  app.get('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json(document);
    } catch (error) {
      logger.error('Error fetching document', { context: { error, documentId: req.params.id } });
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  });

  /**
   * Upload a document
   */
  app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get file information
      const fileName = req.file.originalname;
      const filePath = req.file.path;
      const fileSize = req.file.size;
      const fileType = path.extname(fileName).substring(1); // Remove the dot
      
      // Prepare document data
      const documentData = {
        title: req.body.title || fileName,
        description: req.body.description || null,
        fileName,
        fileSize,
        fileType,
        uploadedById: req.user.id,
        url: filePath, // This would be replaced with a proper URL in production
        tags: req.body.tags ? JSON.parse(req.body.tags) : null,
      };
      
      // Validate document data
      const validData = insertDocumentSchema.parse(documentData);
      
      // Save document to database
      const document = await storage.createDocument(validData);
      
      res.status(201).json(document);
    } catch (error) {
      logger.error('Error uploading document', { context: { error } });
      
      // Clean up file if it was uploaded
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error('Error deleting file after failed upload', { context: { error: unlinkError } });
        }
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid document data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  /**
   * Extract text from a document
   */
  app.post('/api/documents/:id/extract', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Validate options schema
      const optionsSchema = z.object({
        ocrEnabled: z.boolean().optional().default(true),
        language: z.string().optional().default('eng'),
      });
      
      const options = optionsSchema.parse(req.body);
      
      // Extract text from document
      const extractionResult = await extractTextFromDocument(document.url, {
        ocrEnabled: options.ocrEnabled,
        language: options.language,
      });
      
      // Store the extraction result in the database
      await storage.createDocumentAnalysis({
        documentId,
        analysisType: 'text_extraction',
        results: extractionResult,
        status: 'completed',
        confidence: extractionResult.metadata.confidence || null,
        processingTime: extractionResult.metadata.processTime || null,
        completedAt: new Date(),
      });
      
      res.json(extractionResult);
    } catch (error) {
      logger.error('Error extracting text from document', { context: { error, documentId: req.params.id } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid options', details: error.errors });
      }
      
      const processingError = error as Error;
      const errorResponse = {
        error: 'Failed to extract text',
        message: processingError.message,
      };
      
      await storage.createDocumentAnalysis({
        documentId: parseInt(req.params.id),
        analysisType: 'text_extraction',
        results: null,
        status: 'failed',
        error: processingError.message,
        confidence: null,
        processingTime: null,
        completedAt: new Date(),
      });
      
      res.status(500).json(errorResponse);
    }
  });

  /**
   * Analyze document structure
   */
  app.post('/api/documents/:id/structure', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Get the latest extraction result or perform extraction if needed
      let extractionResult = await storage.getLatestAnalysisResult(documentId, 'text_extraction');
      
      if (!extractionResult) {
        // Perform text extraction first
        extractionResult = await extractTextFromDocument(document.url);
        
        // Store the extraction result
        await storage.createDocumentAnalysis({
          documentId,
          analysisType: 'text_extraction',
          results: extractionResult,
          status: 'completed',
          confidence: extractionResult.metadata.confidence || null,
          processingTime: extractionResult.metadata.processTime || null,
          completedAt: new Date(),
        });
      }
      
      // Validate options schema
      const optionsSchema = z.object({
        recognizeHeadings: z.boolean().optional(),
        recognizeSections: z.boolean().optional(),
        recognizeTables: z.boolean().optional(),
        recognizeLists: z.boolean().optional(),
        recognizeKeyValue: z.boolean().optional(),
        recognizeReferences: z.boolean().optional(),
        language: z.string().optional(),
      });
      
      const options = optionsSchema.parse(req.body);
      
      // Analyze document structure
      const structureResult = await analyzeDocumentStructure(extractionResult, options);
      
      // Store the structure analysis result
      await storage.createDocumentAnalysis({
        documentId,
        analysisType: 'structure_analysis',
        results: structureResult,
        status: 'completed',
        confidence: structureResult.metadata.confidence,
        processingTime: structureResult.metadata.processingTime,
        completedAt: new Date(),
      });
      
      res.json(structureResult);
    } catch (error) {
      logger.error('Error analyzing document structure', { context: { error, documentId: req.params.id } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid options', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to analyze document structure' });
    }
  });

  /**
   * Classify document
   */
  app.post('/api/documents/:id/classify', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Get the latest extraction result or perform extraction if needed
      let extractionResult = await storage.getLatestAnalysisResult(documentId, 'text_extraction');
      
      if (!extractionResult) {
        // Perform text extraction first
        extractionResult = await extractTextFromDocument(document.url);
        
        // Store the extraction result
        await storage.createDocumentAnalysis({
          documentId,
          analysisType: 'text_extraction',
          results: extractionResult,
          status: 'completed',
          confidence: extractionResult.metadata.confidence || null,
          processingTime: extractionResult.metadata.processTime || null,
          completedAt: new Date(),
        });
      }
      
      // Validate options schema
      const optionsSchema = z.object({
        includeRelatedDocuments: z.boolean().optional(),
        maxRelatedDocuments: z.number().optional(),
        minConfidenceThreshold: z.number().optional(),
        includeKeyTerms: z.boolean().optional(),
      });
      
      const options = optionsSchema.parse(req.body);
      
      // Classify document
      const classificationResult = await classifyDocument(extractionResult, options);
      
      // Store the classification result
      await storage.createDocumentAnalysis({
        documentId,
        analysisType: 'classification',
        results: classificationResult,
        status: 'completed',
        confidence: classificationResult.confidence,
        processingTime: classificationResult.metadata.processingTime,
        completedAt: new Date(),
      });
      
      res.json(classificationResult);
    } catch (error) {
      logger.error('Error classifying document', { context: { error, documentId: req.params.id } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid options', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to classify document' });
    }
  });

  /**
   * Compare documents
   */
  app.post('/api/documents/compare', async (req: Request, res: Response) => {
    try {
      // Validate request schema
      const requestSchema = z.object({
        beforeDocumentId: z.number(),
        afterDocumentId: z.number(),
        options: z.object({
          ignoreWhitespace: z.boolean().optional(),
          ignoreCase: z.boolean().optional(),
          ignoreFormatting: z.boolean().optional(),
          includeImpactAnalysis: z.boolean().optional(),
        }).optional(),
      });
      
      const { beforeDocumentId, afterDocumentId, options } = requestSchema.parse(req.body);
      
      // Get both documents
      const beforeDocument = await storage.getDocument(beforeDocumentId);
      const afterDocument = await storage.getDocument(afterDocumentId);
      
      if (!beforeDocument || !afterDocument) {
        return res.status(404).json({ error: 'One or both documents not found' });
      }
      
      // Get extraction results for both documents
      let beforeResult = await storage.getLatestAnalysisResult(beforeDocumentId, 'text_extraction');
      let afterResult = await storage.getLatestAnalysisResult(afterDocumentId, 'text_extraction');
      
      // Perform extraction if needed
      if (!beforeResult) {
        beforeResult = await extractTextFromDocument(beforeDocument.url);
        
        await storage.createDocumentAnalysis({
          documentId: beforeDocumentId,
          analysisType: 'text_extraction',
          results: beforeResult,
          status: 'completed',
          confidence: beforeResult.metadata.confidence || null,
          processingTime: beforeResult.metadata.processTime || null,
          completedAt: new Date(),
        });
      }
      
      if (!afterResult) {
        afterResult = await extractTextFromDocument(afterDocument.url);
        
        await storage.createDocumentAnalysis({
          documentId: afterDocumentId,
          analysisType: 'text_extraction',
          results: afterResult,
          status: 'completed',
          confidence: afterResult.metadata.confidence || null,
          processingTime: afterResult.metadata.processTime || null,
          completedAt: new Date(),
        });
      }
      
      // Compare documents
      const comparisonResult = await compareExtractionResults(beforeResult, afterResult, options);
      
      // Store the comparison result
      await storage.createDocumentAnalysis({
        documentId: afterDocumentId, // Store under the "after" document
        analysisType: 'comparison',
        results: {
          comparisonResult,
          comparedWith: beforeDocumentId,
        },
        status: 'completed',
        confidence: null,
        processingTime: comparisonResult.statistics.processingTime,
        completedAt: new Date(),
      });
      
      res.json(comparisonResult);
    } catch (error) {
      logger.error('Error comparing documents', { context: { error } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to compare documents' });
    }
  });

  /**
   * Detect document language
   */
  app.post('/api/documents/:id/detect-language', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Get extraction result or perform extraction
      let extractionResult = await storage.getLatestAnalysisResult(documentId, 'text_extraction');
      
      if (!extractionResult) {
        extractionResult = await extractTextFromDocument(document.url);
        
        await storage.createDocumentAnalysis({
          documentId,
          analysisType: 'text_extraction',
          results: extractionResult,
          status: 'completed',
          confidence: extractionResult.metadata.confidence || null,
          processingTime: extractionResult.metadata.processTime || null,
          completedAt: new Date(),
        });
      }
      
      // Detect language
      const detectionResult = await detectLanguage(extractionResult.text);
      
      // Store the language detection result
      await storage.createDocumentAnalysis({
        documentId,
        analysisType: 'language_detection',
        results: detectionResult,
        status: 'completed',
        confidence: detectionResult.confidence,
        processingTime: detectionResult.processingTimeMs,
        completedAt: new Date(),
      });
      
      res.json(detectionResult);
    } catch (error) {
      logger.error('Error detecting document language', { context: { error, documentId: req.params.id } });
      res.status(500).json({ error: 'Failed to detect document language' });
    }
  });

  /**
   * Translate document
   */
  app.post('/api/documents/:id/translate', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Validate translation request
      const requestSchema = z.object({
        targetLanguage: z.string(),
        sourceLanguage: z.string().optional().default('auto'),
        options: z.object({
          preserveFormatting: z.boolean().optional(),
          preserveTerminology: z.boolean().optional(),
          highQuality: z.boolean().optional(),
        }).optional(),
      });
      
      const { targetLanguage, sourceLanguage, options } = requestSchema.parse(req.body);
      
      // Get extraction result or perform extraction
      let extractionResult = await storage.getLatestAnalysisResult(documentId, 'text_extraction');
      
      if (!extractionResult) {
        extractionResult = await extractTextFromDocument(document.url);
        
        await storage.createDocumentAnalysis({
          documentId,
          analysisType: 'text_extraction',
          results: extractionResult,
          status: 'completed',
          confidence: extractionResult.metadata.confidence || null,
          processingTime: extractionResult.metadata.processTime || null,
          completedAt: new Date(),
        });
      }
      
      // Translate text
      const translationResult = await translateText(
        extractionResult.text,
        sourceLanguage,
        targetLanguage,
        options
      );
      
      // Store the translation result
      await storage.createDocumentAnalysis({
        documentId,
        analysisType: 'translation',
        results: {
          translationResult,
          targetLanguage,
          sourceLanguage,
        },
        status: 'completed',
        confidence: translationResult.confidence,
        processingTime: translationResult.processingTimeMs,
        completedAt: new Date(),
      });
      
      // Create a new document version with the translated text
      if (req.body.createVersion) {
        const versionData = {
          documentId,
          versionNumber: `${targetLanguage.toUpperCase()}-${Date.now()}`,
          changedById: req.user?.id || 1, // Default to system user if not authenticated
          changeDate: new Date(),
          changeDescription: `Translated to ${targetLanguage}`,
          url: '', // This would be a generated file path in a real implementation
          fileSize: null,
        };
        
        const validVersionData = insertDocumentVersionSchema.parse(versionData);
        
        const newVersion = await storage.createDocumentVersion(validVersionData);
        
        // Update the document with reference to the new version
        await storage.updateDocumentCurrentVersion(documentId, newVersion.id);
      }
      
      res.json(translationResult);
    } catch (error) {
      logger.error('Error translating document', { context: { error, documentId: req.params.id } });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid translation request', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to translate document' });
    }
  });

  /**
   * Delete a document
   */
  app.delete('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Check if user has permission to delete the document
      if (document.uploadedById !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Delete document file if it exists and is stored locally
      if (document.url && fs.existsSync(document.url)) {
        fs.unlinkSync(document.url);
      }
      
      // Delete document from database
      const success = await storage.deleteDocument(documentId);
      
      if (!success) {
        return res.status(500).json({ error: 'Failed to delete document' });
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting document', { context: { error, documentId: req.params.id } });
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });
}