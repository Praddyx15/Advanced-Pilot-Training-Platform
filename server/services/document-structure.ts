/**
 * Document Structure Recognition Service
 * 
 * This service is responsible for analyzing document structure and extracting:
 * - Headers and sections
 * - Tables and lists
 * - References and citations
 * - Content hierarchy
 * - Key-value pairs and form fields
 */
import { ExtractionResult } from './document-extraction';
import { logger } from '../core/logger';

/**
 * Types of document structures we can recognize
 */
export enum StructureType {
  HEADING = 'heading',
  SECTION = 'section',
  PARAGRAPH = 'paragraph',
  LIST = 'list',
  LIST_ITEM = 'list_item',
  TABLE = 'table',
  TABLE_CELL = 'table_cell',
  KEY_VALUE = 'key_value',
  FORM_FIELD = 'form_field',
  REFERENCE = 'reference',
  CITATION = 'citation',
  FOOTNOTE = 'footnote',
}

/**
 * Structured document element
 */
export interface DocumentElement {
  type: StructureType;
  text: string;
  level?: number;
  metadata?: {
    confidence?: number;
    pageNumber?: number;
    boundingBox?: [number, number, number, number]; // [x1, y1, x2, y2]
    references?: string[];
    [key: string]: any;
  };
  children?: DocumentElement[];
  parent?: DocumentElement;
}

/**
 * Complete document structure results
 */
export interface DocumentStructure {
  title?: string;
  elements: DocumentElement[];
  hierarchy: DocumentElement; // Root element with the complete hierarchy
  metadata: {
    processingTime: number;
    confidence: number;
    pageCount?: number;
    format?: string;
    language?: string;
  };
}

/**
 * Options for controlling structure recognition
 */
export interface StructureRecognitionOptions {
  recognizeHeadings?: boolean;
  recognizeSections?: boolean;
  recognizeTables?: boolean;
  recognizeLists?: boolean;
  recognizeKeyValue?: boolean;
  recognizeReferences?: boolean;
  minHeadingConfidence?: number;
  minTableConfidence?: number;
  language?: string;
}

/**
 * Default options for structure recognition
 */
const DEFAULT_OPTIONS: StructureRecognitionOptions = {
  recognizeHeadings: true,
  recognizeSections: true,
  recognizeTables: true,
  recognizeLists: true,
  recognizeKeyValue: true,
  recognizeReferences: true,
  minHeadingConfidence: 0.7,
  minTableConfidence: 0.6,
  language: 'eng',
};

/**
 * Main function to analyze document structure
 */
export async function analyzeDocumentStructure(
  extractionResult: ExtractionResult,
  options: StructureRecognitionOptions = DEFAULT_OPTIONS,
): Promise<DocumentStructure> {
  const startTime = Date.now();
  
  try {
    logger.info('Starting document structure recognition', {
      documentTitle: extractionResult.metadata.title,
      options,
    });
    
    // Initialize the result
    const structure: DocumentStructure = {
      title: extractionResult.metadata.title,
      elements: [],
      hierarchy: {
        type: StructureType.SECTION,
        text: 'Document Root',
        children: [],
      },
      metadata: {
        processingTime: 0,
        confidence: 0,
        pageCount: extractionResult.metadata.pageCount,
        format: extractionResult.metadata.format,
        language: extractionResult.metadata.language,
      },
    };
    
    // Process headings and create document hierarchy
    if (options.recognizeHeadings && extractionResult.structured?.headings) {
      processHeadings(extractionResult.structured.headings, structure);
    }
    
    // Process tables
    if (options.recognizeTables && extractionResult.structured?.tables) {
      processTables(extractionResult.structured.tables, structure);
    }
    
    // Process full text for other elements
    processFullText(extractionResult.text, structure, options);
    
    // Calculate confidence score
    structure.metadata.confidence = calculateConfidence(structure);
    
    // Calculate processing time
    structure.metadata.processingTime = Date.now() - startTime;
    
    logger.info('Document structure recognition completed', {
      documentTitle: extractionResult.metadata.title,
      elementCount: structure.elements.length,
      processingTime: structure.metadata.processingTime,
      confidence: structure.metadata.confidence,
    });
    
    return structure;
  } catch (error) {
    logger.error('Error in document structure recognition', {
      error,
      documentTitle: extractionResult.metadata.title,
    });
    throw error;
  }
}

/**
 * Process headings to create document hierarchy
 */
function processHeadings(
  headings: { level: number; text: string; pageIndex?: number }[],
  structure: DocumentStructure,
): void {
  // Sort headings by their position in the document (if available)
  const sortedHeadings = [...headings];
  
  // Track current section for each level
  const currentSections: DocumentElement[] = [structure.hierarchy];
  
  for (const heading of sortedHeadings) {
    const headingElement: DocumentElement = {
      type: StructureType.HEADING,
      text: heading.text,
      level: heading.level,
      metadata: {
        confidence: 0.9, // Headings directly from extraction are high confidence
        pageNumber: heading.pageIndex ? heading.pageIndex + 1 : undefined,
      },
      children: [],
    };
    
    // Create a section for this heading
    const sectionElement: DocumentElement = {
      type: StructureType.SECTION,
      text: heading.text,
      level: heading.level,
      metadata: {
        confidence: 0.9,
        pageNumber: heading.pageIndex ? heading.pageIndex + 1 : undefined,
      },
      children: [],
      parent: null, // Will be set below
    };
    
    // Add heading to its section
    sectionElement.children.push(headingElement);
    
    // Find the parent section for this heading based on its level
    let parentLevel = heading.level - 1;
    while (parentLevel > 0 && !currentSections[parentLevel]) {
      parentLevel--;
    }
    
    const parentSection = currentSections[parentLevel] || structure.hierarchy;
    
    // Set parent-child relationships
    sectionElement.parent = parentSection;
    parentSection.children = parentSection.children || [];
    parentSection.children.push(sectionElement);
    
    // Update current section for this level
    currentSections[heading.level] = sectionElement;
    
    // Clear any deeper levels since they would now belong to this new section
    for (let i = heading.level + 1; i < currentSections.length; i++) {
      currentSections[i] = null;
    }
    
    // Add to flat list of elements
    structure.elements.push(headingElement);
    structure.elements.push(sectionElement);
  }
}

/**
 * Process tables from the extraction result
 */
function processTables(
  tables: any[][],
  structure: DocumentStructure,
): void {
  tables.forEach((tableData, tableIndex) => {
    if (!tableData || tableData.length === 0) return;
    
    const tableElement: DocumentElement = {
      type: StructureType.TABLE,
      text: `Table ${tableIndex + 1}`,
      metadata: {
        confidence: 0.85,
        rowCount: tableData.length,
        columnCount: Math.max(...tableData.map(row => Array.isArray(row) ? row.length : 0)),
      },
      children: [],
    };
    
    // Process table cells
    tableData.forEach((row, rowIndex) => {
      if (Array.isArray(row)) {
        row.forEach((cell, colIndex) => {
          const cellElement: DocumentElement = {
            type: StructureType.TABLE_CELL,
            text: String(cell),
            metadata: {
              confidence: 0.85,
              row: rowIndex,
              column: colIndex,
            },
            parent: tableElement,
          };
          tableElement.children.push(cellElement);
        });
      }
    });
    
    // Find a good parent for this table in the hierarchy
    const bestParent = findBestParentForElement(tableElement, structure.hierarchy);
    if (bestParent) {
      bestParent.children = bestParent.children || [];
      bestParent.children.push(tableElement);
      tableElement.parent = bestParent;
    } else {
      structure.hierarchy.children.push(tableElement);
      tableElement.parent = structure.hierarchy;
    }
    
    structure.elements.push(tableElement);
  });
}

/**
 * Process the full text to identify other structural elements
 */
function processFullText(
  text: string,
  structure: DocumentStructure,
  options: StructureRecognitionOptions,
): void {
  const lines = text.split('\n');
  
  // Process lists
  if (options.recognizeLists) {
    processLists(lines, structure);
  }
  
  // Process key-value pairs
  if (options.recognizeKeyValue) {
    processKeyValuePairs(lines, structure);
  }
  
  // Process references and citations
  if (options.recognizeReferences) {
    processReferences(text, structure);
  }
}

/**
 * Process lists from text lines
 */
function processLists(
  lines: string[],
  structure: DocumentStructure,
): void {
  let currentList: DocumentElement = null;
  const listMarkerRegex = /^\s*[•\-\*\d+\.\+]\s+/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Check if this is a list item
    const isListItem = listMarkerRegex.test(line);
    
    if (isListItem) {
      // Start a new list if we're not in one already
      if (!currentList) {
        currentList = {
          type: StructureType.LIST,
          text: 'List',
          metadata: {
            confidence: 0.75,
            startLine: i,
          },
          children: [],
        };
        
        // Find a parent for this list
        const bestParent = findBestParentForElement(currentList, structure.hierarchy);
        if (bestParent) {
          bestParent.children = bestParent.children || [];
          bestParent.children.push(currentList);
          currentList.parent = bestParent;
        } else {
          structure.hierarchy.children.push(currentList);
          currentList.parent = structure.hierarchy;
        }
        
        structure.elements.push(currentList);
      }
      
      // Create list item
      const itemText = line.replace(listMarkerRegex, '');
      const listItem: DocumentElement = {
        type: StructureType.LIST_ITEM,
        text: itemText,
        metadata: {
          confidence: 0.8,
          lineIndex: i,
        },
        parent: currentList,
      };
      
      currentList.children.push(listItem);
      structure.elements.push(listItem);
    } else if (currentList && line.trim().length > 0 && !line.match(/^\s+/)) {
      // A non-indented, non-empty line that doesn't match list pattern - end current list
      currentList.metadata.endLine = i - 1;
      currentList = null;
    }
  }
  
  // Close any open list at the end
  if (currentList) {
    currentList.metadata.endLine = lines.length - 1;
  }
}

/**
 * Process key-value pairs (like form fields or property lists)
 */
function processKeyValuePairs(
  lines: string[],
  structure: DocumentStructure,
): void {
  const keyValueRegex = /^([^:]+):(.+)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    const match = line.match(keyValueRegex);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      
      // Only consider it a key-value if key is reasonable and value exists
      if (key.length > 0 && key.length < 50 && value.length > 0) {
        const kvElement: DocumentElement = {
          type: StructureType.KEY_VALUE,
          text: line,
          metadata: {
            confidence: 0.75,
            key,
            value,
            lineIndex: i,
          },
        };
        
        // Find a parent for this key-value
        const bestParent = findBestParentForElement(kvElement, structure.hierarchy);
        if (bestParent) {
          bestParent.children = bestParent.children || [];
          bestParent.children.push(kvElement);
          kvElement.parent = bestParent;
        } else {
          structure.hierarchy.children.push(kvElement);
          kvElement.parent = structure.hierarchy;
        }
        
        structure.elements.push(kvElement);
      }
    }
  }
}

/**
 * Process references and citations
 */
function processReferences(
  text: string,
  structure: DocumentStructure,
): void {
  // Citation patterns
  const citationPatterns = [
    /\[(\d+)\]/g, // [1], [2], etc.
    /\(([A-Za-z]+,?\s+\d{4}(?:[a-z])?)\)/g, // (Smith, 2020), (Jones, 2019a), etc.
  ];
  
  // Reference list patterns
  const referencePatterns = [
    /References:|Bibliography:|Works Cited:/i, // Common section headings for references
  ];
  
  // Find the references section
  let refSection: DocumentElement = null;
  for (const pattern of referencePatterns) {
    if (pattern.test(text)) {
      // Find the section by looking through existing headings/sections
      for (const element of structure.elements) {
        if (
          (element.type === StructureType.HEADING || element.type === StructureType.SECTION) &&
          pattern.test(element.text)
        ) {
          // Create a special reference section if we found a heading
          refSection = {
            type: StructureType.SECTION,
            text: 'References',
            metadata: {
              confidence: 0.9,
              isReferenceSection: true,
            },
            children: [],
            parent: element.parent,
          };
          
          // Add to hierarchy and elements
          if (element.parent) {
            element.parent.children = element.parent.children || [];
            element.parent.children.push(refSection);
          } else {
            structure.hierarchy.children.push(refSection);
            refSection.parent = structure.hierarchy;
          }
          
          structure.elements.push(refSection);
          break;
        }
      }
    }
    
    if (refSection) break;
  }
  
  // Process citations
  for (const pattern of citationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const citation: DocumentElement = {
        type: StructureType.CITATION,
        text: match[0],
        metadata: {
          confidence: 0.7,
          citationText: match[1],
          position: match.index,
        },
      };
      
      structure.elements.push(citation);
    }
  }
}

/**
 * Find the best parent for a new element in the document hierarchy
 */
function findBestParentForElement(
  element: DocumentElement,
  root: DocumentElement,
): DocumentElement | null {
  // For now, use a simple strategy: find the deepest section that could contain this element
  // based on page number or position in text
  
  // If this element has page metadata, try to find a section on that page
  const pageNumber = element.metadata?.pageNumber;
  
  if (pageNumber) {
    // Do a depth-first search for the best section
    function findSectionOnPage(node: DocumentElement): DocumentElement | null {
      if (node.type === StructureType.SECTION && node.metadata?.pageNumber === pageNumber) {
        // Search children first to find the deepest matching section
        for (const child of node.children || []) {
          const result = findSectionOnPage(child);
          if (result) return result;
        }
        return node;
      }
      
      // If this isn't a matching section, check all children
      for (const child of node.children || []) {
        const result = findSectionOnPage(child);
        if (result) return result;
      }
      
      return null;
    }
    
    const sectionOnPage = findSectionOnPage(root);
    if (sectionOnPage) return sectionOnPage;
  }
  
  // If no section found based on page, return the most recently added section
  function findMostRecentSection(node: DocumentElement): DocumentElement | null {
    if (node.type === StructureType.SECTION) {
      // Check if any children are sections
      let lastSection = null;
      for (const child of node.children || []) {
        if (child.type === StructureType.SECTION) {
          lastSection = child;
        }
      }
      
      if (lastSection) {
        const deeperSection = findMostRecentSection(lastSection);
        return deeperSection || lastSection;
      }
      
      return node;
    }
    
    return null;
  }
  
  return findMostRecentSection(root) || root;
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(structure: DocumentStructure): number {
  if (structure.elements.length === 0) return 0;
  
  // Average confidence across all elements
  const confidenceSum = structure.elements.reduce(
    (sum, element) => sum + (element.metadata?.confidence || 0.5),
    0
  );
  
  return confidenceSum / structure.elements.length;
}