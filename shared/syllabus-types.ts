import { z } from "zod";

// Options for syllabus generation
export const syllabusGenerationOptionsSchema = z.object({
  programType: z.enum(['initial_type_rating', 'recurrent', 'joc_mcc', 'custom']),
  aircraftType: z.string().optional(),
  regulatoryAuthority: z.enum(['faa', 'easa', 'icao', 'dgca', 'other']).optional(),
  includeSimulatorExercises: z.boolean().default(true),
  includeClassroomModules: z.boolean().default(true),
  includeAssessments: z.boolean().default(true),
  customizationLevel: z.enum(['minimal', 'moderate', 'extensive']).default('moderate'),
  defaultDuration: z.number().min(1).default(14), // Default duration in days
});

export type SyllabusGenerationOptions = z.infer<typeof syllabusGenerationOptionsSchema>;

// Extracted competency from a document
export interface ExtractedCompetency {
  name: string;
  description: string;
  assessmentCriteria: string[];
  regulatoryReference?: string;
}

// Extracted module from a document
export interface ExtractedModule {
  name: string;
  description: string;
  type: string; // 'ground', 'simulator', 'aircraft'
  competencies: ExtractedCompetency[];
  recommendedDuration: number; // In hours
  regulatoryRequirements?: string[];
}

// Extracted lesson from a document
export interface ExtractedLesson {
  name: string;
  description: string;
  content: string;
  type: string; // 'video', 'document', 'interactive'
  moduleIndex: number; // Reference to parent module
  duration: number; // In minutes
  learningObjectives: string[];
}

// Complete generated syllabus structure
export interface GeneratedSyllabus {
  name: string;
  description: string;
  programType: string;
  aircraftType?: string;
  regulatoryAuthority?: string;
  totalDuration: number; // In days
  modules: ExtractedModule[];
  lessons: ExtractedLesson[];
  regulatoryCompliance: {
    authority: string;
    requirementsMet: string[];
    requirementsPartiallyMet: string[];
    requirementsNotMet: string[];
  };
  confidenceScore: number; // 0-100% confidence in extraction accuracy
}

// Schema for saving a generated syllabus
export const syllabusImportSchema = z.object({
  documentId: z.number(),
  options: syllabusGenerationOptionsSchema,
});

export type SyllabusImportRequest = z.infer<typeof syllabusImportSchema>;

// Schema for syllabus generation progress
export const syllabusGenerationProgressSchema = z.object({
  documentId: z.number(),
  status: z.enum(['queued', 'processing', 'extracting_structure', 'identifying_modules', 
                  'creating_lessons', 'mapping_compliance', 'completed', 'failed']),
  progress: z.number().min(0).max(100), // Percentage complete
  message: z.string().optional(),
  estimatedTimeRemaining: z.number().optional(), // In seconds
  syllabusId: z.number().optional(), // If completed
  error: z.string().optional(),
});

export type SyllabusGenerationProgress = z.infer<typeof syllabusGenerationProgressSchema>;