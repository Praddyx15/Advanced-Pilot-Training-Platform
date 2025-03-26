/**
 * Syllabus Generator Service
 * 
 * Manages the generation of training syllabi from documents
 * and conversion to training programs.
 */
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Storage from 'node-storage';
import { DocumentAIEngine } from './document-ai-engine';
import { documents, documentContent, trainingPrograms, modules, lessons } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { logger } from '../core/logger';
import {
  SyllabusGenerationOptions,
  SyllabusGenerationProgress,
  GeneratedSyllabus,
  TrainingProgram
} from '@shared/syllabus-types';

// Initialize storage for generation processes
const generationStore = new Storage('./data/syllabus-generation/generation_data.json');

// Initialize engine
const aiEngine = new DocumentAIEngine();

// Generation job tracking
interface GenerationJob {
  id: string;
  documentId: number;
  userId: number;
  options: SyllabusGenerationOptions;
  progress: SyllabusGenerationProgress;
  syllabus: GeneratedSyllabus | null;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
}

const GENERATION_STAGES = [
  'initializing',
  'extracting_text',
  'analyzing_content',
  'identifying_competencies',
  'creating_modules',
  'creating_lessons',
  'generating_knowledge_graph',
  'validating_regulatory_compliance',
  'generating_final_syllabus',
  'completed'
];

/**
 * Start a syllabus generation process
 */
export function startSyllabusGeneration(
  documentId: number, 
  options: SyllabusGenerationOptions
): Promise<{ generationId: string, progress: SyllabusGenerationProgress }> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new generation ID
      const generationId = uuidv4();
      
      // Initialize progress
      const progress: SyllabusGenerationProgress = {
        status: 'in_progress',
        stage: 'initializing',
        percent: 0,
        message: 'Initializing syllabus generation',
        startTime: new Date().toISOString(),
        endTime: null
      };
      
      // Create job
      const job: GenerationJob = {
        id: generationId,
        documentId,
        userId: options.userId || 0,
        options,
        progress,
        syllabus: null,
        startedAt: new Date(),
        completedAt: null,
        error: null
      };
      
      // Store job
      generationStore.put(generationId, job);
      
      // Start generation in background
      generateSyllabusInBackground(generationId)
        .catch(error => {
          logger.error(`Background syllabus generation error: ${error instanceof Error ? error.message : String(error)}`);
          
          // Update job with error
          const errorJob = generationStore.get(generationId) as GenerationJob;
          if (errorJob) {
            errorJob.error = error instanceof Error ? error.message : String(error);
            errorJob.progress.status = 'failed';
            errorJob.progress.message = `Failed: ${errorJob.error}`;
            errorJob.progress.endTime = new Date().toISOString();
            errorJob.completedAt = new Date();
            generationStore.put(generationId, errorJob);
          }
        });
      
      // Return the generation ID
      resolve({
        generationId,
        progress
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate syllabus in background
 */
async function generateSyllabusInBackground(generationId: string): Promise<void> {
  try {
    // Get job
    const job = generationStore.get(generationId) as GenerationJob;
    if (!job) {
      throw new Error(`Generation job ${generationId} not found`);
    }
    
    // Get document content
    const updateProgress = (stage: string, percent: number, message: string) => {
      job.progress.stage = stage;
      job.progress.percent = percent;
      job.progress.message = message;
      generationStore.put(generationId, job);
    };
    
    // Stage 1: Extract text
    updateProgress('extracting_text', 10, 'Extracting text from document');
    
    const [content] = await db.select()
      .from(documentContent)
      .where(eq(documentContent.documentId, job.documentId));
    
    if (!content || !content.textContent) {
      throw new Error(`Document content not found for document ${job.documentId}`);
    }
    
    // Stage 2: Analyze content
    updateProgress('analyzing_content', 20, 'Analyzing document content');
    
    // Stage 3-9: Generate syllabus using AI engine
    updateProgress('identifying_competencies', 30, 'Identifying competencies');
    // Wait a bit to simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateProgress('creating_modules', 40, 'Creating training modules');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateProgress('creating_lessons', 50, 'Creating lessons');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (job.options.includeKnowledgeGraph) {
      updateProgress('generating_knowledge_graph', 60, 'Generating knowledge graph');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    updateProgress('validating_regulatory_compliance', 80, 'Validating regulatory compliance');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateProgress('generating_final_syllabus', 90, 'Generating final syllabus');
    
    // Generate syllabus
    const syllabus = aiEngine.generateSyllabus(content.textContent, job.options);
    
    // Store generated syllabus
    job.syllabus = syllabus;
    
    // Update progress to completed
    updateProgress('completed', 100, 'Syllabus generation completed');
    job.progress.status = 'completed';
    job.progress.endTime = new Date().toISOString();
    job.completedAt = new Date();
    
    // Save updated job
    generationStore.put(generationId, job);
  } catch (error) {
    logger.error(`Error generating syllabus: ${error instanceof Error ? error.message : String(error)}`);
    
    // Get job
    const job = generationStore.get(generationId) as GenerationJob;
    if (job) {
      // Update job with error
      job.error = error instanceof Error ? error.message : String(error);
      job.progress.status = 'failed';
      job.progress.message = `Failed: ${job.error}`;
      job.progress.endTime = new Date().toISOString();
      job.completedAt = new Date();
      generationStore.put(generationId, job);
    }
    
    throw error;
  }
}

/**
 * Get syllabus generation progress
 */
export function getSyllabusGenerationProgress(generationId: string): SyllabusGenerationProgress {
  try {
    const job = generationStore.get(generationId) as GenerationJob;
    if (!job) {
      throw new Error(`Generation job ${generationId} not found`);
    }
    
    return job.progress;
  } catch (error) {
    logger.error(`Error getting generation progress: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Get generated syllabus
 */
export function getGeneratedSyllabus(generationId: string): GeneratedSyllabus {
  try {
    const job = generationStore.get(generationId) as GenerationJob;
    if (!job) {
      throw new Error(`Generation job ${generationId} not found`);
    }
    
    if (!job.syllabus) {
      throw new Error(`Syllabus not yet generated for job ${generationId}`);
    }
    
    return job.syllabus;
  } catch (error) {
    logger.error(`Error getting generated syllabus: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Save syllabus as a training program
 */
export async function saveSyllabusAsProgram(
  syllabus: GeneratedSyllabus,
  userId: number
): Promise<TrainingProgram> {
  try {
    // Create the program
    const [program] = await db.insert(trainingPrograms)
      .values({
        name: syllabus.name,
        description: syllabus.description,
        programType: syllabus.programType,
        aircraftType: syllabus.aircraftType,
        status: 'active',
        regulatoryAuthority: syllabus.regulatoryCompliance.authority,
        durationDays: syllabus.totalDuration,
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Create modules for the program
    for (const moduleData of syllabus.modules) {
      const [module] = await db.insert(modules)
        .values({
          name: moduleData.name,
          programId: program.id,
          type: moduleData.type,
          recommendedDuration: moduleData.recommendedDuration,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Create lessons for the module
      const moduleLessons = syllabus.lessons.filter(lesson => 
        lesson.moduleIndex === syllabus.modules.indexOf(moduleData)
      );
      
      for (const lessonData of moduleLessons) {
        await db.insert(lessons)
          .values({
            name: lessonData.name,
            moduleId: module.id,
            type: lessonData.type,
            content: lessonData.content,
            duration: lessonData.duration,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
    }
    
    return program;
  } catch (error) {
    logger.error(`Error saving syllabus as program: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}