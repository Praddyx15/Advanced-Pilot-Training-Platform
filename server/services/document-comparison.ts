/**
 * Document Comparison Service
 * 
 * Provides document comparison capabilities:
 * - Side-by-side text comparison
 * - Element-level change detection
 * - Structural differences highlighting
 * - Content similarity scoring
 * - Version difference tracking
 */
import { ExtractionResult } from './document-extraction';
import { DocumentStructure, DocumentElement, StructureType } from './document-structure';
import { classifyDocument, DocumentClassification } from './document-classification';
import { logger } from '../core/logger';

// Change types
export enum ChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
  MOVED = 'moved',
  UNCHANGED = 'unchanged'
}

// Change significance
export enum ChangeSignificance {
  MAJOR = 'major',
  MINOR = 'minor',
  TRIVIAL = 'trivial'
}

// Element change
export interface ElementChange {
  type: ChangeType;
  significance: ChangeSignificance;
  elementType: StructureType;
  before?: DocumentElement;
  after?: DocumentElement;
  position?: {
    before: number;
    after: number;
  };
  content?: {
    before?: string;
    after?: string;
  };
  similarity?: number;
  metadata?: Record<string, any>;
}

// Document comparison result
export interface DocumentComparison {
  timestamp: Date;
  overallSimilarity: number;
  structureSimilarity: number;
  contentSimilarity: number;
  changes: ElementChange[];
  summary: {
    total: number;
    added: number;
    removed: number;
    modified: number;
    moved: number;
    unchanged: number;
    major: number;
    minor: number;
    trivial: number;
  };
  statistics: {
    addedChars: number;
    removedChars: number;
    changedChars: number;
    processingTime: number;
  };
  impactAnalysis?: {
    category: string;
    severity: string;
    affectedAreas: string[];
    recommendations: string[];
    regulatoryImpact: boolean;
  };
}

// Comparison options
export interface ComparisonOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  ignoreFormatting?: boolean;
  includeImpactAnalysis?: boolean;
  similarityThreshold?: number;
  significanceThresholds?: {
    major: number;
    minor: number;
  };
}

// Default options
const DEFAULT_OPTIONS: ComparisonOptions = {
  ignoreWhitespace: true,
  ignoreCase: true,
  ignoreFormatting: false,
  includeImpactAnalysis: true,
  similarityThreshold: 0.8,  // Elements with similarity above this are considered similar
  significanceThresholds: {
    major: 0.5,  // Changes with > 50% difference are major
    minor: 0.2   // Changes with > 20% difference are minor, rest are trivial
  }
};

/**
 * Compare two document structures
 */
export async function compareDocumentStructures(
  before: DocumentStructure,
  after: DocumentStructure,
  options: ComparisonOptions = DEFAULT_OPTIONS
): Promise<DocumentComparison> {
  const startTime = Date.now();
  
  try {
    // Initialize result
    const result: DocumentComparison = {
      timestamp: new Date(),
      overallSimilarity: 0,
      structureSimilarity: 0,
      contentSimilarity: 0,
      changes: [],
      summary: {
        total: 0,
        added: 0,
        removed: 0,
        modified: 0,
        moved: 0,
        unchanged: 0,
        major: 0,
        minor: 0,
        trivial: 0
      },
      statistics: {
        addedChars: 0,
        removedChars: 0,
        changedChars: 0,
        processingTime: 0
      }
    };
    
    // Compare document structures
    compareElements(before.hierarchy, after.hierarchy, result, options);
    
    // Calculate similarity scores
    calculateSimilarityScores(before, after, result);
    
    // Generate impact analysis if requested
    if (options.includeImpactAnalysis) {
      result.impactAnalysis = await generateImpactAnalysis(before, after, result);
    }
    
    // Update processing time
    result.statistics.processingTime = Date.now() - startTime;
    
    return result;
  } catch (error) {
    logger.error('Error during document comparison', { error });
    throw error;
  }
}

/**
 * Compare two extraction results
 */
export async function compareExtractionResults(
  before: ExtractionResult,
  after: ExtractionResult,
  options: ComparisonOptions = DEFAULT_OPTIONS
): Promise<DocumentComparison> {
  const startTime = Date.now();
  
  try {
    // Initialize result
    const result: DocumentComparison = {
      timestamp: new Date(),
      overallSimilarity: 0,
      structureSimilarity: 0,
      contentSimilarity: 0,
      changes: [],
      summary: {
        total: 0,
        added: 0,
        removed: 0,
        modified: 0,
        moved: 0,
        unchanged: 0,
        major: 0,
        minor: 0,
        trivial: 0
      },
      statistics: {
        addedChars: 0,
        removedChars: 0,
        changedChars: 0,
        processingTime: 0
      }
    };
    
    // Since we don't have structured elements, perform a basic text comparison
    const beforeText = options.ignoreCase ? before.text.toLowerCase() : before.text;
    const afterText = options.ignoreCase ? after.text.toLowerCase() : after.text;
    
    // Clean whitespace if needed
    const cleanedBeforeText = options.ignoreWhitespace ? cleanWhitespace(beforeText) : beforeText;
    const cleanedAfterText = options.ignoreWhitespace ? cleanWhitespace(afterText) : afterText;
    
    // Perform diff at paragraph level
    const beforeParagraphs = cleanedBeforeText.split(/\n\s*\n/);
    const afterParagraphs = cleanedAfterText.split(/\n\s*\n/);
    
    compareTextBlocks(beforeParagraphs, afterParagraphs, result, options);
    
    // Calculate similarity scores
    result.contentSimilarity = calculateTextSimilarity(cleanedBeforeText, cleanedAfterText);
    result.structureSimilarity = calculateStructuralSimilarity(before, after);
    result.overallSimilarity = (result.contentSimilarity * 0.7) + (result.structureSimilarity * 0.3);
    
    // Generate impact analysis if requested
    if (options.includeImpactAnalysis) {
      result.impactAnalysis = await generateImpactAnalysis({ text: beforeText } as any, { text: afterText } as any, result);
    }
    
    // Update processing time
    result.statistics.processingTime = Date.now() - startTime;
    
    return result;
  } catch (error) {
    logger.error('Error during extraction result comparison', { error });
    throw error;
  }
}

/**
 * Compare text documents
 */
export async function compareTextDocuments(
  before: string,
  after: string,
  options: ComparisonOptions = DEFAULT_OPTIONS
): Promise<DocumentComparison> {
  // Convert to extraction results and compare
  const beforeResult: ExtractionResult = {
    text: before,
    metadata: {
      extractionEngine: 'text-direct'
    },
    structured: {
      sections: []
    }
  };
  
  const afterResult: ExtractionResult = {
    text: after,
    metadata: {
      extractionEngine: 'text-direct'
    },
    structured: {
      sections: []
    }
  };
  
  return compareExtractionResults(beforeResult, afterResult, options);
}

/**
 * Clean whitespace from text
 */
function cleanWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+$/gm, '')
    .replace(/^\s+/gm, '')
    .trim();
}

/**
 * Compare document elements recursively
 */
function compareElements(
  before: DocumentElement,
  after: DocumentElement,
  result: DocumentComparison,
  options: ComparisonOptions
): void {
  // Compare current elements
  const similarity = calculateElementSimilarity(before, after, options);
  
  if (similarity >= (options.similarityThreshold || 0.8)) {
    // Elements are considered the same but may have modifications
    const change: ElementChange = {
      type: similarity === 1 ? ChangeType.UNCHANGED : ChangeType.MODIFIED,
      significance: determineChangeSignificance(before, after, similarity, options),
      elementType: before.type,
      before,
      after,
      similarity,
      content: {
        before: before.text,
        after: after.text
      }
    };
    
    result.changes.push(change);
    
    // Update summary
    result.summary.total++;
    if (change.type === ChangeType.UNCHANGED) {
      result.summary.unchanged++;
    } else {
      result.summary.modified++;
      
      // Update significance counters
      if (change.significance === ChangeSignificance.MAJOR) result.summary.major++;
      else if (change.significance === ChangeSignificance.MINOR) result.summary.minor++;
      else result.summary.trivial++;
      
      // Update character statistics
      updateCharacterStatistics(before.text, after.text, result.statistics);
    }
    
    // Compare children recursively
    if (before.children && after.children) {
      compareChildElements(before.children, after.children, result, options);
    }
  } else {
    // Elements are different - consider one removed and one added
    // Remove element
    result.changes.push({
      type: ChangeType.REMOVED,
      significance: ChangeSignificance.MAJOR,
      elementType: before.type,
      before,
      content: {
        before: before.text
      }
    });
    
    // Add element
    result.changes.push({
      type: ChangeType.ADDED,
      significance: ChangeSignificance.MAJOR,
      elementType: after.type,
      after,
      content: {
        after: after.text
      }
    });
    
    // Update summary
    result.summary.total += 2;
    result.summary.added++;
    result.summary.removed++;
    result.summary.major += 2;
    
    // Update character statistics
    result.statistics.removedChars += before.text.length;
    result.statistics.addedChars += after.text.length;
    
    // Process children separately
    if (before.children) {
      processRemovedElements(before.children, result);
    }
    
    if (after.children) {
      processAddedElements(after.children, result);
    }
  }
}

/**
 * Compare child elements
 */
function compareChildElements(
  beforeChildren: DocumentElement[],
  afterChildren: DocumentElement[],
  result: DocumentComparison,
  options: ComparisonOptions
): void {
  // Create a mapping of elements that match between the trees
  const mapping = new Map<number, number>(); // beforeIndex -> afterIndex
  const beforeUsed = new Set<number>();
  const afterUsed = new Set<number>();
  
  // First pass: find exact matches and very similar elements
  for (let i = 0; i < beforeChildren.length; i++) {
    for (let j = 0; j < afterChildren.length; j++) {
      if (afterUsed.has(j)) continue;
      
      const similarity = calculateElementSimilarity(beforeChildren[i], afterChildren[j], options);
      
      if (similarity >= (options.similarityThreshold || 0.8)) {
        mapping.set(i, j);
        beforeUsed.add(i);
        afterUsed.add(j);
        break;
      }
    }
  }
  
  // Process mapped elements
  for (const [beforeIndex, afterIndex] of mapping.entries()) {
    compareElements(
      beforeChildren[beforeIndex],
      afterChildren[afterIndex],
      result,
      options
    );
  }
  
  // Process removed elements (in before but not mapped)
  for (let i = 0; i < beforeChildren.length; i++) {
    if (!beforeUsed.has(i)) {
      result.changes.push({
        type: ChangeType.REMOVED,
        significance: ChangeSignificance.MAJOR,
        elementType: beforeChildren[i].type,
        before: beforeChildren[i],
        content: {
          before: beforeChildren[i].text
        }
      });
      
      // Update summary
      result.summary.total++;
      result.summary.removed++;
      result.summary.major++;
      
      // Update character statistics
      result.statistics.removedChars += beforeChildren[i].text.length;
      
      // Process children of removed element
      if (beforeChildren[i].children) {
        processRemovedElements(beforeChildren[i].children, result);
      }
    }
  }
  
  // Process added elements (in after but not mapped)
  for (let j = 0; j < afterChildren.length; j++) {
    if (!afterUsed.has(j)) {
      result.changes.push({
        type: ChangeType.ADDED,
        significance: ChangeSignificance.MAJOR,
        elementType: afterChildren[j].type,
        after: afterChildren[j],
        content: {
          after: afterChildren[j].text
        }
      });
      
      // Update summary
      result.summary.total++;
      result.summary.added++;
      result.summary.major++;
      
      // Update character statistics
      result.statistics.addedChars += afterChildren[j].text.length;
      
      // Process children of added element
      if (afterChildren[j].children) {
        processAddedElements(afterChildren[j].children, result);
      }
    }
  }
}

/**
 * Process all elements in a subtree as removed
 */
function processRemovedElements(elements: DocumentElement[], result: DocumentComparison): void {
  for (const element of elements) {
    result.changes.push({
      type: ChangeType.REMOVED,
      significance: ChangeSignificance.MINOR, // Child removals are considered minor
      elementType: element.type,
      before: element,
      content: {
        before: element.text
      }
    });
    
    // Update summary
    result.summary.total++;
    result.summary.removed++;
    result.summary.minor++;
    
    // Update character statistics
    result.statistics.removedChars += element.text.length;
    
    // Process children recursively
    if (element.children) {
      processRemovedElements(element.children, result);
    }
  }
}

/**
 * Process all elements in a subtree as added
 */
function processAddedElements(elements: DocumentElement[], result: DocumentComparison): void {
  for (const element of elements) {
    result.changes.push({
      type: ChangeType.ADDED,
      significance: ChangeSignificance.MINOR, // Child additions are considered minor
      elementType: element.type,
      after: element,
      content: {
        after: element.text
      }
    });
    
    // Update summary
    result.summary.total++;
    result.summary.added++;
    result.summary.minor++;
    
    // Update character statistics
    result.statistics.addedChars += element.text.length;
    
    // Process children recursively
    if (element.children) {
      processAddedElements(element.children, result);
    }
  }
}

/**
 * Compare text blocks (paragraphs)
 */
function compareTextBlocks(
  beforeBlocks: string[],
  afterBlocks: string[],
  result: DocumentComparison,
  options: ComparisonOptions
): void {
  const mapping = new Map<number, number>(); // beforeIndex -> afterIndex
  const beforeUsed = new Set<number>();
  const afterUsed = new Set<number>();
  
  // First pass: find exact matches and very similar blocks
  for (let i = 0; i < beforeBlocks.length; i++) {
    for (let j = 0; j < afterBlocks.length; j++) {
      if (afterUsed.has(j)) continue;
      
      const similarity = calculateTextSimilarity(beforeBlocks[i], afterBlocks[j]);
      
      if (similarity >= (options.similarityThreshold || 0.8)) {
        mapping.set(i, j);
        beforeUsed.add(i);
        afterUsed.add(j);
        break;
      }
    }
  }
  
  // Process mapped blocks
  for (const [beforeIndex, afterIndex] of mapping.entries()) {
    const beforeText = beforeBlocks[beforeIndex];
    const afterText = afterBlocks[afterIndex];
    const similarity = calculateTextSimilarity(beforeText, afterText);
    
    if (similarity === 1) {
      // Identical paragraphs
      result.changes.push({
        type: ChangeType.UNCHANGED,
        significance: ChangeSignificance.TRIVIAL,
        elementType: StructureType.PARAGRAPH,
        content: {
          before: beforeText,
          after: afterText
        },
        similarity: 1
      });
      
      // Update summary
      result.summary.total++;
      result.summary.unchanged++;
    } else {
      // Modified paragraphs
      const significance = determineTextChangeSignificance(beforeText, afterText, similarity, options);
      
      result.changes.push({
        type: ChangeType.MODIFIED,
        significance,
        elementType: StructureType.PARAGRAPH,
        content: {
          before: beforeText,
          after: afterText
        },
        similarity
      });
      
      // Update summary
      result.summary.total++;
      result.summary.modified++;
      
      // Update significance counters
      if (significance === ChangeSignificance.MAJOR) result.summary.major++;
      else if (significance === ChangeSignificance.MINOR) result.summary.minor++;
      else result.summary.trivial++;
      
      // Update character statistics
      updateCharacterStatistics(beforeText, afterText, result.statistics);
    }
  }
  
  // Process removed blocks
  for (let i = 0; i < beforeBlocks.length; i++) {
    if (!beforeUsed.has(i)) {
      result.changes.push({
        type: ChangeType.REMOVED,
        significance: ChangeSignificance.MAJOR,
        elementType: StructureType.PARAGRAPH,
        content: {
          before: beforeBlocks[i]
        }
      });
      
      // Update summary
      result.summary.total++;
      result.summary.removed++;
      result.summary.major++;
      
      // Update character statistics
      result.statistics.removedChars += beforeBlocks[i].length;
    }
  }
  
  // Process added blocks
  for (let j = 0; j < afterBlocks.length; j++) {
    if (!afterUsed.has(j)) {
      result.changes.push({
        type: ChangeType.ADDED,
        significance: ChangeSignificance.MAJOR,
        elementType: StructureType.PARAGRAPH,
        content: {
          after: afterBlocks[j]
        }
      });
      
      // Update summary
      result.summary.total++;
      result.summary.added++;
      result.summary.major++;
      
      // Update character statistics
      result.statistics.addedChars += afterBlocks[j].length;
    }
  }
}

/**
 * Calculate similarity between two elements
 */
function calculateElementSimilarity(
  before: DocumentElement,
  after: DocumentElement,
  options: ComparisonOptions
): number {
  // If types are different, similarity is very low
  if (before.type !== after.type) {
    return 0.1;
  }
  
  // Calculate text similarity
  let textSimilarity = calculateTextSimilarity(
    options.ignoreCase ? before.text.toLowerCase() : before.text,
    options.ignoreCase ? after.text.toLowerCase() : after.text
  );
  
  // For certain element types, adjust similarity based on additional factors
  switch (before.type) {
    case StructureType.HEADING:
      // Headings at same level with similar text are likely the same
      if (before.level === after.level) {
        textSimilarity = textSimilarity * 1.2; // Boost similarity
      } else {
        textSimilarity = textSimilarity * 0.8; // Reduce similarity
      }
      break;
      
    case StructureType.LIST:
    case StructureType.TABLE:
      // For structured elements, consider structural similarity as well
      const structuralSimilarity = 
        before.children && after.children ?
        before.children.length === after.children.length ? 0.8 : 0.5 :
        0.3;
      
      textSimilarity = (textSimilarity * 0.7) + (structuralSimilarity * 0.3);
      break;
  }
  
  // Ensure similarity is between 0 and 1
  return Math.max(0, Math.min(1, textSimilarity));
}

/**
 * Calculate text similarity using cosine similarity of word frequencies
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1;
  if (!text1 || !text2) return 0;
  
  // Tokenize texts
  const tokens1 = text1.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const tokens2 = text2.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  
  // If either is empty after tokenization, handle edge case
  if (tokens1.length === 0 || tokens2.length === 0) {
    return tokens1.length === tokens2.length ? 1 : 0;
  }
  
  // Create frequency maps
  const freq1: Record<string, number> = {};
  const freq2: Record<string, number> = {};
  
  tokens1.forEach(token => {
    freq1[token] = (freq1[token] || 0) + 1;
  });
  
  tokens2.forEach(token => {
    freq2[token] = (freq2[token] || 0) + 1;
  });
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  // Calculate dot product
  for (const token in freq1) {
    if (freq2[token]) {
      dotProduct += freq1[token] * freq2[token];
    }
    magnitude1 += freq1[token] * freq1[token];
  }
  
  // Calculate magnitudes
  for (const token in freq2) {
    magnitude2 += freq2[token] * freq2[token];
  }
  
  // Calculate similarity
  const magnitudeProduct = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
  return magnitudeProduct === 0 ? 0 : dotProduct / magnitudeProduct;
}

/**
 * Calculate structural similarity between two documents
 */
function calculateStructuralSimilarity(doc1: any, doc2: any): number {
  let similarity = 0;
  
  // If we have structured results, use them
  if (doc1.structured && doc2.structured) {
    // Compare number of sections
    const sections1 = doc1.structured.sections?.length || 0;
    const sections2 = doc2.structured.sections?.length || 0;
    const sectionsDiff = Math.abs(sections1 - sections2) / Math.max(sections1, sections2, 1);
    
    // Compare number of tables
    const tables1 = doc1.structured.tables?.length || 0;
    const tables2 = doc2.structured.tables?.length || 0;
    const tablesDiff = Math.abs(tables1 - tables2) / Math.max(tables1, tables2, 1);
    
    // Compare number of headings
    const headings1 = doc1.structured.headings?.length || 0;
    const headings2 = doc2.structured.headings?.length || 0;
    const headingsDiff = Math.abs(headings1 - headings2) / Math.max(headings1, headings2, 1);
    
    // Calculate overall structural similarity
    similarity = 1 - ((sectionsDiff * 0.4) + (tablesDiff * 0.3) + (headingsDiff * 0.3));
  } else {
    // Without structured data, use paragraph-based comparison
    const paragraphs1 = doc1.text.split(/\n\s*\n/).length;
    const paragraphs2 = doc2.text.split(/\n\s*\n/).length;
    const paragraphsDiff = Math.abs(paragraphs1 - paragraphs2) / Math.max(paragraphs1, paragraphs2, 1);
    
    similarity = 1 - paragraphsDiff;
  }
  
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Determine significance of an element change
 */
function determineChangeSignificance(
  before: DocumentElement,
  after: DocumentElement,
  similarity: number,
  options: ComparisonOptions
): ChangeSignificance {
  const thresholds = options.significanceThresholds || { major: 0.5, minor: 0.2 };
  const diffMagnitude = 1 - similarity;
  
  // Higher weight for certain element types
  let weight = 1;
  
  switch (before.type) {
    case StructureType.HEADING:
      weight = 1.5;
      break;
      
    case StructureType.TABLE:
    case StructureType.FORM_FIELD:
    case StructureType.KEY_VALUE:
      weight = 1.3;
      break;
      
    case StructureType.REFERENCE:
    case StructureType.CITATION:
      weight = 1.2;
      break;
  }
  
  const weightedDiff = diffMagnitude * weight;
  
  if (weightedDiff > thresholds.major) {
    return ChangeSignificance.MAJOR;
  } else if (weightedDiff > thresholds.minor) {
    return ChangeSignificance.MINOR;
  } else {
    return ChangeSignificance.TRIVIAL;
  }
}

/**
 * Determine significance of a text change
 */
function determineTextChangeSignificance(
  before: string,
  after: string,
  similarity: number,
  options: ComparisonOptions
): ChangeSignificance {
  const thresholds = options.significanceThresholds || { major: 0.5, minor: 0.2 };
  const diffMagnitude = 1 - similarity;
  
  if (diffMagnitude > thresholds.major) {
    return ChangeSignificance.MAJOR;
  } else if (diffMagnitude > thresholds.minor) {
    return ChangeSignificance.MINOR;
  } else {
    return ChangeSignificance.TRIVIAL;
  }
}

/**
 * Update character statistics
 */
function updateCharacterStatistics(
  before: string,
  after: string,
  statistics: DocumentComparison['statistics']
): void {
  // This is a simplistic approach - for more accurate results, a proper diff algorithm would be used
  const beforeLength = before.length;
  const afterLength = after.length;
  
  if (beforeLength > afterLength) {
    statistics.removedChars += beforeLength - afterLength;
    statistics.changedChars += afterLength;
  } else {
    statistics.addedChars += afterLength - beforeLength;
    statistics.changedChars += beforeLength;
  }
}

/**
 * Calculate overall similarity scores
 */
function calculateSimilarityScores(
  before: DocumentStructure,
  after: DocumentStructure,
  result: DocumentComparison
): void {
  // Calculate content similarity
  const beforeText = extractAllText(before.hierarchy);
  const afterText = extractAllText(after.hierarchy);
  result.contentSimilarity = calculateTextSimilarity(beforeText, afterText);
  
  // Calculate structure similarity
  result.structureSimilarity = calculateStructuralSimilarityFromElements(before.hierarchy, after.hierarchy);
  
  // Calculate overall similarity (weighted average)
  result.overallSimilarity = (result.contentSimilarity * 0.6) + (result.structureSimilarity * 0.4);
}

/**
 * Extract all text from an element and its children
 */
function extractAllText(element: DocumentElement): string {
  let text = element.text || '';
  
  if (element.children) {
    for (const child of element.children) {
      text += ' ' + extractAllText(child);
    }
  }
  
  return text;
}

/**
 * Calculate structural similarity between two element hierarchies
 */
function calculateStructuralSimilarityFromElements(
  before: DocumentElement,
  after: DocumentElement
): number {
  // Compare element types
  const typeSimilarity = before.type === after.type ? 1 : 0;
  
  // Compare element levels (if applicable)
  const levelSimilarity = 
    'level' in before && 'level' in after ?
    1 - (Math.abs(before.level - after.level) / Math.max(before.level, after.level, 1)) :
    1;
  
  // Compare children count
  const beforeChildrenCount = before.children?.length || 0;
  const afterChildrenCount = after.children?.length || 0;
  const childrenCountSimilarity = 
    1 - (Math.abs(beforeChildrenCount - afterChildrenCount) / 
    Math.max(beforeChildrenCount, afterChildrenCount, 1));
  
  // Compare children recursively
  let childrenSimilarity = 1;
  
  if (before.children && after.children && 
      before.children.length > 0 && after.children.length > 0) {
    // Map similar children
    const childSimilarities: number[] = [];
    
    for (let i = 0; i < Math.min(before.children.length, after.children.length); i++) {
      childSimilarities.push(
        calculateStructuralSimilarityFromElements(before.children[i], after.children[i])
      );
    }
    
    // Average child similarities
    childrenSimilarity = childSimilarities.reduce((sum, val) => sum + val, 0) / childSimilarities.length;
  }
  
  // Calculate weighted average
  return (typeSimilarity * 0.3) + 
         (levelSimilarity * 0.2) + 
         (childrenCountSimilarity * 0.2) + 
         (childrenSimilarity * 0.3);
}

/**
 * Generate impact analysis based on document changes
 */
async function generateImpactAnalysis(
  before: any,
  after: any,
  result: DocumentComparison
): Promise<DocumentComparison['impactAnalysis']> {
  // Classify both documents
  const beforeClassification = await classifyDocument({ text: extractTextFromDocument(before) });
  const afterClassification = await classifyDocument({ text: extractTextFromDocument(after) });
  
  // Determine affected areas based on changes
  const affectedAreas = determineAffectedAreas(result, beforeClassification, afterClassification);
  
  // Determine severity based on change summary and document category
  const severity = determineSeverity(result, beforeClassification, afterClassification);
  
  // Check for regulatory impact
  const regulatoryImpact = 
    beforeClassification.category === 'regulatory' || 
    afterClassification.category === 'regulatory' ||
    beforeClassification.subjects.includes('regulations' as any) ||
    afterClassification.subjects.includes('regulations' as any) ||
    result.summary.major > 5;
  
  // Generate recommendations
  const recommendations = generateRecommendations(result, regulatoryImpact, severity);
  
  return {
    category: afterClassification.category,
    severity,
    affectedAreas,
    recommendations,
    regulatoryImpact
  };
}

/**
 * Extract text from a document object
 */
function extractTextFromDocument(document: any): string {
  if (typeof document === 'string') {
    return document;
  } else if (document.text) {
    return document.text;
  } else if (document.elements) {
    return document.elements.map((e: any) => e.text).join(' ');
  } else if (document.hierarchy) {
    return extractAllText(document.hierarchy);
  }
  return '';
}

/**
 * Determine areas affected by changes
 */
function determineAffectedAreas(
  result: DocumentComparison,
  beforeClassification: DocumentClassification,
  afterClassification: DocumentClassification
): string[] {
  const areas = new Set<string>();
  
  // Add subject areas from both classifications
  beforeClassification.subjects.forEach(subject => areas.add(subject));
  afterClassification.subjects.forEach(subject => areas.add(subject));
  
  // Add additional areas based on change types
  if (result.summary.major > 0) {
    // Look at what types of elements had major changes
    const majorChanges = result.changes.filter(
      change => change.significance === ChangeSignificance.MAJOR
    );
    
    for (const change of majorChanges) {
      if (change.elementType === StructureType.TABLE) {
        areas.add('tables');
      } else if (change.elementType === StructureType.HEADING) {
        areas.add('structure');
      } else if (change.elementType === StructureType.REFERENCE || 
                change.elementType === StructureType.CITATION) {
        areas.add('references');
      }
    }
  }
  
  return Array.from(areas);
}

/**
 * Determine severity of changes
 */
function determineSeverity(
  result: DocumentComparison,
  beforeClassification: DocumentClassification,
  afterClassification: DocumentClassification
): string {
  // Calculate severity based on multiple factors
  const factors = [];
  
  // Factor 1: Number of major changes
  if (result.summary.major > 10) factors.push(3);
  else if (result.summary.major > 5) factors.push(2);
  else if (result.summary.major > 0) factors.push(1);
  else factors.push(0);
  
  // Factor 2: Overall change percentage
  const changePercentage = 1 - result.overallSimilarity;
  if (changePercentage > 0.5) factors.push(3);
  else if (changePercentage > 0.3) factors.push(2);
  else if (changePercentage > 0.1) factors.push(1);
  else factors.push(0);
  
  // Factor 3: Document category
  if (beforeClassification.category === 'regulatory' || afterClassification.category === 'regulatory') {
    factors.push(3);
  } else if (beforeClassification.category === 'operational' || afterClassification.category === 'operational') {
    factors.push(2);
  } else if (beforeClassification.category === 'technical' || afterClassification.category === 'technical') {
    factors.push(2);
  } else {
    factors.push(1);
  }
  
  // Factor 4: Priority level
  if (beforeClassification.priority === 'critical' || afterClassification.priority === 'critical') {
    factors.push(3);
  } else if (beforeClassification.priority === 'high' || afterClassification.priority === 'high') {
    factors.push(2);
  } else {
    factors.push(1);
  }
  
  // Calculate average severity score
  const severityScore = factors.reduce((sum, val) => sum + val, 0) / factors.length;
  
  if (severityScore > 2.5) return 'critical';
  if (severityScore > 1.5) return 'major';
  if (severityScore > 0.5) return 'moderate';
  return 'minor';
}

/**
 * Generate recommendations based on impact
 */
function generateRecommendations(
  result: DocumentComparison,
  regulatoryImpact: boolean,
  severity: string
): string[] {
  const recommendations: string[] = [];
  
  if (regulatoryImpact) {
    recommendations.push('Conduct a full regulatory compliance review');
    recommendations.push('Consult with regulatory compliance officers before implementation');
  }
  
  if (severity === 'critical' || severity === 'major') {
    recommendations.push('Perform a comprehensive training impact assessment');
    recommendations.push('Update related training materials and documentation');
    
    if (result.summary.major > 5) {
      recommendations.push('Consider creating a change management plan for implementation');
    }
  }
  
  if (result.changes.some(c => c.elementType === StructureType.TABLE)) {
    recommendations.push('Review all affected tables for data accuracy');
  }
  
  if (result.changes.some(c => c.elementType === StructureType.REFERENCE)) {
    recommendations.push('Verify all references for accuracy and consistency');
  }
  
  return recommendations;
}