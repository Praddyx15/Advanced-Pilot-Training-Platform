import { z } from "zod";

// Template types for syllabus generation
export const syllabusTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  programType: z.enum(['initial_type_rating', 'recurrent', 'joc_mcc', 'type_conversion', 'instructor', 'custom']),
  version: z.string(),
  regulatoryAuthority: z.enum(['faa', 'easa', 'icao', 'dgca', 'other']),
  modules: z.array(z.any()).optional(), // Will be properly typed in the actual implementation
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type SyllabusTemplate = z.infer<typeof syllabusTemplateSchema>;

// Options for syllabus generation
export const syllabusGenerationOptionsSchema = z.object({
  programType: z.enum(['initial_type_rating', 'recurrent', 'joc_mcc', 'type_conversion', 'instructor', 'custom']),
  aircraftType: z.string().optional(),
  regulatoryAuthority: z.enum(['faa', 'easa', 'icao', 'dgca', 'other']).optional(),
  includeSimulatorExercises: z.boolean().default(true),
  includeClassroomModules: z.boolean().default(true),
  includeAssessments: z.boolean().default(true),
  customizationLevel: z.enum(['minimal', 'moderate', 'extensive']).default('moderate'),
  defaultDuration: z.number().min(1).default(14), // Default duration in days
  templateId: z.number().optional(), // Reference to a pre-configured template
  applyRegulationVersion: z.string().optional(), // Specific regulatory version to apply
  enableComplianceTracking: z.boolean().default(true),
  knowledgeGraphGeneration: z.boolean().default(false), // For advanced document relationship analysis
  multiLanguageSupport: z.array(z.string()).optional(), // List of languages to support
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

// Regulatory reference with versioning
export interface RegulatoryReference {
  code: string;
  authority: string;
  version: string;
  description: string;
  url?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
}

// Compliance impact for changes to syllabus
export interface ComplianceImpact {
  affectedRequirements: RegulatoryReference[];
  impactLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigationSteps?: string[];
  approvalRequired: boolean;
}

// Version history entry for syllabus
export interface SyllabusVersion {
  versionNumber: string;
  changedBy: number; // User ID
  changeDate: Date;
  changeDescription: string;
  complianceImpact: ComplianceImpact;
  previousVersion?: string;
}

// Complete generated syllabus structure
export interface GeneratedSyllabus {
  id?: number;
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
    requirementsMet: RegulatoryReference[];
    requirementsPartiallyMet: RegulatoryReference[];
    requirementsNotMet: RegulatoryReference[];
  };
  confidenceScore: number; // 0-100% confidence in extraction accuracy
  version: string;
  versionHistory?: SyllabusVersion[];
  createdFrom?: {
    templateId?: number;
    documentId?: number;
  };
  knowledgeGraph?: {
    nodes: Array<{id: string, type: string, content: string}>;
    edges: Array<{source: string, target: string, relationship: string}>;
  };
  createdAt?: Date;
  updatedAt?: Date;
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