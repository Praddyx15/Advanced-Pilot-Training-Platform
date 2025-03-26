/**
 * Document Analysis Service
 * 
 * Service for analyzing uploaded documents and extracting structured information.
 * Integrates with DocumentAIEngine for text processing and analysis.
 */
import * as fs from 'fs';
import { documentContent, documentAnalysis, insertDocumentContentSchema, insertDocumentAnalysisSchema, documents, documentShares } from '@shared/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { DocumentAIEngine } from './document-ai-engine';
import { logger } from '../core/logger';
import { SyllabusGenerationOptions, GeneratedSyllabus } from '@shared/syllabus-types';

// Create AI engine instance
const aiEngine = new DocumentAIEngine();

// Define types
interface AnalysisOptions {
  extractText?: boolean;
  runClassification?: boolean;
  extractEntities?: boolean;
  detectReferences?: boolean;
  generateSummary?: boolean;
}

const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  extractText: true,
  runClassification: true,
  extractEntities: true,
  detectReferences: true,
  generateSummary: true
};

/**
 * Process and analyze a document
 */
export async function analyzeDocument(documentId: number, options: AnalysisOptions = DEFAULT_ANALYSIS_OPTIONS): Promise<any> {
  try {
    logger.info(`Starting document analysis for document #${documentId}`);
    
    // Get document from database
    const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
    
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Start processing pipeline
    const startTime = Date.now();
    
    // Step 1: Extract text from document
    const filePath = document.filePath;
    if (!fs.existsSync(filePath)) {
      throw new Error(`Document file not found at path: ${filePath}`);
    }
    
    const extractedText = await aiEngine.extractText(filePath);
    if (!extractedText) {
      throw new Error(`Failed to extract text from document: ${document.title}`);
    }
    
    // Step 2: Store extracted text content
    await storeDocumentContent(documentId, extractedText);
    
    // Step 3: Run AI analysis on the content
    const analysisResult = aiEngine.analyzeDocument(extractedText);
    
    // Step 4: Store analysis results
    await storeDocumentAnalysis(documentId, analysisResult);
    
    // Step 5: Update document status to processed
    await db.update(documents)
      .set({ 
        isProcessed: true,
        updatedAt: new Date()
      })
      .where(eq(documents.id, documentId));
    
    const processingTime = Date.now() - startTime;
    logger.info(`Document analysis completed for #${documentId} in ${processingTime}ms`);
    
    return {
      ...analysisResult,
      documentId,
      processingTime
    };
  } catch (error) {
    logger.error(`Error analyzing document: ${error instanceof Error ? error.message : String(error)}`);
    
    // Update document with error status
    await db.update(documents)
      .set({ 
        isProcessed: false,
        updatedAt: new Date()
      })
      .where(eq(documents.id, documentId));
    
    throw error;
  }
}

/**
 * Store document content in the database
 */
async function storeDocumentContent(documentId: number, textContent: string): Promise<void> {
  try {
    // Check if content already exists
    const existing = await db.select()
      .from(documentContent)
      .where(eq(documentContent.documentId, documentId));
    
    if (existing.length > 0) {
      // Update existing content
      await db.update(documentContent)
        .set({ 
          textContent,
          updatedAt: new Date()
        })
        .where(eq(documentContent.documentId, documentId));
    } else {
      // Insert new content
      const contentData = {
        documentId,
        textContent,
        structuredContent: {},
        sections: [],
        extractedKeywords: [],
        confidenceScore: 0.85,
        extractionTime: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(documentContent).values(contentData);
    }
  } catch (error) {
    logger.error(`Error storing document content: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Store document analysis results in the database
 */
async function storeDocumentAnalysis(documentId: number, results: any): Promise<void> {
  try {
    // Check if analysis already exists
    const existing = await db.select()
      .from(documentAnalysis)
      .where(eq(documentAnalysis.documentId, documentId));
    
    const analysisData = {
      documentId,
      category: results.category,
      keywords: results.keywords,
      entities: results.entities,
      summary: results.summary,
      contentStats: results.content,
      references: results.references,
      confidence: results.confidence,
      processingTime: results.processingTime,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (existing.length > 0) {
      // Update existing analysis
      await db.update(documentAnalysis)
        .set({ 
          category: results.category,
          keywords: results.keywords,
          entities: results.entities,
          summary: results.summary,
          contentStats: results.content,
          references: results.references,
          confidence: results.confidence,
          processingTime: results.processingTime,
          updatedAt: new Date()
        })
        .where(eq(documentAnalysis.documentId, documentId));
    } else {
      // Insert new analysis
      await db.insert(documentAnalysis).values(analysisData);
    }
  } catch (error) {
    logger.error(`Error storing document analysis: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Generate a syllabus from a document
 */
export async function generateSyllabusFromDocument(documentId: number, options: SyllabusGenerationOptions): Promise<GeneratedSyllabus> {
  try {
    logger.info(`Starting syllabus generation for document #${documentId}`);
    
    // Get document content
    const [content] = await db.select()
      .from(documentContent)
      .where(eq(documentContent.documentId, documentId));
    
    if (!content || !content.textContent) {
      // If content is not stored yet, analyze the document first
      await analyzeDocument(documentId);
      
      // Try again
      const [newContent] = await db.select()
        .from(documentContent)
        .where(eq(documentContent.documentId, documentId));
      
      if (!newContent || !newContent.textContent) {
        throw new Error(`Could not retrieve text content for document #${documentId}`);
      }
      
      // Generate syllabus with AI engine
      return aiEngine.generateSyllabus(newContent.textContent, options);
    }
    
    // Generate syllabus with AI engine
    return aiEngine.generateSyllabus(content.textContent, options);
  } catch (error) {
    logger.error(`Error generating syllabus: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Share document with users
 */
export async function shareDocumentWithUsers(documentId: number, userIds: number[], shareType: string, sharedById: number): Promise<void> {
  try {
    // Verify document exists
    const [document] = await db.select()
      .from(documents)
      .where(eq(documents.id, documentId));
    
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Check for existing shares
    const existingShares = await db.select()
      .from(documentShares)
      .where(eq(documentShares.documentId, documentId));
    
    const existingUserIds = new Set(existingShares.map(share => share.userId));
    
    // Share with each user
    for (const userId of userIds) {
      // Skip if already shared
      if (existingUserIds.has(userId)) continue;
      
      // Create share
      await db.insert(documentShares)
        .values({
          documentId,
          userId,
          sharedById,
          shareType,
          sharedAt: new Date(),
          lastAccessed: null
        });
    }
  } catch (error) {
    logger.error(`Error sharing document: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}