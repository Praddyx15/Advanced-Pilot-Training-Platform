import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { documents, documentContent, insertDocumentSchema, insertDocumentContentSchema } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExt);
  }
});

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: function (req, file, cb) {
    // Accept only common document types
    const filetypes = /pdf|doc|docx|xlsx|xls|ppt|pptx|txt|csv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('File upload only supports the following filetypes: ' + filetypes));
  }
});

// Get document file type from original filename
function getDocumentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.pdf':
      return 'pdf';
    case '.doc':
    case '.docx':
      return 'word';
    case '.xls':
    case '.xlsx':
      return 'excel';
    case '.ppt':
    case '.pptx':
      return 'powerpoint';
    case '.txt':
      return 'text';
    case '.csv':
      return 'csv';
    default:
      return 'other';
  }
}

// Get permission based on user role
function getPermissionLevel(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
    case 'instructor':
    case 'examiner':
      return 'write';
    case 'trainee':
    case 'student':
      return 'read';
    default:
      return 'none';
  }
}

// Setup document routes
export function registerDocumentRoutes(app: express.Express) {
  // Get all documents (with role-based filtering)
  app.get('/api/documents', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = req.user;
      const allDocuments = await db.select().from(documents);
      
      // Filter documents based on user role
      let filteredDocuments = allDocuments;
      
      // If user is not admin, only show appropriate documents
      if (user.role.toLowerCase() !== 'admin') {
        // Students/trainees can only see documents they have access to
        if (user.role.toLowerCase() === 'trainee' || user.role.toLowerCase() === 'student') {
          filteredDocuments = allDocuments.filter(doc => {
            const sharedWith = Array.isArray(doc.sharedWith) ? doc.sharedWith : [];
            return doc.uploadedById === user.id || 
                  sharedWith.includes(user.id) ||
                  doc.uploadedByRole.toLowerCase() === 'instructor' ||
                  doc.uploadedByRole.toLowerCase() === 'examiner';
          });
        }
      }

      res.json(filteredDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  // Get document by ID
  app.get('/api/documents/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const documentId = parseInt(req.params.id);
      const user = req.user;
      
      // Query document
      const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Check permissions - admins can see all, others are restricted
      if (user.role.toLowerCase() !== 'admin') {
        const sharedWith = Array.isArray(document.sharedWith) ? document.sharedWith : [];
        if (document.uploadedById !== user.id && !sharedWith.includes(user.id)) {
          return res.status(403).json({ error: 'You do not have permission to view this document' });
        }
      }

      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  });

  // Get document content
  app.get('/api/documents/:id/content', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const documentId = parseInt(req.params.id);
      
      // First, check if document exists and user has access
      const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Check permissions
      const user = req.user;
      if (user.role.toLowerCase() !== 'admin') {
        const sharedWith = Array.isArray(document.sharedWith) ? document.sharedWith : [];
        if (document.uploadedById !== user.id && !sharedWith.includes(user.id)) {
          return res.status(403).json({ error: 'You do not have permission to view this document content' });
        }
      }
      
      // Get content
      const [content] = await db.select().from(documentContent).where(eq(documentContent.documentId, documentId));
      
      if (!content) {
        return res.status(404).json({ error: 'Document content not found' });
      }

      res.json(content);
    } catch (error) {
      console.error('Error fetching document content:', error);
      res.status(500).json({ error: 'Failed to fetch document content' });
    }
  });

  // Upload document
  app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Ensure file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = req.user;
      const file = req.file;
      
      // Extract metadata from request body
      const {
        title = file.originalname,
        description = '',
        sharedWith = '[]'
      } = req.body;
      
      // Prepare document data
      const documentData = {
        title,
        description,
        fileType: getDocumentType(file.originalname),
        url: `/api/documents/download/${path.basename(file.path)}`,
        filePath: file.path,
        fileSize: file.size,
        uploadedById: user.id,
        uploadedByRole: user.role,
        sharedWith: typeof sharedWith === 'string' ? sharedWith : JSON.stringify(sharedWith),
        isProcessed: false,
        metadata: '{}',
        fileName: file.originalname,
        tags: req.body.tags || ''
      };
      
      // Validate document data
      const validatedData = insertDocumentSchema.parse(documentData);
      
      // Insert document into database
      const [document] = await db.insert(documents).values(validatedData).returning();
      
      // Create initial empty content entry
      const contentData = {
        documentId: document.id,
        textContent: '',
        structuredContent: '{}',
        sections: '[]',
        extractedKeywords: '[]',
        confidenceScore: 0,
        extractionTime: null
      };
      
      const validatedContentData = insertDocumentContentSchema.parse(contentData);
      await db.insert(documentContent).values(validatedContentData);

      // Generate a download URL
      const downloadUrl = `/api/documents/${document.id}/download`;
      
      // Return response with document details
      res.status(201).json({
        ...document,
        downloadUrl
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // Cleanup uploaded file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      // Handle validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid document data', details: error.message });
      }
      
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  // Download document
  app.get('/api/documents/:id/download', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const documentId = parseInt(req.params.id);
      const user = req.user;
      
      // Query document
      const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Check permissions
      if (user.role.toLowerCase() !== 'admin') {
        const sharedWith = Array.isArray(document.sharedWith) ? document.sharedWith : [];
        if (document.uploadedById !== user.id && !sharedWith.includes(user.id)) {
          return res.status(403).json({ error: 'You do not have permission to download this document' });
        }
      }
      
      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Send file
      res.sendFile(document.filePath);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ error: 'Failed to download document' });
    }
  });

  // Extract document content
  app.post('/api/documents/:id/extract', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const documentId = parseInt(req.params.id);
      const user = req.user;
      
      // Check if user has permission
      if (user.role.toLowerCase() !== 'admin' && user.role.toLowerCase() !== 'instructor' && user.role.toLowerCase() !== 'examiner') {
        return res.status(403).json({ error: 'You do not have permission to extract document content' });
      }
      
      // Get document
      const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Get extraction options from request body
      const { method = 'basic', options = {} } = req.body;
      
      // Simple text extraction for demonstration
      const filePath = document.filePath;
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Document file not found' });
      }
      
      // This is a simplified extraction demo
      // In a real implementation, you would use specialized libraries based on file type
      let textContent = '';
      let extractedData = {};
      let startTime = Date.now();
      
      // Simulate different extraction methods
      switch (method) {
        case 'advanced':
          // Simulate advanced extraction with more data
          textContent = `Advanced extracted text from ${document.fileName}`;
          extractedData = {
            structure: {
              elements: [
                { type: 'heading', level: 1, text: 'Document Title', metadata: { pageNumber: 1 } },
                { type: 'paragraph', text: 'This is the first paragraph of content.', metadata: { pageNumber: 1 } },
                { type: 'heading', level: 2, text: 'Section 1', metadata: { pageNumber: 1 } },
                { type: 'paragraph', text: 'Content for section 1 goes here.', metadata: { pageNumber: 1 } }
              ]
            },
            metadata: {
              author: 'Document Author',
              creationDate: '2025-01-01',
              pageCount: 10,
              title: document.title
            },
            toc: [
              { level: 1, text: 'Document Title', pageNumber: 1 },
              { level: 2, text: 'Section 1', pageNumber: 1 },
              { level: 2, text: 'Section 2', pageNumber: 3 }
            ],
            tables: [
              {
                headers: ['Header 1', 'Header 2', 'Header 3'],
                data: [
                  ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
                  ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3']
                ],
                rows: 2,
                columns: 3
              }
            ],
            regulations: [
              { 
                authority: 'FAA',
                code: '14 CFR Part 61',
                description: 'Certification for pilots and flight instructors'
              }
            ]
          };
          break;
          
        case 'ai':
          // Simulate AI-powered extraction with richer data
          textContent = `AI-enhanced extracted text from ${document.fileName}`;
          extractedData = {
            structure: {
              elements: [
                { type: 'heading', level: 1, text: 'Document Title', metadata: { pageNumber: 1, confidence: 0.95 } },
                { type: 'paragraph', text: 'This is the first paragraph of content.', metadata: { pageNumber: 1, confidence: 0.92 } },
                { type: 'heading', level: 2, text: 'Section 1', metadata: { pageNumber: 1, confidence: 0.94 } },
                { type: 'paragraph', text: 'Content for section 1 goes here.', metadata: { pageNumber: 1, confidence: 0.91 } },
                { type: 'list', text: 'List of items', metadata: { pageNumber: 2, confidence: 0.89 } }
              ]
            },
            metadata: {
              author: 'Document Author',
              creationDate: '2025-01-01',
              pageCount: 10,
              title: document.title,
              keywords: ['aviation', 'training', 'certification'],
              summary: 'This document covers key aspects of aviation training and certification procedures.'
            },
            toc: [
              { level: 1, text: 'Document Title', pageNumber: 1 },
              { level: 2, text: 'Section 1', pageNumber: 1 },
              { level: 2, text: 'Section 2', pageNumber: 3 },
              { level: 3, text: 'Subsection 2.1', pageNumber: 4 }
            ],
            tables: [
              {
                headers: ['Header 1', 'Header 2', 'Header 3'],
                data: [
                  ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
                  ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3']
                ],
                rows: 2,
                columns: 3
              }
            ],
            regulations: [
              { 
                authority: 'FAA',
                code: '14 CFR Part 61',
                description: 'Certification for pilots and flight instructors'
              },
              {
                authority: 'EASA',
                code: 'Part-FCL',
                description: 'Flight Crew Licensing requirements'
              }
            ],
            knowledgeGraph: {
              nodes: [
                { id: '1', type: 'concept', content: 'Flight Training' },
                { id: '2', type: 'concept', content: 'Certification Requirements' },
                { id: '3', type: 'entity', content: 'FAA' },
                { id: '4', type: 'procedure', content: 'Pre-flight Check' }
              ],
              edges: [
                { source: '1', target: '2', relationship: 'related_to' },
                { source: '2', target: '3', relationship: 'governed_by' },
                { source: '1', target: '4', relationship: 'includes' }
              ]
            }
          };
          break;
          
        default: // basic
          // Simulate basic extraction with minimal data
          textContent = `Basic extracted text from ${document.fileName}`;
          extractedData = {
            metadata: {
              title: document.title,
              fileSize: document.fileSize,
              fileType: document.fileType
            }
          };
          break;
      }
      
      // Calculate extraction time
      const extractionTimeMs = Date.now() - startTime;
      
      // Get the structure and keywords safely
      const structureElements = typeof extractedData === 'object' && extractedData !== null && 
        'structure' in extractedData && typeof extractedData.structure === 'object' && extractedData.structure !== null && 
        'elements' in extractedData.structure ? extractedData.structure.elements : [];
        
      const metadataKeywords = typeof extractedData === 'object' && extractedData !== null && 
        'metadata' in extractedData && typeof extractedData.metadata === 'object' && extractedData.metadata !== null && 
        'keywords' in extractedData.metadata ? extractedData.metadata.keywords : [];
      
      // Update document content in database
      await db.update(documentContent)
        .set({
          textContent: textContent,
          structuredContent: JSON.stringify(extractedData),
          sections: JSON.stringify(structureElements),
          extractedKeywords: JSON.stringify(metadataKeywords),
          confidenceScore: 0.9, // Example confidence score
          extractionTime: extractionTimeMs
        })
        .where(eq(documentContent.documentId, documentId));
      
      // Update document to mark as processed
      await db.update(documents)
        .set({
          isProcessed: true,
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId));
      
      // Return extracted content
      res.json({
        ...extractedData,
        textContent,
        extractionTime: extractionTimeMs
      });
    } catch (error) {
      console.error('Error extracting document content:', error);
      res.status(500).json({ error: 'Failed to extract document content' });
    }
  });

  // Generate forms from document
  app.post('/api/documents/:id/generate-forms', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const documentId = parseInt(req.params.id);
      const user = req.user;
      
      // Check if user has permission
      if (user.role.toLowerCase() !== 'admin' && user.role.toLowerCase() !== 'instructor' && user.role.toLowerCase() !== 'examiner') {
        return res.status(403).json({ error: 'You do not have permission to generate forms' });
      }
      
      // Get document and its content
      const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      const [content] = await db.select().from(documentContent).where(eq(documentContent.documentId, documentId));
      
      if (!content) {
        return res.status(404).json({ error: 'Document content not found' });
      }
      
      if (!document.isProcessed) {
        return res.status(400).json({ error: 'Document content has not been processed yet' });
      }
      
      // Generate forms based on extracted content
      // This is a simplified demo - in a real implementation, you would
      // analyze the content and generate appropriate forms
      
      // Example generated forms
      const generatedForms = {
        trainingForms: [
          {
            id: uuidv4(),
            title: 'Training Assessment Form',
            description: 'Assessment form for training progress',
            sections: [
              {
                title: 'Basic Information',
                fields: [
                  { type: 'text', label: 'Trainee Name', required: true },
                  { type: 'date', label: 'Assessment Date', required: true },
                  { type: 'select', label: 'Training Module', options: ['Module 1', 'Module 2', 'Module 3'] }
                ]
              },
              {
                title: 'Performance Evaluation',
                fields: [
                  { type: 'rating', label: 'Overall Performance', max: 5, required: true },
                  { type: 'textarea', label: 'Strengths', required: false },
                  { type: 'textarea', label: 'Areas for Improvement', required: false }
                ]
              }
            ]
          }
        ],
        complianceProcedures: [
          {
            id: uuidv4(),
            title: 'Compliance Checklist',
            description: 'Checklist for regulatory compliance',
            items: [
              { id: '1', text: 'Verify pilot license currency', reference: 'FAA 14 CFR Part 61.56' },
              { id: '2', text: 'Complete pre-flight inspection', reference: 'Operations Manual Sec. 3.2' },
              { id: '3', text: 'Review weather conditions', reference: 'Operations Manual Sec. 2.4' }
            ]
          }
        ],
        sessionPlans: [
          {
            id: uuidv4(),
            title: 'Training Session Plan',
            description: 'Plan for upcoming training session',
            duration: 120, // minutes
            objectives: [
              'Demonstrate understanding of navigation principles',
              'Successfully complete simulated cross-country flight',
              'Demonstrate proper emergency procedures'
            ],
            activities: [
              { title: 'Pre-flight briefing', duration: 20, description: 'Review flight plan and objectives' },
              { title: 'Simulator session', duration: 60, description: 'Conduct simulated cross-country flight with emergency scenarios' },
              { title: 'Debrief', duration: 30, description: 'Review performance and areas for improvement' }
            ],
            materials: [
              'Flight simulator',
              'Navigation charts',
              'Emergency procedures checklist'
            ]
          }
        ]
      };
      
      res.json(generatedForms);
    } catch (error) {
      console.error('Error generating forms:', error);
      res.status(500).json({ error: 'Failed to generate forms' });
    }
  });
  
  // Delete document
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const documentId = parseInt(req.params.id);
      const user = req.user;
      
      // Get document
      const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Check permissions - only admin or the uploader can delete
      if (user.role.toLowerCase() !== 'admin' && document.uploadedById !== user.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this document' });
      }
      
      // Delete file from disk if it exists
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
      
      // Delete document content first (foreign key constraint)
      await db.delete(documentContent).where(eq(documentContent.documentId, documentId));
      
      // Delete document
      await db.delete(documents).where(eq(documents.id, documentId));
      
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });
}