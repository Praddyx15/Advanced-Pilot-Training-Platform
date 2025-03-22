/**
 * Document Classification Service
 * 
 * Provides content classification capabilities for documents:
 * - Category classification (technical, regulatory, operational, etc.)
 * - Subject matter identification (aircraft systems, procedures, regulations)
 * - Importance/priority ranking
 * - Content tagging
 * - Document relation clustering
 */
import { ExtractionResult } from './document-extraction';
import { DocumentElement, DocumentStructure } from './document-structure';
import { logger } from '../core/logger';

// Classification categories
export enum DocumentCategory {
  TECHNICAL = 'technical',
  REGULATORY = 'regulatory',
  OPERATIONAL = 'operational',
  TRAINING = 'training',
  ASSESSMENT = 'assessment',
  REFERENCE = 'reference',
  UNCLASSIFIED = 'unclassified'
}

// Subject areas
export enum SubjectArea {
  AIRCRAFT_SYSTEMS = 'aircraft_systems',
  FLIGHT_PROCEDURES = 'flight_procedures',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  REGULATIONS = 'regulations',
  METEOROLOGY = 'meteorology',
  NAVIGATION = 'navigation',
  HUMAN_FACTORS = 'human_factors',
  COMMUNICATIONS = 'communications',
  GENERAL = 'general'
}

// Priority levels
export enum PriorityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Classification result
export interface DocumentClassification {
  category: DocumentCategory;
  subjects: SubjectArea[];
  priority: PriorityLevel;
  tags: string[];
  confidence: number;
  relatedDocumentIds?: number[];
  metadata: {
    keyTerms: Record<string, number>; // term -> frequency
    regulatoryReferences?: string[];
    aircraftTypes?: string[];
    processingTime: number;
  };
}

// Classification options
export interface ClassificationOptions {
  includeRelatedDocuments?: boolean;
  maxRelatedDocuments?: number;
  minConfidenceThreshold?: number;
  includeRegExPatterns?: Record<string, RegExp>;
  includeKeyTerms?: boolean;
}

// Default classification options
const DEFAULT_OPTIONS: ClassificationOptions = {
  includeRelatedDocuments: true,
  maxRelatedDocuments: 5,
  minConfidenceThreshold: 0.6,
  includeKeyTerms: true
};

// Term weighting by category
const CATEGORY_TERM_WEIGHTS: Record<DocumentCategory, string[]> = {
  [DocumentCategory.TECHNICAL]: [
    'system', 'component', 'aircraft', 'equipment', 'technical', 'installation',
    'maintenance', 'specifications', 'design', 'performance', 'limitations'
  ],
  [DocumentCategory.REGULATORY]: [
    'regulation', 'compliance', 'requirement', 'approved', 'authority', 'legal',
    'certification', 'standard', 'rule', 'law', 'mandatory', 'must', 'shall'
  ],
  [DocumentCategory.OPERATIONAL]: [
    'procedure', 'operation', 'checklist', 'normal', 'abnormal', 'emergency',
    'flight', 'crew', 'pilot', 'operator', 'controller', 'maneuver'
  ],
  [DocumentCategory.TRAINING]: [
    'training', 'learning', 'syllabus', 'course', 'lesson', 'module', 'instructor',
    'student', 'trainee', 'exercise', 'simulation', 'practice', 'skill'
  ],
  [DocumentCategory.ASSESSMENT]: [
    'assessment', 'test', 'exam', 'evaluation', 'grade', 'score', 'performance',
    'measure', 'criteria', 'standard', 'pass', 'fail', 'proficiency'
  ],
  [DocumentCategory.REFERENCE]: [
    'reference', 'manual', 'handbook', 'guide', 'information', 'data', 'table',
    'chart', 'appendix', 'glossary', 'definition', 'term'
  ],
  [DocumentCategory.UNCLASSIFIED]: []
};

// Subject area term weighting
const SUBJECT_TERM_WEIGHTS: Record<SubjectArea, string[]> = {
  [SubjectArea.AIRCRAFT_SYSTEMS]: [
    'engine', 'hydraulic', 'electrical', 'avionics', 'fuel', 'landing gear',
    'flight control', 'pressurization', 'air conditioning', 'system', 'components'
  ],
  [SubjectArea.FLIGHT_PROCEDURES]: [
    'procedure', 'takeoff', 'landing', 'cruise', 'climb', 'descent', 'approach',
    'maneuver', 'configuration', 'speed', 'altitude', 'flight plan'
  ],
  [SubjectArea.EMERGENCY_PROCEDURES]: [
    'emergency', 'failure', 'malfunction', 'abort', 'evacuation', 'fire', 'smoke',
    'decompression', 'ditching', 'abnormal', 'warning', 'caution', 'alert'
  ],
  [SubjectArea.REGULATIONS]: [
    'regulation', 'requirement', 'law', 'compliance', 'authority', 'certificate',
    'license', 'approval', 'standard', 'rule', 'part', 'paragraph'
  ],
  [SubjectArea.METEOROLOGY]: [
    'weather', 'wind', 'cloud', 'visibility', 'temperature', 'pressure', 'forecast',
    'turbulence', 'thunderstorm', 'icing', 'fog', 'precipitation'
  ],
  [SubjectArea.NAVIGATION]: [
    'navigation', 'waypoint', 'route', 'course', 'heading', 'track', 'bearing',
    'distance', 'gps', 'vor', 'ils', 'approach', 'departure', 'arrival'
  ],
  [SubjectArea.HUMAN_FACTORS]: [
    'human factors', 'crew resource management', 'crm', 'workload', 'fatigue',
    'stress', 'decision making', 'situational awareness', 'communication', 'teamwork'
  ],
  [SubjectArea.COMMUNICATIONS]: [
    'communication', 'radio', 'phraseology', 'clearance', 'readback', 'frequency',
    'call sign', 'transmission', 'atc', 'controller', 'message'
  ],
  [SubjectArea.GENERAL]: [
    'general', 'introduction', 'overview', 'purpose', 'scope', 'description',
    'summary', 'background', 'information', 'note'
  ]
};

// Priority term weighting
const PRIORITY_TERM_WEIGHTS: Record<PriorityLevel, string[]> = {
  [PriorityLevel.CRITICAL]: [
    'warning', 'caution', 'danger', 'emergency', 'critical', 'immediate', 'severe',
    'must', 'required', 'mandatory', 'essential', 'life', 'safety'
  ],
  [PriorityLevel.HIGH]: [
    'important', 'significant', 'major', 'key', 'primary', 'main', 'serious',
    'necessary', 'should', 'recommended', 'advised'
  ],
  [PriorityLevel.MEDIUM]: [
    'normal', 'standard', 'regular', 'routine', 'common', 'typical', 'general',
    'suggested', 'considered'
  ],
  [PriorityLevel.LOW]: [
    'minor', 'supplementary', 'additional', 'optional', 'reference', 'may',
    'can', 'could', 'might', 'note', 'information'
  ]
};

// Regex patterns for identifying specific content
const REGEX_PATTERNS = {
  regulatoryReference: /([A-Z]{2,4}[-|\s]?[0-9]{1,4}[A-Z]?|Part\s[0-9]{1,4})/gi,
  aircraftType: /([A-Z]{1,2}[-|\s]?[0-9]{1,4}[A-Z]?|\b[A-Z][a-z]+\s[0-9]{2,3}[-|\/]?[0-9]{0,3})/g,
  version: /(?:Rev(?:ision)?|Ver(?:sion)?)[.\s]([0-9]+(?:[.][0-9]+)*)/i,
  date: /(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+[0-9]{1,2},?\s+[0-9]{4}\b|\b[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}\b)/i
};

/**
 * Main function to classify document content
 */
export async function classifyDocument(
  document: { text: string } | ExtractionResult | DocumentStructure,
  options: ClassificationOptions = DEFAULT_OPTIONS
): Promise<DocumentClassification> {
  const startTime = Date.now();
  
  try {
    // Extract text based on input type
    const text = extractText(document);
    
    // Tokenize and preprocess text
    const tokens = tokenizeText(text);
    
    // Calculate term frequencies
    const termFrequencies = calculateTermFrequencies(tokens);
    
    // Determine document category
    const categoryScores = calculateCategoryScores(termFrequencies);
    const category = determineTopCategory(categoryScores);
    
    // Determine subject areas
    const subjectScores = calculateSubjectScores(termFrequencies);
    const subjects = determineTopSubjects(subjectScores, 3);
    
    // Determine priority
    const priorityScores = calculatePriorityScores(termFrequencies);
    const priority = determineTopPriority(priorityScores);
    
    // Extract tags
    const tags = extractTags(termFrequencies, text, category, subjects);
    
    // Extract regulatory references if applicable
    const regulatoryReferences = options.includeRegExPatterns !== false ? 
      extractRegexMatches(text, REGEX_PATTERNS.regulatoryReference) : [];
    
    // Extract aircraft types if applicable
    const aircraftTypes = options.includeRegExPatterns !== false ?
      extractRegexMatches(text, REGEX_PATTERNS.aircraftType) : [];
    
    // Calculate confidence score
    const confidence = calculateConfidenceScore(categoryScores, subjectScores, priorityScores);
    
    // Create classification result
    const classification: DocumentClassification = {
      category,
      subjects,
      priority,
      tags,
      confidence,
      metadata: {
        keyTerms: options.includeKeyTerms ? extractKeyTerms(termFrequencies) : {},
        regulatoryReferences: regulatoryReferences.length > 0 ? regulatoryReferences : undefined,
        aircraftTypes: aircraftTypes.length > 0 ? aircraftTypes : undefined,
        processingTime: Date.now() - startTime
      }
    };
    
    return classification;
  } catch (error) {
    logger.error('Error during document classification', { error });
    
    // Return a default classification with low confidence
    return {
      category: DocumentCategory.UNCLASSIFIED,
      subjects: [SubjectArea.GENERAL],
      priority: PriorityLevel.MEDIUM,
      tags: [],
      confidence: 0.1,
      metadata: {
        keyTerms: {},
        processingTime: Date.now() - startTime
      }
    };
  }
}

/**
 * Extract text from different document formats
 */
function extractText(document: { text: string } | ExtractionResult | DocumentStructure): string {
  if ('text' in document) {
    return document.text;
  } else if ('elements' in document) {
    // If it's a DocumentStructure, concatenate all element texts
    return document.elements.map(element => element.text).join(' ');
  }
  return '';
}

/**
 * Tokenize text into words
 */
function tokenizeText(text: string): string[] {
  // Convert to lowercase and split by non-alphanumeric characters
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2) // Filter out short tokens
    .filter(token => !isStopWord(token)); // Filter out stop words
}

/**
 * Check if a word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
    'at', 'from', 'by', 'on', 'off', 'for', 'in', 'out', 'over', 'to', 
    'into', 'with', 'about', 'against', 'between', 'during', 'without',
    'before', 'after', 'above', 'below', 'up', 'down', 'this', 'that',
    'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
    'should', 'can', 'could', 'may', 'might', 'must', 'of', 'also', 'as',
    'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom',
    'whose', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very'
  ];
  return stopWords.includes(word);
}

/**
 * Calculate term frequencies from tokens
 */
function calculateTermFrequencies(tokens: string[]): Record<string, number> {
  const frequencies: Record<string, number> = {};
  tokens.forEach(token => {
    frequencies[token] = (frequencies[token] || 0) + 1;
  });
  return frequencies;
}

/**
 * Calculate category scores based on term frequencies
 */
function calculateCategoryScores(termFrequencies: Record<string, number>): Record<DocumentCategory, number> {
  const scores: Record<DocumentCategory, number> = {
    [DocumentCategory.TECHNICAL]: 0,
    [DocumentCategory.REGULATORY]: 0,
    [DocumentCategory.OPERATIONAL]: 0,
    [DocumentCategory.TRAINING]: 0,
    [DocumentCategory.ASSESSMENT]: 0,
    [DocumentCategory.REFERENCE]: 0,
    [DocumentCategory.UNCLASSIFIED]: 0
  };
  
  // Score each category based on term weights
  Object.entries(CATEGORY_TERM_WEIGHTS).forEach(([category, terms]) => {
    terms.forEach(term => {
      // Check for exact match first
      if (termFrequencies[term]) {
        scores[category as DocumentCategory] += termFrequencies[term] * 2;
      }
      
      // Check for partial matches (terms containing this term)
      Object.entries(termFrequencies).forEach(([token, frequency]) => {
        if (token.includes(term) && token !== term) {
          scores[category as DocumentCategory] += frequency;
        }
      });
    });
  });
  
  return scores;
}

/**
 * Determine the top category based on scores
 */
function determineTopCategory(scores: Record<DocumentCategory, number>): DocumentCategory {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category as DocumentCategory)[0] || DocumentCategory.UNCLASSIFIED;
}

/**
 * Calculate subject scores based on term frequencies
 */
function calculateSubjectScores(termFrequencies: Record<string, number>): Record<SubjectArea, number> {
  const scores: Record<SubjectArea, number> = {
    [SubjectArea.AIRCRAFT_SYSTEMS]: 0,
    [SubjectArea.FLIGHT_PROCEDURES]: 0,
    [SubjectArea.EMERGENCY_PROCEDURES]: 0,
    [SubjectArea.REGULATIONS]: 0,
    [SubjectArea.METEOROLOGY]: 0,
    [SubjectArea.NAVIGATION]: 0,
    [SubjectArea.HUMAN_FACTORS]: 0,
    [SubjectArea.COMMUNICATIONS]: 0,
    [SubjectArea.GENERAL]: 0
  };
  
  // Score each subject area based on term weights
  Object.entries(SUBJECT_TERM_WEIGHTS).forEach(([subject, terms]) => {
    terms.forEach(term => {
      // Some terms may be multi-word phrases
      const phraseWords = term.toLowerCase().split(/\s+/);
      
      if (phraseWords.length > 1) {
        // For multi-word phrases, check if all words are present
        let allWordsPresent = true;
        let totalFrequency = 0;
        
        phraseWords.forEach(word => {
          if (!termFrequencies[word]) {
            allWordsPresent = false;
          } else {
            totalFrequency += termFrequencies[word];
          }
        });
        
        if (allWordsPresent) {
          scores[subject as SubjectArea] += totalFrequency / phraseWords.length * 2;
        }
      } else {
        // Single word term
        if (termFrequencies[term]) {
          scores[subject as SubjectArea] += termFrequencies[term] * 2;
        }
        
        // Check for partial matches (terms containing this term)
        Object.entries(termFrequencies).forEach(([token, frequency]) => {
          if (token.includes(term) && token !== term) {
            scores[subject as SubjectArea] += frequency;
          }
        });
      }
    });
  });
  
  return scores;
}

/**
 * Determine the top subject areas based on scores
 */
function determineTopSubjects(scores: Record<SubjectArea, number>, limit: number = 3): SubjectArea[] {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .filter(([_, score]) => score > 0)
    .map(([subject]) => subject as SubjectArea);
}

/**
 * Calculate priority scores based on term frequencies
 */
function calculatePriorityScores(termFrequencies: Record<string, number>): Record<PriorityLevel, number> {
  const scores: Record<PriorityLevel, number> = {
    [PriorityLevel.CRITICAL]: 0,
    [PriorityLevel.HIGH]: 0,
    [PriorityLevel.MEDIUM]: 0,
    [PriorityLevel.LOW]: 0
  };
  
  // Score each priority level based on term weights
  Object.entries(PRIORITY_TERM_WEIGHTS).forEach(([priority, terms]) => {
    terms.forEach(term => {
      if (termFrequencies[term]) {
        scores[priority as PriorityLevel] += termFrequencies[term] * 2;
      }
      
      // Check for partial matches (terms containing this term)
      Object.entries(termFrequencies).forEach(([token, frequency]) => {
        if (token.includes(term) && token !== term) {
          scores[priority as PriorityLevel] += frequency;
        }
      });
    });
  });
  
  return scores;
}

/**
 * Determine the top priority based on scores
 */
function determineTopPriority(scores: Record<PriorityLevel, number>): PriorityLevel {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([priority]) => priority as PriorityLevel)[0] || PriorityLevel.MEDIUM;
}

/**
 * Extract tags from term frequencies and other metadata
 */
function extractTags(
  termFrequencies: Record<string, number>,
  text: string,
  category: DocumentCategory,
  subjects: SubjectArea[]
): string[] {
  // Get top terms by frequency
  const topTerms = Object.entries(termFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([term]) => term);
  
  // Add category and subjects as tags
  const tags = [
    category.toLowerCase(),
    ...subjects.map(subject => subject.toLowerCase().replace(/_/g, '-'))
  ];
  
  // Extract aircraft types
  const aircraftTypes = extractRegexMatches(text, REGEX_PATTERNS.aircraftType);
  
  // Extract regulatory references
  const regulations = extractRegexMatches(text, REGEX_PATTERNS.regulatoryReference);
  
  // Combine all tags
  return [...new Set([
    ...tags,
    ...topTerms.slice(0, 5),
    ...aircraftTypes.slice(0, 3),
    ...regulations.slice(0, 3)
  ])];
}

/**
 * Extract matches from text using a regex pattern
 */
function extractRegexMatches(text: string, pattern: RegExp): string[] {
  const matches = text.match(pattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Extract key terms from term frequencies
 */
function extractKeyTerms(termFrequencies: Record<string, number>): Record<string, number> {
  return Object.entries(termFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .reduce((obj, [term, freq]) => ({...obj, [term]: freq}), {});
}

/**
 * Calculate the overall confidence score
 */
function calculateConfidenceScore(
  categoryScores: Record<DocumentCategory, number>,
  subjectScores: Record<SubjectArea, number>,
  priorityScores: Record<PriorityLevel, number>
): number {
  // Get the top two category scores
  const sortedCategoryScores = Object.values(categoryScores).sort((a, b) => b - a);
  const topCategoryScore = sortedCategoryScores[0] || 0;
  const secondCategoryScore = sortedCategoryScores[1] || 0;
  
  // Get the top subject score
  const topSubjectScore = Math.max(...Object.values(subjectScores));
  
  // Calculate the difference between top and second categories (dominance)
  const categoryDominance = secondCategoryScore > 0 ? 
    topCategoryScore / secondCategoryScore : 
    topCategoryScore > 0 ? 2 : 0;
  
  // Calculate confidence score components
  const categoryConfidence = Math.min(topCategoryScore / 10, 1) * 0.5;
  const subjectConfidence = Math.min(topSubjectScore / 10, 1) * 0.3;
  const dominanceConfidence = Math.min(categoryDominance / 3, 1) * 0.2;
  
  // Combine all components
  const confidence = categoryConfidence + subjectConfidence + dominanceConfidence;
  
  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Compare two documents for similarity
 */
export function compareDocuments(doc1: string, doc2: string): number {
  // Tokenize both documents
  const tokens1 = new Set(tokenizeText(doc1));
  const tokens2 = new Set(tokenizeText(doc2));
  
  // Find intersection
  const intersection = new Set([...tokens1].filter(token => tokens2.has(token)));
  
  // Calculate Jaccard similarity
  const similarity = intersection.size / (tokens1.size + tokens2.size - intersection.size);
  
  return similarity;
}