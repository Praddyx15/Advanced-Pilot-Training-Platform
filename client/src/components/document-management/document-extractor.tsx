import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { UploadedDocument } from './document-uploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  FileText, ChevronRight, Layers, Search, 
  ListTree, CheckCircle2, Loader2, AlertTriangle 
} from 'lucide-react';

interface DocumentExtractorProps {
  documentId: number;
  onExtracted?: (extractionResult: any) => void;
}

interface ExtractedData {
  id: number;
  documentId: number;
  analyzeType: string;
  status: string;
  confidence: number;
  results: any;
  processingTime: number;
  completedAt: string;
  createdAt: string;
}

export function DocumentExtractor({ documentId, onExtracted }: DocumentExtractorProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const [extractionType, setExtractionType] = useState('structure');
  const { toast } = useToast();

  // Fetch document details
  const { data: document, isLoading: isLoadingDocument } = useQuery<UploadedDocument>({
    queryKey: [`/api/documents/${documentId}`],
    // Use default fetcher
  });

  // Fetch extraction results if they exist
  const { 
    data: extractionResults, 
    isLoading: isLoadingExtraction, 
    error: extractionError 
  } = useQuery<ExtractedData[]>({
    queryKey: [`/api/documents/${documentId}/extractions`],
    // Use default fetcher
  });

  // Start extraction process
  const extractMutation = useMutation({
    mutationFn: async (extractionParams: { documentId: number, type: string }) => {
      const response = await apiRequest(
        'POST', 
        `/api/documents/${extractionParams.documentId}/extract`,
        { type: extractionParams.type }
      );
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/extractions`] });
      
      toast({
        title: "Extraction started",
        description: "The document is being analyzed. This may take a few moments.",
        variant: "default",
      });
      
      if (onExtracted) {
        onExtracted(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction failed",
        description: error.message || "There was an error extracting data from this document.",
        variant: "destructive",
      });
    }
  });

  // Handle extraction request
  const handleExtract = () => {
    extractMutation.mutate({ documentId, type: extractionType });
  };

  // Format extraction results for display
  const formatResults = (results: any) => {
    if (!results) return "No data available";
    
    try {
      // For the demo, we'll just stringify the JSON with indentation
      return JSON.stringify(results, null, 2);
    } catch (error) {
      return "Error formatting results";
    }
  };

  // Find a specific extraction by type
  const findExtraction = (type: string) => {
    if (!extractionResults) return null;
    return extractionResults.find(extraction => extraction.analyzeType === type);
  };

  const structureExtraction = findExtraction('structure');
  const contentExtraction = findExtraction('content');
  const complianceExtraction = findExtraction('compliance');
  const knowledgeExtraction = findExtraction('knowledge');

  if (isLoadingDocument) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Extractor</CardTitle>
          <CardDescription>Loading document information...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Document Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested document could not be found or you don't have permission to access it.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Document Extractor
        </CardTitle>
        <CardDescription>
          Extract structured data from "{document.title}"
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">
              <FileText className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="structure">
              <Layers className="mr-2 h-4 w-4" />
              Structure
            </TabsTrigger>
            <TabsTrigger value="content">
              <Search className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <ListTree className="mr-2 h-4 w-4" />
              Knowledge
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <TabsContent value="preview" className="mt-0">
            <div className="rounded-md border h-[400px] bg-muted/30 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Document Preview</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Preview functionality is not available in this version.
                  Please use the extraction tabs to analyze document content.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="structure" className="mt-0 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Document Structure Extraction</h3>
                <p className="text-sm text-muted-foreground">
                  Extract headings, sections, tables, and other structural elements
                </p>
              </div>
              
              {!structureExtraction && (
                <Button 
                  onClick={() => {
                    setExtractionType('structure');
                    handleExtract();
                  }}
                  disabled={extractMutation.isPending}
                >
                  {extractMutation.isPending && extractionType === 'structure' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Extract Structure
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <Separator />
            
            {structureExtraction ? (
              <div className="rounded-md border bg-card">
                <div className="px-4 py-3 border-b bg-muted/50 flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span className="font-medium">Structure Extracted</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({Math.round(structureExtraction.confidence * 100)}% confidence)
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Processed in {structureExtraction.processingTime.toFixed(2)}s
                  </span>
                </div>
                <ScrollArea className="h-[300px]">
                  <pre className="p-4 text-xs font-mono overflow-auto">
                    {formatResults(structureExtraction.results)}
                  </pre>
                </ScrollArea>
              </div>
            ) : isLoadingExtraction ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span>Loading extraction results...</span>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 p-8 text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Structure Data Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Extract the document structure to identify headings, sections, paragraphs, and tables.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="content" className="mt-0 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Content Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Extract entities, keywords, and categorize document content
                </p>
              </div>
              
              {!contentExtraction && (
                <Button 
                  onClick={() => {
                    setExtractionType('content');
                    handleExtract();
                  }}
                  disabled={extractMutation.isPending}
                >
                  {extractMutation.isPending && extractionType === 'content' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Analyze Content
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <Separator />
            
            {contentExtraction ? (
              <div className="rounded-md border bg-card">
                <div className="px-4 py-3 border-b bg-muted/50 flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span className="font-medium">Content Analyzed</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({Math.round(contentExtraction.confidence * 100)}% confidence)
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Processed in {contentExtraction.processingTime.toFixed(2)}s
                  </span>
                </div>
                <ScrollArea className="h-[300px]">
                  <pre className="p-4 text-xs font-mono overflow-auto">
                    {formatResults(contentExtraction.results)}
                  </pre>
                </ScrollArea>
              </div>
            ) : isLoadingExtraction ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span>Loading analysis results...</span>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 p-8 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Content Analysis Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Analyze content to extract entities, determine categories, and identify key information.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="knowledge" className="mt-0 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Knowledge Graph</h3>
                <p className="text-sm text-muted-foreground">
                  Extract concepts and their relationships to build a knowledge graph
                </p>
              </div>
              
              {!knowledgeExtraction && (
                <Button 
                  onClick={() => {
                    setExtractionType('knowledge');
                    handleExtract();
                  }}
                  disabled={extractMutation.isPending}
                >
                  {extractMutation.isPending && extractionType === 'knowledge' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Build Knowledge Graph
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <Separator />
            
            {knowledgeExtraction ? (
              <div className="rounded-md border bg-card">
                <div className="px-4 py-3 border-b bg-muted/50 flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span className="font-medium">Knowledge Graph Built</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({Math.round(knowledgeExtraction.confidence * 100)}% confidence)
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Processed in {knowledgeExtraction.processingTime.toFixed(2)}s
                  </span>
                </div>
                <ScrollArea className="h-[300px]">
                  <pre className="p-4 text-xs font-mono overflow-auto">
                    {formatResults(knowledgeExtraction.results)}
                  </pre>
                </ScrollArea>
              </div>
            ) : isLoadingExtraction ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span>Loading knowledge graph data...</span>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 p-8 text-center">
                <ListTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Knowledge Graph Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Build a knowledge graph to visualize concepts and relationships found in the document.
                </p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Select value={extractionType} onValueChange={setExtractionType}>
          <Label className="mr-2">Extraction Type:</Label>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="structure">Structure</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="knowledge">Knowledge Graph</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleExtract}
          disabled={extractMutation.isPending}
        >
          {extractMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Extract Document Data</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}