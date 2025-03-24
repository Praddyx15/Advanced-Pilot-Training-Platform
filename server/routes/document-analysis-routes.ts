import { Express, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../core/logger';
import { storage } from '../storage';
import { extractTextFromDocument } from '../services/document-extraction';
import { analyzeDocumentStructure } from '../services/document-structure';
import { classifyDocument, DocumentCategory } from '../services/document-classification';
import { parseDocumentContext } from '../services/context-aware-parser';
import { extractKnowledgeGraph } from '../services/knowledge-graph';
import { generateSyllabusFromDocument } from '../services/syllabus-generator';
import { insertDocumentSchema, documentAnalysis } from '@shared/schema';

// Type for document analysis insertion
type InsertDocumentAnalysis = {
  documentId: number;
  analysisType: string;
  status: string;
  results: any;
  confidence?: number;
  processingTime?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
};

// Set up multer storage for document uploads
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const originalExtension = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${originalExtension}`);
  }
});

// Configure upload middleware
const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check allowed extensions
    const allowedExtensions = [
      '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', 
      '.txt', '.html', '.jpg', '.jpeg', '.png', '.gif', '.tif', '.tiff'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(null, false);
      // We'll handle the error response in the route handler
    }
  }
});

/**
 * Register document analysis routes
 */
export function registerDocumentAnalysisRoutes(app: Express) {
  /**
   * Upload and analyze a document
   */
  app.post('/api/documents/analyze', documentUpload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or unsupported file format' });
      }
      
      // Get file information
      const filePath = req.file.path;
      const originalFileName = req.file.originalname;
      
      // Parse analysis settings
      const settingsSchema = z.object({
        extractText: z.boolean().optional().default(true),
        analyzeStructure: z.boolean().optional().default(true),
        classifyDocument: z.boolean().optional().default(true),
        analyzeContext: z.boolean().optional().default(false),
        extractKnowledgeGraph: z.boolean().optional().default(false),
        generateSyllabus: z.boolean().optional().default(false),
        language: z.string().optional().default('eng'),
        confidenceThreshold: z.number().optional().default(60),
        userId: z.number().optional()
      });
      
      // Parse settings from the request
      let settings;
      try {
        settings = settingsSchema.parse(
          req.body.settings ? JSON.parse(req.body.settings) : {}
        );
      } catch (error) {
        logger.warn('Invalid document analysis settings', { context: { error, body: req.body } });
        settings = settingsSchema.parse({});
      }
      
      // Create a document entry in the database
      const document = await storage.createDocument({
        title: req.body.title || originalFileName,
        description: req.body.description || 'Uploaded for analysis',
        fileType: path.extname(originalFileName).replace('.', ''),
        url: filePath,
        uploadedById: settings.userId || (req.user?.id || null),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Initialize the analysis results object
      const analysisResults: any = {
        documentId: document.id,
        metadata: {
          fileName: originalFileName,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadDate: new Date(),
          settings
        }
      };
      
      // Step 1: Extract text if requested
      if (settings.extractText) {
        try {
          const extractionResult = await extractTextFromDocument(filePath, {
            language: settings.language
          });
          
          analysisResults.extraction = extractionResult;
          
          // Record the analysis in the database
          await storage.createDocumentAnalysis({
            documentId: document.id,
            analysisType: 'text_extraction',
            status: 'completed',
            results: extractionResult,
            confidence: extractionResult.metadata.confidence || 0.9,
            processingTime: extractionResult.metadata.processTime || 0,
            createdAt: new Date(),
            completedAt: new Date()
          } as InsertDocumentAnalysis);
          
          // Step 2: Analyze structure if requested and text extraction succeeded
          if (settings.analyzeStructure) {
            try {
              const structureResult = await analyzeDocumentStructure(extractionResult);
              analysisResults.structure = structureResult;
              
              // Record the structure analysis
              await storage.createDocumentAnalysis({
                documentId: document.id,
                analysisType: 'structure_recognition',
                status: 'completed',
                results: structureResult,
                confidence: structureResult.metadata.confidence || 0.8,
                processingTime: structureResult.metadata.processingTime || 0,
                createdAt: new Date(),
                completedAt: new Date()
              } as InsertDocumentAnalysis);
              
              // Step 3: Classify document if requested
              if (settings.classifyDocument) {
                try {
                  const classificationResult = await classifyDocument(structureResult);
                  analysisResults.classification = classificationResult;
                  
                  // Record the classification
                  await storage.createDocumentAnalysis({
                    documentId: document.id,
                    analysisType: 'document_classification',
                    status: 'completed',
                    results: classificationResult,
                    confidence: classificationResult.confidence || 0.7,
                    processingTime: classificationResult.metadata.processingTime || 0,
                    createdAt: new Date(),
                    completedAt: new Date()
                  } as InsertDocumentAnalysis);
                  
                  // Step 4: Analyze context if requested
                  if (settings.analyzeContext) {
                    try {
                      const contextResult = await parseDocumentContext(structureResult);
                      analysisResults.context = contextResult;
                      
                      // Record the context analysis
                      await storage.createDocumentAnalysis({
                        documentId: document.id,
                        analysisType: 'context_analysis',
                        status: 'completed',
                        results: contextResult,
                        confidence: contextResult.contextualScore || 0.7,
                        processingTime: contextResult.processingTimeMs || 0,
                        createdAt: new Date(),
                        completedAt: new Date()
                      } as InsertDocumentAnalysis);
                    } catch (error) {
                      logger.error('Context analysis failed', { context: { error, documentId: document.id } });
                      analysisResults.contextError = 'Context analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error');
                    }
                  }
                  
                  // Step 5: Extract knowledge graph if requested
                  if (settings.extractKnowledgeGraph) {
                    try {
                      const graphResult = await extractKnowledgeGraph(structureResult);
                      analysisResults.knowledgeGraph = graphResult;
                      
                      // Record the knowledge graph extraction
                      await storage.createDocumentAnalysis({
                        documentId: document.id,
                        analysisType: 'knowledge_graph_extraction',
                        status: 'completed',
                        results: graphResult,
                        confidence: 0.7, // Default confidence
                        processingTime: graphResult.statistics.processingTime || 0,
                        createdAt: new Date(),
                        completedAt: new Date()
                      } as InsertDocumentAnalysis);
                      
                      // Save the extracted knowledge graph nodes and edges
                      await storage.saveKnowledgeGraph(graphResult);
                    } catch (error) {
                      logger.error('Knowledge graph extraction failed', { context: { error, documentId: document.id } });
                      analysisResults.knowledgeGraphError = 'Knowledge graph extraction failed: ' + (error instanceof Error ? error.message : 'Unknown error');
                    }
                  }
                  
                  // Step 6: Generate syllabus if requested
                  if (settings.generateSyllabus) {
                    try {
                      const syllabusOptions = {
                        templateId: req.body.templateId ? parseInt(req.body.templateId) : undefined,
                        programType: classificationResult.category === 'TRAINING' ? 'type_rating' : 'custom',
                        extractModules: true,
                        extractLessons: true,
                        extractCompetencies: true,
                        extractRegulatoryReferences: true
                      };
                      
                      const syllabusResult = await generateSyllabusFromDocument(document.id, syllabusOptions);
                      analysisResults.syllabus = syllabusResult;
                      
                      // Record the syllabus generation
                      await storage.createDocumentAnalysis({
                        documentId: document.id,
                        analysisType: 'syllabus_generation',
                        status: 'completed',
                        results: syllabusResult,
                        confidence: syllabusResult.confidenceScore / 100,
                        processingTime: 0, // We don't track processing time for this yet
                        createdAt: new Date(),
                        completedAt: new Date()
                      } as InsertDocumentAnalysis);
                    } catch (error) {
                      logger.error('Syllabus generation failed', { context: { error, documentId: document.id } });
                      analysisResults.syllabusError = 'Syllabus generation failed: ' + (error instanceof Error ? error.message : 'Unknown error');
                    }
                  }
                } catch (error) {
                  logger.error('Document classification failed', { context: { error, documentId: document.id } });
                  analysisResults.classificationError = 'Classification failed: ' + (error instanceof Error ? error.message : 'Unknown error');
                }
              }
            } catch (error) {
              logger.error('Document structure analysis failed', { context: { error, documentId: document.id } });
              analysisResults.structureError = 'Structure analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error');
            }
          }
        } catch (error) {
          logger.error('Text extraction failed', { context: { error, documentId: document.id } });
          analysisResults.extractionError = 'Text extraction failed: ' + (error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // Update document status to 'completed'
      await storage.updateDocument(document.id, {
        status: 'completed',
        updatedAt: new Date()
      });
      
      // Send back the document ID and analysis results
      res.status(201).json({
        document: {
          id: document.id,
          title: document.title,
          status: 'completed'
        },
        results: analysisResults
      });
      
    } catch (error) {
      logger.error('Document analysis failed', { context: { error } });
      
      // Clean up file if it was uploaded
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error('Error deleting file after failed analysis', { context: { error: unlinkError } });
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during document analysis';
      res.status(500).json({ 
        error: 'Document analysis failed',
        message: errorMessage
      });
    }
  });
  
  /**
   * Get document analysis types
   */
  app.get('/api/documents/analysis-types', (req: Request, res: Response) => {
    // Return available analysis types
    const analysisTypes = [
      { value: 'text_extraction', label: 'Text Extraction', description: 'Extract text from document files' },
      { value: 'structure_recognition', label: 'Structure Analysis', description: 'Recognize document structure including headings, sections, and tables' },
      { value: 'document_classification', label: 'Document Classification', description: 'Classify document by type, subject, and importance' },
      { value: 'context_analysis', label: 'Context Analysis', description: 'Extract contextual information and entities' },
      { value: 'knowledge_graph_extraction', label: 'Knowledge Graph', description: 'Extract knowledge graph representing document concepts and relationships' },
      { value: 'syllabus_generation', label: 'Syllabus Generation', description: 'Generate training syllabus from document content' },
    ];
    
    res.json(analysisTypes);
  });
  
  /**
   * Get analysis results for a document
   */
  app.get('/api/documents/:id/analysis', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const analysisType = req.query.type as string | undefined;
      
      // Check if document exists
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Get analysis results
      let analysisResults;
      
      if (analysisType) {
        // Get specific analysis type results
        analysisResults = await storage.getDocumentAnalysisByType(documentId, analysisType);
      } else {
        // Get all analysis results
        analysisResults = await storage.getDocumentAnalysis(documentId);
      }
      
      if (!analysisResults || (Array.isArray(analysisResults) && analysisResults.length === 0)) {
        return res.status(404).json({ error: 'No analysis results found' });
      }
      
      res.json(analysisResults);
    } catch (error) {
      logger.error('Error fetching document analysis', { context: { error, documentId: req.params.id } });
      res.status(500).json({ error: 'Failed to fetch document analysis' });
    }
  });
  
  /**
   * Delete document analysis
   */
  app.delete('/api/documents/:id/analysis/:analysisId', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const analysisId = parseInt(req.params.analysisId);
      
      // Check if document exists
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Delete the analysis
      const deleted = await storage.deleteDocumentAnalysis(analysisId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Analysis not found or already deleted' });
      }
      
      res.status(200).json({ message: 'Analysis deleted successfully' });
    } catch (error) {
      logger.error('Error deleting document analysis', { 
        context: { 
          error, 
          documentId: req.params.id,
          analysisId: req.params.analysisId 
        } 
      });
      res.status(500).json({ error: 'Failed to delete document analysis' });
    }
  });
}