/**
 * Syllabus Generation Service
 * 
 * Provides AI-powered syllabus creation from documents:
 * - Extract learning objectives and competencies
 * - Generate modules and lessons structure
 * - Map regulatory requirements to modules
 * - Create comprehensive training programs
 */
import { 
  GeneratedSyllabus, 
  SyllabusGenerationOptions, 
  ExtractedCompetency, 
  ExtractedModule, 
  ExtractedLesson, 
  RegulatoryReference,
  ComplianceImpact
} from '@shared/syllabus-types';
import { ExtractionResult } from './document-extraction';
import { DocumentElement, DocumentStructure, StructureType } from './document-structure';
import { logger } from '../core/logger';
import { storage } from '../storage';

// Regulatory authority acronyms to detect
const REGULATORY_AUTHORITIES = [
  { code: 'EASA', name: 'European Union Aviation Safety Agency' },
  { code: 'FAA', name: 'Federal Aviation Administration' },
  { code: 'ICAO', name: 'International Civil Aviation Organization' },
  { code: 'CAA', name: 'Civil Aviation Authority' },
  { code: 'CASA', name: 'Civil Aviation Safety Authority' },
  { code: 'TCCA', name: 'Transport Canada Civil Aviation' },
  { code: 'DGAC', name: 'Directorate General of Civil Aviation' },
  { code: 'ANAC', name: 'National Civil Aviation Agency' },
  { code: 'CAAC', name: 'Civil Aviation Administration of China' }
];

// Module types
const MODULE_TYPES = ['ground', 'simulator', 'aircraft'];

// Lesson types
const LESSON_TYPES = ['video', 'document', 'interactive', 'presentation', 'assessment'];

// Common aircraft types to detect
const AIRCRAFT_TYPES = [
  'A320', 'B737', 'B747', 'B777', 'B787', 'E170', 'E190', 'CRJ', 'DHC8', 'ATR72', 'A330', 'A350',
  'Airbus A320', 'Boeing 737', 'Boeing 747', 'Boeing 777', 'Boeing 787', 'Embraer 170', 
  'Bombardier CRJ', 'Dash 8', 'ATR 72', 'Airbus A330', 'Airbus A350'
];

// Common training program types
const PROGRAM_TYPES = [
  'type rating', 'recurrent training', 'conversion training', 'line training',
  'initial training', 'instructor training', 'examiner training', 'refresher training',
  'differences training', 'MCC', 'JOC', 'UPRT', 'CRM', 'dangerous goods', 'security',
  'emergency procedures'
];

// Competency indicators to identify in text
const COMPETENCY_INDICATORS = [
  'able to', 'should be able to', 'must be able to', 'will be able to',
  'demonstrate', 'should demonstrate', 'must demonstrate', 'will demonstrate',
  'understand', 'should understand', 'must understand', 'will understand',
  'identify', 'should identify', 'must identify', 'will identify',
  'perform', 'should perform', 'must perform', 'will perform',
  'explain', 'should explain', 'must explain', 'will explain',
  'describe', 'should describe', 'must describe', 'will describe',
  'analyze', 'should analyze', 'must analyze', 'will analyze',
  'apply', 'should apply', 'must apply', 'will apply',
  'evaluate', 'should evaluate', 'must evaluate', 'will evaluate',
  'manage', 'should manage', 'must manage', 'will manage',
  'communication', 'leadership', 'workload management', 'situational awareness',
  'problem solving', 'decision making'
];

// Learning objective indicators
const LEARNING_OBJECTIVE_INDICATORS = [
  'learning objective', 'learning outcome', 'training objective', 'will learn',
  'after this lesson', 'by the end of this', 'upon completion', 'the student will',
  'the trainee will', 'the pilot will'
];

// Options for syllabus generation
export interface SyllabusGenerationEngineOptions {
  extractModules?: boolean;
  extractLessons?: boolean;
  extractCompetencies?: boolean;
  extractRegulatoryReferences?: boolean;
  detectAircraftType?: boolean;
  detectProgramType?: boolean;
  mapRegulatoryRequirements?: boolean;
  minimumConfidenceThreshold?: number;
  strictParsingMode?: boolean;
  maxModules?: number;
  maxLessonsPerModule?: number;
}

// Default options
const DEFAULT_OPTIONS: SyllabusGenerationEngineOptions = {
  extractModules: true,
  extractLessons: true,
  extractCompetencies: true,
  extractRegulatoryReferences: true,
  detectAircraftType: true,
  detectProgramType: true,
  mapRegulatoryRequirements: true,
  minimumConfidenceThreshold: 0.6,
  strictParsingMode: false,
  maxModules: 20,
  maxLessonsPerModule: 15
};

/**
 * Generate a syllabus from a document
 */
export async function generateSyllabusFromDocument(
  documentId: number,
  options: SyllabusGenerationOptions
): Promise<GeneratedSyllabus> {
  const startTime = Date.now();
  
  try {
    // Get the document from storage
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    
    // Get the latest document version
    const documentVersions = await storage.getDocumentVersionsByDocument(documentId);
    if (!documentVersions || documentVersions.length === 0) {
      throw new Error(`No versions found for document with ID ${documentId}`);
    }
    
    // Use the latest version by default, or the specified version
    const relevantVersion = options.documentVersionId
      ? documentVersions.find(v => v.id === options.documentVersionId)
      : documentVersions[0];
    
    if (!relevantVersion) {
      throw new Error(`Document version not found`);
    }
    
    // Get the document content and analysis (assuming these are stored)
    const documentAnalysis = await storage.getDocumentAnalysisByDocument(documentId, 'extraction');
    if (!documentAnalysis || documentAnalysis.length === 0) {
      throw new Error(`Document extraction not found for document with ID ${documentId}`);
    }
    
    const extractionData = documentAnalysis[0].results as ExtractionResult;
    
    // Get document structure if available
    const structureAnalysis = await storage.getDocumentAnalysisByDocument(documentId, 'structure');
    const structureData = structureAnalysis && structureAnalysis.length > 0 
      ? structureAnalysis[0].results as DocumentStructure
      : null;
    
    // Start building the syllabus
    const syllabus: GeneratedSyllabus = {
      name: options.name || document.title,
      description: options.description || `Syllabus generated from ${document.title}`,
      programType: '',
      totalDuration: 0,
      modules: [],
      lessons: [],
      regulatoryCompliance: {
        authority: '',
        requirementsMet: [],
        requirementsPartiallyMet: [],
        requirementsNotMet: []
      },
      confidenceScore: 0,
      version: '1.0',
      createdFrom: {
        documentId
      },
      createdAt: new Date()
    };
    
    // Configure engine options
    const engineOptions: SyllabusGenerationEngineOptions = {
      ...DEFAULT_OPTIONS,
      strictParsingMode: options.strictMode || false,
      minimumConfidenceThreshold: options.confidenceThreshold || 0.6
    };
    
    // If a template ID is provided, use it as a base
    if (options.templateId) {
      const template = await storage.getSyllabusTemplate(options.templateId);
      if (template) {
        // Apply template to syllabus
        applyTemplateToSyllabus(syllabus, template);
        syllabus.createdFrom.templateId = options.templateId;
      }
    }
    
    // Detect program and aircraft type
    if (engineOptions.detectProgramType) {
      detectProgramType(extractionData.text, syllabus);
    }
    
    if (engineOptions.detectAircraftType) {
      detectAircraftType(extractionData.text, syllabus);
    }
    
    // Extract modules
    if (engineOptions.extractModules) {
      const modules = extractModules(extractionData, structureData, syllabus, engineOptions);
      syllabus.modules = modules;
    }
    
    // Extract lessons for each module
    if (engineOptions.extractLessons && syllabus.modules.length > 0) {
      const lessons = extractLessons(extractionData, structureData, syllabus.modules, engineOptions);
      syllabus.lessons = lessons;
    }
    
    // Extract regulatory references
    if (engineOptions.extractRegulatoryReferences) {
      extractRegulatoryReferences(extractionData.text, syllabus);
    }
    
    // Map to regulatory requirements if available
    if (engineOptions.mapRegulatoryRequirements && syllabus.regulatoryCompliance.authority) {
      await mapRegulatoryRequirements(syllabus);
    }
    
    // Calculate total duration and confidence score
    calculateTotalDuration(syllabus);
    syllabus.confidenceScore = calculateConfidenceScore(syllabus);
    
    // Build knowledge graph representation if requested
    if (options.includeKnowledgeGraph) {
      syllabus.knowledgeGraph = buildKnowledgeGraph(syllabus);
    }
    
    // Update the timestamp
    syllabus.updatedAt = new Date();
    
    return syllabus;
  } catch (error) {
    logger.error('Error generating syllabus from document', { error, documentId });
    throw error;
  }
}

/**
 * Apply a template to a syllabus
 */
function applyTemplateToSyllabus(syllabus: GeneratedSyllabus, template: any): void {
  // Apply template properties to syllabus
  syllabus.name = syllabus.name || template.name;
  syllabus.description = syllabus.description || template.description;
  syllabus.programType = syllabus.programType || template.programType;
  syllabus.aircraftType = syllabus.aircraftType || template.aircraftType;
  syllabus.regulatoryAuthority = syllabus.regulatoryAuthority || template.regulatoryAuthority;
  
  // Apply template modules if available
  if (template.modules && Array.isArray(template.modules)) {
    syllabus.modules = [...template.modules];
  }
  
  // Apply template lessons if available
  if (template.lessons && Array.isArray(template.lessons)) {
    syllabus.lessons = [...template.lessons];
  }
  
  // Apply regulatory compliance if available
  if (template.regulatoryCompliance) {
    syllabus.regulatoryCompliance = {
      ...template.regulatoryCompliance
    };
  }
}

/**
 * Detect program type from document text
 */
function detectProgramType(text: string, syllabus: GeneratedSyllabus): void {
  const lowerText = text.toLowerCase();
  
  // Check for program types
  for (const programType of PROGRAM_TYPES) {
    const regex = new RegExp(`\\b${programType}\\b`, 'i');
    if (regex.test(lowerText)) {
      syllabus.programType = programType;
      
      // If it's a type rating, also try to detect the aircraft type
      if (programType === 'type rating') {
        // Look for "type rating" followed by aircraft type
        const typeRatingRegex = /type\s+rating\s+(?:for|on)?\s+([A-Za-z0-9\-\s]+)/i;
        const match = text.match(typeRatingRegex);
        if (match && match[1]) {
          syllabus.aircraftType = match[1].trim();
        }
      }
      
      break;
    }
  }
  
  // If no specific type found, try to determine from the context
  if (!syllabus.programType) {
    if (lowerText.includes('initial') && lowerText.includes('training')) {
      syllabus.programType = 'initial training';
    } else if (lowerText.includes('recurrent') && lowerText.includes('training')) {
      syllabus.programType = 'recurrent training';
    } else if (lowerText.includes('conversion') && lowerText.includes('training')) {
      syllabus.programType = 'conversion training';
    } else if (lowerText.includes('examiner') && lowerText.includes('training')) {
      syllabus.programType = 'examiner training';
    } else if (lowerText.includes('instructor') && lowerText.includes('training')) {
      syllabus.programType = 'instructor training';
    } else {
      syllabus.programType = 'general training';
    }
  }
}

/**
 * Detect aircraft type from document text
 */
function detectAircraftType(text: string, syllabus: GeneratedSyllabus): void {
  // Skip if already set
  if (syllabus.aircraftType) return;
  
  // Check for specific aircraft types
  for (const aircraftType of AIRCRAFT_TYPES) {
    const regex = new RegExp(`\\b${aircraftType}\\b`, 'i');
    if (regex.test(text)) {
      syllabus.aircraftType = aircraftType;
      break;
    }
  }
  
  // If not found, try a more general regex pattern
  if (!syllabus.aircraftType) {
    // Patterns like A320, B737, EMB-145, etc.
    const patterns = [
      /\b([A-Z][0-9]{2,3}(?:-[0-9]{1,3})?)\b/g,
      /\b([A-Z]-[0-9]{1,3})\b/g,
      /\b((?:Airbus|Boeing|Embraer|Bombardier|ATR)\s+[A-Z0-9\-]+)\b/ig
    ];
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        // Use the most frequent match
        const matchCounts = new Map<string, number>();
        for (const match of matches) {
          const type = match[1];
          matchCounts.set(type, (matchCounts.get(type) || 0) + 1);
        }
        
        // Find the most common
        let mostCommon = '';
        let highestCount = 0;
        for (const [type, count] of matchCounts.entries()) {
          if (count > highestCount) {
            mostCommon = type;
            highestCount = count;
          }
        }
        
        if (mostCommon) {
          syllabus.aircraftType = mostCommon;
          break;
        }
      }
    }
  }
}

/**
 * Extract modules from document
 */
function extractModules(
  extraction: ExtractionResult,
  structure: DocumentStructure | null,
  syllabus: GeneratedSyllabus,
  options: SyllabusGenerationEngineOptions
): ExtractedModule[] {
  const modules: ExtractedModule[] = [];
  
  // First, try to extract from structure if available
  if (structure) {
    extractModulesFromStructure(structure, modules, syllabus, options);
  }
  
  // If we have enough modules, return them
  if (modules.length >= (options.maxModules || 5)) {
    return modules.slice(0, options.maxModules);
  }
  
  // Otherwise, fall back to extracting from text
  extractModulesFromText(extraction.text, modules, syllabus, options);
  
  // Ensure we don't exceed the maximum number of modules
  return modules.slice(0, options.maxModules);
}

/**
 * Extract modules from document structure
 */
function extractModulesFromStructure(
  structure: DocumentStructure,
  modules: ExtractedModule[],
  syllabus: GeneratedSyllabus,
  options: SyllabusGenerationEngineOptions
): void {
  // Look for headings that might indicate modules
  const moduleHeadings = structure.elements.filter(
    el => el.type === StructureType.HEADING && 
    (el.level === 1 || el.level === 2) &&
    isModuleHeading(el.text)
  );
  
  for (const heading of moduleHeadings) {
    // Find the next content elements until the next heading of same or higher level
    const contentElements: DocumentElement[] = [];
    let nextIndex = structure.elements.indexOf(heading) + 1;
    
    while (
      nextIndex < structure.elements.length && 
      !(structure.elements[nextIndex].type === StructureType.HEADING && 
        structure.elements[nextIndex].level <= heading.level)
    ) {
      contentElements.push(structure.elements[nextIndex]);
      nextIndex++;
    }
    
    // Extract description from content
    const description = contentElements
      .filter(el => el.type === StructureType.PARAGRAPH)
      .map(el => el.text)
      .join('\n')
      .substring(0, 500);
    
    // Determine module type
    const moduleType = determineModuleType(heading.text + ' ' + description);
    
    // Extract competencies
    const competencies = extractCompetenciesFromElements(contentElements, options);
    
    // Extract regulatory requirements
    const regulatoryRequirements = extractRegulationReferencesFromElements(contentElements);
    
    // Estimate duration
    const recommendedDuration = estimateModuleDuration(moduleType, competencies.length);
    
    // Create module
    modules.push({
      name: heading.text,
      description,
      type: moduleType,
      competencies,
      recommendedDuration,
      regulatoryRequirements: regulatoryRequirements.length > 0 ? regulatoryRequirements : undefined
    });
    
    // Stop if we've reached the maximum
    if (modules.length >= (options.maxModules || 20)) {
      break;
    }
  }
}

/**
 * Extract modules from document text
 */
function extractModulesFromText(
  text: string,
  modules: ExtractedModule[],
  syllabus: GeneratedSyllabus,
  options: SyllabusGenerationEngineOptions
): void {
  // Split text into sections (potential modules)
  const sections = text.split(/\n\s*\n/);
  let currentModuleIndex = 0;
  
  for (const section of sections) {
    // Skip short sections
    if (section.length < 100) continue;
    
    // Check if the section looks like a module
    const lines = section.split('\n');
    const firstLine = lines[0].trim();
    
    if (isModuleHeading(firstLine) && firstLine.length < 100) {
      // Skip if we already have a module with this name
      if (modules.some(m => m.name === firstLine)) {
        continue;
      }
      
      // Extract description
      const description = lines.slice(1).join('\n').substring(0, 500);
      
      // Determine module type
      const moduleType = determineModuleType(section);
      
      // Extract competencies
      const competencies = extractCompetenciesFromText(section, options);
      
      // Extract regulatory requirements
      const regulatoryRequirements = extractRegulationReferencesFromText(section);
      
      // Estimate duration
      const recommendedDuration = estimateModuleDuration(moduleType, competencies.length);
      
      // Create module
      modules.push({
        name: firstLine,
        description,
        type: moduleType,
        competencies,
        recommendedDuration,
        regulatoryRequirements: regulatoryRequirements.length > 0 ? regulatoryRequirements : undefined
      });
      
      // Stop if we've reached the maximum
      if (modules.length >= (options.maxModules || 20)) {
        break;
      }
      
      currentModuleIndex++;
    }
  }
  
  // If we couldn't find enough modules, create some based on the content
  if (modules.length < 3 && currentModuleIndex < (options.maxModules || 20)) {
    createDefaultModules(text, modules, syllabus, options);
  }
}

/**
 * Create default modules based on document content
 */
function createDefaultModules(
  text: string,
  modules: ExtractedModule[],
  syllabus: GeneratedSyllabus,
  options: SyllabusGenerationEngineOptions
): void {
  // Create basic modules by type if they don't exist
  const moduleTypes = ['ground', 'simulator', 'aircraft'];
  const existingTypes = modules.map(m => m.type);
  
  for (const type of moduleTypes) {
    if (!existingTypes.includes(type)) {
      // Extract content relevant to this module type
      const relevantContent = extractRelevantContent(text, type);
      
      if (relevantContent) {
        // Create a basic module
        const module: ExtractedModule = {
          name: getDefaultModuleName(type, syllabus),
          description: relevantContent.substring(0, 500),
          type,
          competencies: extractCompetenciesFromText(relevantContent, options),
          recommendedDuration: estimateModuleDuration(type, 5)
        };
        
        modules.push(module);
      }
    }
  }
}

/**
 * Check if a heading indicates a module
 */
function isModuleHeading(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for common module indicators
  const moduleIndicators = [
    'module', 'section', 'unit', 'phase', 'block', 'part',
    'ground', 'simulator', 'aircraft', 'classroom', 'practical',
    'training', 'chapter', 'session'
  ];
  
  for (const indicator of moduleIndicators) {
    if (lowerText.includes(indicator)) {
      return true;
    }
  }
  
  // Check for numeric prefixes (like "1.", "Module 2:", etc.)
  if (/^(module|section|unit|phase|block|part)?\s*[0-9]+[\.:]\s+/i.test(text)) {
    return true;
  }
  
  return false;
}

/**
 * Determine module type based on content
 */
function determineModuleType(content: string): string {
  const lowerContent = content.toLowerCase();
  
  // Check for specific keywords
  if (lowerContent.includes('ground') || 
      lowerContent.includes('classroom') || 
      lowerContent.includes('theoretical') ||
      lowerContent.includes('theory') ||
      lowerContent.includes('academic')) {
    return 'ground';
  }
  
  if (lowerContent.includes('simulator') || 
      lowerContent.includes('simulation') || 
      lowerContent.includes('ffs') ||
      lowerContent.includes('fnpt') ||
      lowerContent.includes('flight simulation') ||
      lowerContent.includes('sim session')) {
    return 'simulator';
  }
  
  if (lowerContent.includes('aircraft') || 
      lowerContent.includes('flight') || 
      lowerContent.includes('flying') ||
      lowerContent.includes('airborne') ||
      lowerContent.includes('in-flight')) {
    return 'aircraft';
  }
  
  // If no specific indicators, default to ground
  return 'ground';
}

/**
 * Extract competencies from document elements
 */
function extractCompetenciesFromElements(
  elements: DocumentElement[],
  options: SyllabusGenerationEngineOptions
): ExtractedCompetency[] {
  const competencies: ExtractedCompetency[] = [];
  
  // Look for lists as they often contain competencies
  const lists = elements.filter(el => el.type === StructureType.LIST);
  
  for (const list of lists) {
    if (list.children) {
      for (const item of list.children) {
        if (isCompetencyStatement(item.text)) {
          // Create a new competency
          const competency: ExtractedCompetency = {
            name: item.text.substring(0, 100),
            description: item.text,
            assessmentCriteria: extractAssessmentCriteria(item)
          };
          
          // Extract regulatory reference if available
          const regulatoryRef = extractRegulationReference(item.text);
          if (regulatoryRef) {
            competency.regulatoryReference = regulatoryRef;
          }
          
          competencies.push(competency);
        }
      }
    }
  }
  
  // Also check paragraphs for competency statements
  const paragraphs = elements.filter(el => el.type === StructureType.PARAGRAPH);
  
  for (const paragraph of paragraphs) {
    if (isCompetencyStatement(paragraph.text)) {
      // Create a new competency
      const competency: ExtractedCompetency = {
        name: paragraph.text.substring(0, 100),
        description: paragraph.text,
        assessmentCriteria: []
      };
      
      // Extract regulatory reference if available
      const regulatoryRef = extractRegulationReference(paragraph.text);
      if (regulatoryRef) {
        competency.regulatoryReference = regulatoryRef;
      }
      
      competencies.push(competency);
    }
  }
  
  return competencies;
}

/**
 * Extract competencies from text
 */
function extractCompetenciesFromText(
  text: string,
  options: SyllabusGenerationEngineOptions
): ExtractedCompetency[] {
  const competencies: ExtractedCompetency[] = [];
  
  // Split text into sections (paragraphs)
  const sections = text.split(/\n\s*\n/);
  
  for (const section of sections) {
    // Skip short sections
    if (section.length < 30) continue;
    
    // Check if the section has competency indicators
    if (hasCompetencyIndicators(section)) {
      // Split into sentences
      const sentences = section.split(/\.(?:\s|$)/);
      
      for (const sentence of sentences) {
        if (isCompetencyStatement(sentence)) {
          // Create a new competency
          const competency: ExtractedCompetency = {
            name: sentence.substring(0, 100),
            description: sentence,
            assessmentCriteria: []
          };
          
          // Extract regulatory reference if available
          const regulatoryRef = extractRegulationReference(sentence);
          if (regulatoryRef) {
            competency.regulatoryReference = regulatoryRef;
          }
          
          competencies.push(competency);
        }
      }
    }
    // Check if it's a list of competencies
    else if (section.includes('\n- ') || section.includes('\n* ') || section.includes('\n• ')) {
      const listItems = section.split(/\n[-*•]\s+/);
      
      for (const item of listItems) {
        if (item.length > 10 && isCompetencyStatement(item)) {
          // Create a new competency
          const competency: ExtractedCompetency = {
            name: item.substring(0, 100),
            description: item,
            assessmentCriteria: []
          };
          
          // Extract regulatory reference if available
          const regulatoryRef = extractRegulationReference(item);
          if (regulatoryRef) {
            competency.regulatoryReference = regulatoryRef;
          }
          
          competencies.push(competency);
        }
      }
    }
  }
  
  return competencies;
}

/**
 * Check if text has competency indicators
 */
function hasCompetencyIndicators(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  for (const indicator of COMPETENCY_INDICATORS) {
    if (lowerText.includes(indicator)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a statement is a competency
 */
function isCompetencyStatement(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  const lowerText = text.toLowerCase();
  
  for (const indicator of COMPETENCY_INDICATORS) {
    if (lowerText.includes(indicator)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract assessment criteria from a list item
 */
function extractAssessmentCriteria(item: DocumentElement): string[] {
  const criteria: string[] = [];
  
  // Check if there are sub-items
  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      criteria.push(child.text);
    }
  }
  
  // If no sub-items found, try to extract from the text
  if (criteria.length === 0) {
    const matches = item.text.match(/criteria:?\s*(.+?)(?:\n|$)/i);
    if (matches && matches[1]) {
      criteria.push(matches[1]);
    }
  }
  
  return criteria;
}

/**
 * Extract regulatory reference from text
 */
function extractRegulationReference(text: string): string | undefined {
  // Look for common regulatory reference patterns
  // For example: "FAA AC 120-51E", "EASA Part-FCL.725", "ICAO Doc 9868"
  const patterns = [
    /\b([A-Z]{2,4})\s+(?:Part-)?([A-Z0-9]+(?:\.[A-Z0-9]+)*)/g,
    /\b([A-Z]{2,4})\s+(?:AC|Doc|Document)\s+([0-9]{1,5}(?:-[0-9]{1,3})?[A-Z]?)/g,
    /\bPart\s+([0-9]{1,3}[A-Z]?)\b/g
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      return matches[0][0];
    }
  }
  
  return undefined;
}

/**
 * Extract regulatory references from document elements
 */
function extractRegulationReferencesFromElements(elements: DocumentElement[]): string[] {
  const references: string[] = [];
  
  for (const element of elements) {
    const text = element.text;
    const ref = extractRegulationReference(text);
    if (ref && !references.includes(ref)) {
      references.push(ref);
    }
    
    // Check children if available
    if (element.children) {
      const childRefs = extractRegulationReferencesFromElements(element.children);
      for (const childRef of childRefs) {
        if (!references.includes(childRef)) {
          references.push(childRef);
        }
      }
    }
  }
  
  return references;
}

/**
 * Extract regulatory references from text
 */
function extractRegulationReferencesFromText(text: string): string[] {
  const references: string[] = [];
  
  // Look for common regulatory reference patterns
  const patterns = [
    /\b([A-Z]{2,4})\s+(?:Part-)?([A-Z0-9]+(?:\.[A-Z0-9]+)*)/g,
    /\b([A-Z]{2,4})\s+(?:AC|Doc|Document)\s+([0-9]{1,5}(?:-[0-9]{1,3})?[A-Z]?)/g,
    /\bPart\s+([0-9]{1,3}[A-Z]?)\b/g
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const ref = match[0];
      if (!references.includes(ref)) {
        references.push(ref);
      }
    }
  }
  
  return references;
}

/**
 * Estimate module duration based on type and complexity
 */
function estimateModuleDuration(moduleType: string, competencyCount: number): number {
  // Base duration in hours
  let baseDuration = 0;
  
  switch (moduleType) {
    case 'ground':
      baseDuration = 16; // 2 days
      break;
    case 'simulator':
      baseDuration = 12; // 3 sessions of 4 hours
      break;
    case 'aircraft':
      baseDuration = 8; // 2 flights of 4 hours
      break;
    default:
      baseDuration = 8;
  }
  
  // Adjust based on number of competencies
  const competencyFactor = Math.max(0.5, Math.min(2.0, competencyCount / 5));
  
  // Final duration
  return Math.round(baseDuration * competencyFactor);
}

/**
 * Get default module name based on type
 */
function getDefaultModuleName(moduleType: string, syllabus: GeneratedSyllabus): string {
  const programType = syllabus.programType || 'Training';
  const aircraftType = syllabus.aircraftType || 'Aircraft';
  
  switch (moduleType) {
    case 'ground':
      return `${aircraftType} ${programType} - Ground Module`;
    case 'simulator':
      return `${aircraftType} ${programType} - Simulator Module`;
    case 'aircraft':
      return `${aircraftType} ${programType} - Aircraft Module`;
    default:
      return `${aircraftType} ${programType} - ${moduleType.charAt(0).toUpperCase() + moduleType.slice(1)} Module`;
  }
}

/**
 * Extract relevant content for a module type
 */
function extractRelevantContent(text: string, moduleType: string): string {
  const lowerText = text.toLowerCase();
  
  // Keywords related to each module type
  const keywords: Record<string, string[]> = {
    ground: ['ground', 'theory', 'classroom', 'academic', 'knowledge', 'theoretical', 'study', 'concepts'],
    simulator: ['simulator', 'sim', 'ffs', 'fnpt', 'simulation', 'synthetic', 'procedures', 'maneuvers', 'practice'],
    aircraft: ['aircraft', 'flight', 'flying', 'airborne', 'practical', 'real', 'actual']
  };
  
  // Split text into paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  
  // Filter paragraphs that are relevant to the module type
  const relevantParagraphs = paragraphs.filter(paragraph => {
    const lowerPara = paragraph.toLowerCase();
    return keywords[moduleType].some(keyword => lowerPara.includes(keyword));
  });
  
  return relevantParagraphs.join('\n\n');
}

/**
 * Extract lessons from document
 */
function extractLessons(
  extraction: ExtractionResult,
  structure: DocumentStructure | null,
  modules: ExtractedModule[],
  options: SyllabusGenerationEngineOptions
): ExtractedLesson[] {
  const lessons: ExtractedLesson[] = [];
  
  // First, try to extract from structure if available
  if (structure) {
    extractLessonsFromStructure(structure, lessons, modules, options);
  }
  
  // If we don't have enough lessons, fall back to text extraction
  if (lessons.length < modules.length * 2) {
    extractLessonsFromText(extraction.text, lessons, modules, options);
  }
  
  // Create default lessons for modules with no lessons
  createDefaultLessons(lessons, modules, options);
  
  return lessons;
}

/**
 * Extract lessons from document structure
 */
function extractLessonsFromStructure(
  structure: DocumentStructure,
  lessons: ExtractedLesson[],
  modules: ExtractedModule[],
  options: SyllabusGenerationEngineOptions
): void {
  // Look for headings that might indicate lessons
  const lessonHeadings = structure.elements.filter(
    el => el.type === StructureType.HEADING && 
    (el.level === 2 || el.level === 3) &&
    isLessonHeading(el.text)
  );
  
  for (const heading of lessonHeadings) {
    // Find the next content elements until the next heading of same or higher level
    const contentElements: DocumentElement[] = [];
    let nextIndex = structure.elements.indexOf(heading) + 1;
    
    while (
      nextIndex < structure.elements.length && 
      !(structure.elements[nextIndex].type === StructureType.HEADING && 
        structure.elements[nextIndex].level <= heading.level)
    ) {
      contentElements.push(structure.elements[nextIndex]);
      nextIndex++;
    }
    
    // Extract description and content
    const description = contentElements
      .filter(el => el.type === StructureType.PARAGRAPH)
      .map(el => el.text)
      .join('\n')
      .substring(0, 200);
    
    const content = contentElements
      .map(el => el.text)
      .join('\n')
      .substring(0, 1000);
    
    // Determine lesson type
    const lessonType = determineLessonType(heading.text + ' ' + content);
    
    // Determine which module this lesson belongs to
    const moduleIndex = findBestModuleForLesson(heading.text + ' ' + content, modules);
    
    // Extract learning objectives
    const learningObjectives = extractLearningObjectives(contentElements);
    
    // Estimate duration
    const duration = estimateLessonDuration(lessonType, content.length);
    
    // Create lesson
    lessons.push({
      name: heading.text,
      description,
      content,
      type: lessonType,
      moduleIndex,
      duration,
      learningObjectives
    });
    
    // Stop if we've reached the maximum for this module
    const lessonsInModule = lessons.filter(l => l.moduleIndex === moduleIndex);
    if (lessonsInModule.length >= (options.maxLessonsPerModule || 15)) {
      continue;
    }
  }
}

/**
 * Extract lessons from document text
 */
function extractLessonsFromText(
  text: string,
  lessons: ExtractedLesson[],
  modules: ExtractedModule[],
  options: SyllabusGenerationEngineOptions
): void {
  // Split text into sections (potential lessons)
  const sections = text.split(/\n\s*\n/);
  
  for (const section of sections) {
    // Skip short sections
    if (section.length < 100) continue;
    
    // Check if the section looks like a lesson
    const lines = section.split('\n');
    const firstLine = lines[0].trim();
    
    if (isLessonHeading(firstLine) && firstLine.length < 100) {
      // Skip if we already have a lesson with this name
      if (lessons.some(l => l.name === firstLine)) {
        continue;
      }
      
      // Extract description and content
      const description = lines.slice(1, 3).join('\n').substring(0, 200);
      const content = lines.slice(1).join('\n').substring(0, 1000);
      
      // Determine lesson type
      const lessonType = determineLessonType(section);
      
      // Determine which module this lesson belongs to
      const moduleIndex = findBestModuleForLesson(section, modules);
      
      // Extract learning objectives
      const learningObjectives = extractLearningObjectivesFromText(section);
      
      // Estimate duration
      const duration = estimateLessonDuration(lessonType, content.length);
      
      // Create lesson
      lessons.push({
        name: firstLine,
        description,
        content,
        type: lessonType,
        moduleIndex,
        duration,
        learningObjectives
      });
      
      // Stop if we've reached the maximum for this module
      const lessonsInModule = lessons.filter(l => l.moduleIndex === moduleIndex);
      if (lessonsInModule.length >= (options.maxLessonsPerModule || 15)) {
        continue;
      }
    }
  }
}

/**
 * Create default lessons for modules with no lessons
 */
function createDefaultLessons(
  lessons: ExtractedLesson[],
  modules: ExtractedModule[],
  options: SyllabusGenerationEngineOptions
): void {
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const lessonsInModule = lessons.filter(l => l.moduleIndex === i);
    
    // If the module has no lessons, create default ones
    if (lessonsInModule.length === 0) {
      // Create a default introduction lesson
      lessons.push({
        name: `Introduction to ${module.name}`,
        description: `Introduction to the concepts covered in the ${module.name} module`,
        content: module.description,
        type: 'document',
        moduleIndex: i,
        duration: 60,
        learningObjectives: ['Understand the core concepts of this module', 'Identify key learning areas']
      });
      
      // Create lessons for each competency
      for (let j = 0; j < Math.min(module.competencies.length, 5); j++) {
        const competency = module.competencies[j];
        
        lessons.push({
          name: competency.name.substring(0, 100),
          description: competency.description.substring(0, 200),
          content: competency.description,
          type: determineLessonTypeFromModule(module.type),
          moduleIndex: i,
          duration: 90,
          learningObjectives: competency.assessmentCriteria.length > 0 
            ? competency.assessmentCriteria 
            : ['Master the competency', 'Demonstrate proficiency']
        });
      }
      
      // Create an assessment lesson
      lessons.push({
        name: `Assessment - ${module.name}`,
        description: `Assessment of competencies covered in the ${module.name} module`,
        content: `This lesson assesses the trainee's understanding and proficiency in the competencies covered in the ${module.name} module.`,
        type: 'assessment',
        moduleIndex: i,
        duration: 120,
        learningObjectives: ['Demonstrate proficiency in all module competencies']
      });
    }
  }
}

/**
 * Check if a heading indicates a lesson
 */
function isLessonHeading(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for common lesson indicators
  const lessonIndicators = [
    'lesson', 'topic', 'session', 'class', 'subject',
    'lecture', 'exercise', 'task', 'activity', 'objective',
    'demonstration', 'practice', 'review'
  ];
  
  for (const indicator of lessonIndicators) {
    if (lowerText.includes(indicator)) {
      return true;
    }
  }
  
  // Check for numeric prefixes (like "1.1", "Lesson 2:", etc.)
  if (/^(lesson|topic)?\s*[0-9]+\.[0-9]+[\.:]\s+/i.test(text)) {
    return true;
  }
  
  return false;
}

/**
 * Determine lesson type based on content
 */
function determineLessonType(content: string): string {
  const lowerContent = content.toLowerCase();
  
  // Check for specific keywords
  if (lowerContent.includes('video') || 
      lowerContent.includes('watch') || 
      lowerContent.includes('demonstration')) {
    return 'video';
  }
  
  if (lowerContent.includes('interactive') || 
      lowerContent.includes('exercise') || 
      lowerContent.includes('simulation') ||
      lowerContent.includes('practice')) {
    return 'interactive';
  }
  
  if (lowerContent.includes('assessment') || 
      lowerContent.includes('exam') || 
      lowerContent.includes('test') ||
      lowerContent.includes('evaluation')) {
    return 'assessment';
  }
  
  if (lowerContent.includes('presentation') || 
      lowerContent.includes('slides') || 
      lowerContent.includes('slideshow')) {
    return 'presentation';
  }
  
  // Default to document
  return 'document';
}

/**
 * Find the best module for a lesson based on content similarity
 */
function findBestModuleForLesson(content: string, modules: ExtractedModule[]): number {
  // Default to the first module
  if (modules.length === 0) return 0;
  
  let bestModuleIndex = 0;
  let highestSimilarity = 0;
  
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    
    // Calculate similarity score
    const similarity = calculateContentSimilarity(
      content.toLowerCase(),
      (module.name + ' ' + module.description).toLowerCase()
    );
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestModuleIndex = i;
    }
  }
  
  return bestModuleIndex;
}

/**
 * Calculate content similarity between two texts
 */
function calculateContentSimilarity(text1: string, text2: string): number {
  // Simple Jaccard similarity of words
  const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  // Calculate intersection
  const intersection = new Set<string>();
  for (const word of words1) {
    if (words2.has(word)) {
      intersection.add(word);
    }
  }
  
  // Calculate Jaccard similarity
  return intersection.size / (words1.size + words2.size - intersection.size);
}

/**
 * Extract learning objectives from document elements
 */
function extractLearningObjectives(elements: DocumentElement[]): string[] {
  const objectives: string[] = [];
  
  // Look for lists that might contain objectives
  const lists = elements.filter(
    el => el.type === StructureType.LIST && 
    hasLearningObjectiveIndicators(el.text)
  );
  
  for (const list of lists) {
    if (list.children) {
      for (const item of list.children) {
        objectives.push(item.text);
      }
    }
  }
  
  // Check paragraphs for learning objectives
  const paragraphs = elements.filter(
    el => el.type === StructureType.PARAGRAPH && 
    hasLearningObjectiveIndicators(el.text)
  );
  
  for (const paragraph of paragraphs) {
    // Extract sentences that look like objectives
    const sentences = paragraph.text.split(/\.(?:\s|$)/);
    
    for (const sentence of sentences) {
      if (sentence.length > 10 && isLearningObjective(sentence)) {
        objectives.push(sentence.trim());
      }
    }
  }
  
  return objectives;
}

/**
 * Extract learning objectives from text
 */
function extractLearningObjectivesFromText(text: string): string[] {
  const objectives: string[] = [];
  
  // Look for sections that contain learning objectives
  const sections = text.split(/\n\s*\n/);
  
  for (const section of sections) {
    if (hasLearningObjectiveIndicators(section)) {
      // Check if it's a list
      if (section.includes('\n- ') || section.includes('\n* ') || section.includes('\n• ')) {
        const items = section.split(/\n[-*•]\s+/);
        
        for (const item of items) {
          if (item.length > 10 && isLearningObjective(item)) {
            objectives.push(item.trim());
          }
        }
      } else {
        // Extract sentences that look like objectives
        const sentences = section.split(/\.(?:\s|$)/);
        
        for (const sentence of sentences) {
          if (sentence.length > 10 && isLearningObjective(sentence)) {
            objectives.push(sentence.trim());
          }
        }
      }
    }
  }
  
  return objectives;
}

/**
 * Check if text has learning objective indicators
 */
function hasLearningObjectiveIndicators(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  for (const indicator of LEARNING_OBJECTIVE_INDICATORS) {
    if (lowerText.includes(indicator)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a statement is a learning objective
 */
function isLearningObjective(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  const lowerText = text.toLowerCase();
  
  // Check for common objective verbs
  const objectiveVerbs = [
    'identify', 'describe', 'explain', 'define', 'list', 'demonstrate',
    'analyze', 'evaluate', 'create', 'apply', 'understand', 'recognize',
    'perform', 'calculate', 'solve', 'use', 'implement', 'develop',
    'operate', 'conduct', 'maintain'
  ];
  
  for (const verb of objectiveVerbs) {
    if (lowerText.includes(`${verb} `)) {
      return true;
    }
  }
  
  // Check for learning objective indicators
  for (const indicator of LEARNING_OBJECTIVE_INDICATORS) {
    if (lowerText.includes(indicator)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Determine lesson type based on module type
 */
function determineLessonTypeFromModule(moduleType: string): string {
  switch (moduleType) {
    case 'ground':
      return 'document';
    case 'simulator':
      return 'interactive';
    case 'aircraft':
      return 'interactive';
    default:
      return 'document';
  }
}

/**
 * Estimate lesson duration in minutes
 */
function estimateLessonDuration(lessonType: string, contentLength: number): number {
  // Base duration in minutes
  let baseDuration = 0;
  
  switch (lessonType) {
    case 'video':
      baseDuration = 20;
      break;
    case 'document':
      baseDuration = 45;
      break;
    case 'interactive':
      baseDuration = 60;
      break;
    case 'presentation':
      baseDuration = 30;
      break;
    case 'assessment':
      baseDuration = 45;
      break;
    default:
      baseDuration = 30;
  }
  
  // Adjust based on content length
  const lengthFactor = Math.max(0.5, Math.min(2.0, contentLength / 500));
  
  // Final duration
  return Math.round(baseDuration * lengthFactor);
}

/**
 * Extract regulatory references from document
 */
function extractRegulatoryReferences(text: string, syllabus: GeneratedSyllabus): void {
  // Detect regulatory authority
  detectRegulatoryAuthority(text, syllabus);
  
  // If we identified an authority, extract references
  if (syllabus.regulatoryAuthority) {
    syllabus.regulatoryCompliance.authority = syllabus.regulatoryAuthority;
  }
}

/**
 * Detect regulatory authority in document
 */
function detectRegulatoryAuthority(text: string, syllabus: GeneratedSyllabus): void {
  const lowerText = text.toLowerCase();
  
  // Check for specific authorities
  for (const authority of REGULATORY_AUTHORITIES) {
    // Check for full name
    if (lowerText.includes(authority.name.toLowerCase())) {
      syllabus.regulatoryAuthority = authority.code;
      return;
    }
    
    // Check for code
    const regex = new RegExp(`\\b${authority.code}\\b`, 'i');
    if (regex.test(text)) {
      syllabus.regulatoryAuthority = authority.code;
      return;
    }
  }
  
  // If no specific authority found, try to identify from patterns
  if (lowerText.includes('part-fcl') || lowerText.includes('part fcl')) {
    syllabus.regulatoryAuthority = 'EASA';
  } else if (lowerText.includes('far part') || lowerText.includes('14 cfr')) {
    syllabus.regulatoryAuthority = 'FAA';
  } else if (lowerText.includes('annex 1') || lowerText.includes('doc 9841')) {
    syllabus.regulatoryAuthority = 'ICAO';
  }
}

/**
 * Map syllabus content to regulatory requirements
 */
async function mapRegulatoryRequirements(syllabus: GeneratedSyllabus): Promise<void> {
  // Get regulatory requirements from database
  const authority = syllabus.regulatoryCompliance.authority;
  if (!authority) return;
  
  try {
    const requirements = await storage.getAllRegulatoryRequirements(authority);
    
    // Collect all competencies and their descriptions
    const competencyTexts: string[] = [];
    for (const module of syllabus.modules) {
      for (const competency of module.competencies) {
        competencyTexts.push(competency.description);
      }
    }
    
    // Map requirements to syllabus content
    const requirementsMet: RegulatoryReference[] = [];
    const requirementsPartiallyMet: RegulatoryReference[] = [];
    const requirementsNotMet: RegulatoryReference[] = [];
    
    for (const req of requirements) {
      // Convert to RegulatoryReference format
      const reference: RegulatoryReference = {
        code: req.code,
        authority: req.authority,
        version: req.version || '1.0',
        description: req.description,
        url: req.referenceUrl || undefined,
        effectiveDate: req.effectiveDate ? new Date(req.effectiveDate) : undefined
      };
      
      // Check if the requirement is met
      let isMet = false;
      let isPartiallyMet = false;
      
      // Check if explicitly referenced in regulatory references
      for (const module of syllabus.modules) {
        if (module.regulatoryRequirements && module.regulatoryRequirements.some(r => r.includes(req.code))) {
          isMet = true;
          break;
        }
      }
      
      // If not explicitly referenced, check competencies for content matches
      if (!isMet) {
        let matches = 0;
        for (const text of competencyTexts) {
          if (text.includes(req.code) || calculateContentSimilarity(text, req.description) > 0.7) {
            matches++;
          }
        }
        
        if (matches > 0) {
          isPartiallyMet = true;
        }
      }
      
      // Categorize the requirement
      if (isMet) {
        requirementsMet.push(reference);
      } else if (isPartiallyMet) {
        requirementsPartiallyMet.push(reference);
      } else {
        requirementsNotMet.push(reference);
      }
    }
    
    // Update syllabus
    syllabus.regulatoryCompliance.requirementsMet = requirementsMet;
    syllabus.regulatoryCompliance.requirementsPartiallyMet = requirementsPartiallyMet;
    syllabus.regulatoryCompliance.requirementsNotMet = requirementsNotMet;
  } catch (error) {
    logger.error('Error mapping regulatory requirements', { error, authority });
  }
}

/**
 * Calculate total duration of the syllabus in days
 */
function calculateTotalDuration(syllabus: GeneratedSyllabus): void {
  let totalHours = 0;
  
  // Sum module durations
  for (const module of syllabus.modules) {
    totalHours += module.recommendedDuration;
  }
  
  // Convert to days (8 hours per day)
  syllabus.totalDuration = Math.ceil(totalHours / 8);
}

/**
 * Calculate confidence score for the generated syllabus
 */
function calculateConfidenceScore(syllabus: GeneratedSyllabus): number {
  // Base confidence
  let confidence = 0.5;
  
  // Adjust based on modules
  if (syllabus.modules.length > 0) {
    confidence += 0.05 * Math.min(syllabus.modules.length, 5) / 5;
  }
  
  // Adjust based on lessons
  if (syllabus.lessons.length > 0) {
    confidence += 0.05 * Math.min(syllabus.lessons.length, 20) / 20;
  }
  
  // Adjust based on competencies
  let totalCompetencies = 0;
  for (const module of syllabus.modules) {
    totalCompetencies += module.competencies.length;
  }
  confidence += 0.1 * Math.min(totalCompetencies, 30) / 30;
  
  // Adjust based on regulatory references
  if (syllabus.regulatoryAuthority) {
    confidence += 0.1;
    
    const totalRequirements = 
      syllabus.regulatoryCompliance.requirementsMet.length + 
      syllabus.regulatoryCompliance.requirementsPartiallyMet.length + 
      syllabus.regulatoryCompliance.requirementsNotMet.length;
    
    if (totalRequirements > 0) {
      const metRatio = syllabus.regulatoryCompliance.requirementsMet.length / totalRequirements;
      confidence += 0.1 * metRatio;
    }
  }
  
  // Adjust based on aircraft type and program type
  if (syllabus.aircraftType) confidence += 0.05;
  if (syllabus.programType) confidence += 0.05;
  
  return Math.min(1.0, confidence);
}

/**
 * Build knowledge graph representation of the syllabus
 */
function buildKnowledgeGraph(syllabus: GeneratedSyllabus): {
  nodes: Array<{id: string, type: string, content: string}>;
  edges: Array<{source: string, target: string, relationship: string}>;
} {
  const nodes: Array<{id: string, type: string, content: string}> = [];
  const edges: Array<{source: string, target: string, relationship: string}> = [];
  
  // Add syllabus node
  const syllabusNodeId = 'syllabus';
  nodes.push({
    id: syllabusNodeId,
    type: 'syllabus',
    content: syllabus.name
  });
  
  // Add module nodes
  for (let i = 0; i < syllabus.modules.length; i++) {
    const module = syllabus.modules[i];
    const moduleNodeId = `module_${i}`;
    
    nodes.push({
      id: moduleNodeId,
      type: 'module',
      content: module.name
    });
    
    // Connect to syllabus
    edges.push({
      source: syllabusNodeId,
      target: moduleNodeId,
      relationship: 'contains'
    });
    
    // Add competency nodes
    for (let j = 0; j < module.competencies.length; j++) {
      const competency = module.competencies[j];
      const competencyNodeId = `competency_${i}_${j}`;
      
      nodes.push({
        id: competencyNodeId,
        type: 'competency',
        content: competency.name
      });
      
      // Connect to module
      edges.push({
        source: moduleNodeId,
        target: competencyNodeId,
        relationship: 'requires'
      });
    }
  }
  
  // Add lesson nodes
  for (let i = 0; i < syllabus.lessons.length; i++) {
    const lesson = syllabus.lessons[i];
    const lessonNodeId = `lesson_${i}`;
    
    nodes.push({
      id: lessonNodeId,
      type: 'lesson',
      content: lesson.name
    });
    
    // Connect to module
    if (lesson.moduleIndex >= 0 && lesson.moduleIndex < syllabus.modules.length) {
      const moduleNodeId = `module_${lesson.moduleIndex}`;
      
      edges.push({
        source: moduleNodeId,
        target: lessonNodeId,
        relationship: 'contains'
      });
    }
    
    // Connect to learning objectives
    for (let j = 0; j < lesson.learningObjectives.length; j++) {
      const objective = lesson.learningObjectives[j];
      const objectiveNodeId = `objective_${i}_${j}`;
      
      nodes.push({
        id: objectiveNodeId,
        type: 'objective',
        content: objective
      });
      
      // Connect to lesson
      edges.push({
        source: lessonNodeId,
        target: objectiveNodeId,
        relationship: 'teaches'
      });
    }
  }
  
  return { nodes, edges };
}