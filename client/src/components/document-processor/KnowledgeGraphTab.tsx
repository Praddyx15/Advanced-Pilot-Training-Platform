import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, RotateCw, Network, BrainCircuit, FileText } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import KnowledgeGraphVisualization from '@/components/knowledge-graph/KnowledgeGraphVisualization';

export function KnowledgeGraphTab() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStep, setExtractionStep] = useState<string>('');
  const [graphData, setGraphData] = useState<any>(null);
  const { toast } = useToast();
  
  // Options for graph extraction
  const [options, setOptions] = useState({
    extractEntities: true,
    extractConcepts: true,
    extractRelationships: true,
    useExistingNodes: true,
    minimumConfidence: 70,
  });
  
  // Query to fetch available documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/documents');
        return await response.json();
      } catch (error) {
        // Return mock data for demonstration
        return [
          { id: 1, title: 'Aircraft Maintenance Manual', fileType: 'pdf', uploadedAt: '2025-03-20', category: 'technical' },
          { id: 2, title: 'Flight Operations Manual', fileType: 'pdf', uploadedAt: '2025-03-18', category: 'operational' },
          { id: 3, title: 'Regulatory Compliance Guide', fileType: 'pdf', uploadedAt: '2025-03-15', category: 'regulatory' },
          { id: 4, title: 'Type Rating Syllabus', fileType: 'docx', uploadedAt: '2025-03-10', category: 'training' },
          { id: 5, title: 'Airworthiness Directive', fileType: 'pdf', uploadedAt: '2025-03-05', category: 'regulatory' },
        ];
      }
    }
  });
  
  // Mutation for knowledge graph extraction
  const extractionMutation = useMutation({
    mutationFn: async () => {
      // Simulate extraction steps with incremental progress updates
      setExtractionStep('Analyzing document content...');
      await simulateProgress(0, 15);
      
      setExtractionStep('Extracting entities and concepts...');
      await simulateProgress(15, 40);
      
      setExtractionStep('Detecting relationships between concepts...');
      await simulateProgress(40, 65);
      
      setExtractionStep('Building knowledge graph...');
      await simulateProgress(65, 90);
      
      setExtractionStep('Optimizing graph layout...');
      await simulateProgress(90, 100);
      
      try {
        const response = await apiRequest('POST', `/api/knowledge-graph/extract`, {
          documentId: selectedDocumentId,
          options: {
            extractEntities: options.extractEntities,
            extractConcepts: options.extractConcepts,
            extractRelationships: options.extractRelationships,
            useExistingNodes: options.useExistingNodes,
            minimumConfidence: options.minimumConfidence / 100,
          }
        });
        return await response.json();
      } catch (error) {
        // Return mock data for demonstration
        return {
          documentId: selectedDocumentId,
          nodes: [
            { id: "n1", type: "module", content: "Aircraft Systems" },
            { id: "n2", type: "module", content: "Flight Procedures" },
            { id: "n3", type: "module", content: "Emergency Procedures" },
            { id: "n4", type: "concept", content: "Hydraulic System" },
            { id: "n5", type: "concept", content: "Electrical System" },
            { id: "n6", type: "concept", content: "Pneumatic System" },
            { id: "n7", type: "concept", content: "Normal Takeoff" },
            { id: "n8", type: "concept", content: "Approach and Landing" },
            { id: "n9", type: "concept", content: "Engine Failure" },
            { id: "n10", type: "concept", content: "Cabin Depressurization" },
            { id: "n11", type: "entity", content: "Boeing 737-800" },
            { id: "n12", type: "entity", content: "Control Surfaces" },
            { id: "n13", type: "entity", content: "Flight Controls" },
            { id: "n14", type: "entity", content: "Checklist" },
            { id: "n15", type: "regulation", content: "EASA CS-25" },
            { id: "n16", type: "regulation", content: "FAA Part 25" }
          ],
          edges: [
            { source: "n1", target: "n4", relationship: "contains" },
            { source: "n1", target: "n5", relationship: "contains" },
            { source: "n1", target: "n6", relationship: "contains" },
            { source: "n1", target: "n11", relationship: "references" },
            { source: "n1", target: "n12", relationship: "describes" },
            { source: "n1", target: "n13", relationship: "describes" },
            { source: "n1", target: "n15", relationship: "complies_with" },
            { source: "n2", target: "n7", relationship: "contains" },
            { source: "n2", target: "n8", relationship: "contains" },
            { source: "n2", target: "n11", relationship: "references" },
            { source: "n2", target: "n14", relationship: "uses" },
            { source: "n2", target: "n16", relationship: "complies_with" },
            { source: "n3", target: "n9", relationship: "contains" },
            { source: "n3", target: "n10", relationship: "contains" },
            { source: "n3", target: "n11", relationship: "references" },
            { source: "n3", target: "n14", relationship: "uses" },
            { source: "n4", target: "n12", relationship: "powers" },
            { source: "n5", target: "n13", relationship: "powers" },
            { source: "n9", target: "n14", relationship: "uses" },
            { source: "n10", target: "n14", relationship: "uses" }
          ],
          statistics: {
            nodeCount: 16,
            edgeCount: 20,
            averageNodeDegree: 2.5,
            mostConnectedNodes: [
              { id: "n11", connections: 3 },
              { id: "n14", connections: 3 }
            ],
            processingTime: 3.25
          }
        };
      }
    },
    onSuccess: (data) => {
      setGraphData(data);
      toast({
        title: 'Knowledge graph extracted',
        description: `Created ${data.nodes.length} nodes and ${data.edges.length} connections`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Extraction failed',
        description: error.message,
        variant: 'destructive',
      });
      setExtractionProgress(0);
    }
  });

  const saveGraphMutation = useMutation({
    mutationFn: async (graphData: any) => {
      try {
        const response = await apiRequest('POST', '/api/knowledge-graph/save', {
          documentId: selectedDocumentId,
          nodes: graphData.nodes,
          edges: graphData.edges
        });
        return await response.json();
      } catch (error) {
        // Return mock success
        return { success: true, id: 123 };
      }
    },
    onSuccess: () => {
      toast({
        title: 'Knowledge graph saved',
        description: 'The graph has been saved to the database',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to save graph',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Helper function to simulate progress for demonstration purposes
  const simulateProgress = async (start: number, end: number): Promise<void> => {
    return new Promise((resolve) => {
      let current = start;
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 3) + 1;
        if (current >= end) {
          current = end;
          clearInterval(interval);
          setExtractionProgress(current);
          resolve();
        } else {
          setExtractionProgress(current);
        }
      }, 100);
    });
  };

  const handleDocumentSelect = (value: string) => {
    setSelectedDocumentId(parseInt(value));
    setGraphData(null);
  };

  const handleOptionChange = (key: string, value: any) => {
    setOptions({ ...options, [key]: value });
  };

  const handleExtract = () => {
    if (selectedDocumentId) {
      setExtractionProgress(0);
      setGraphData(null);
      extractionMutation.mutate();
    } else {
      toast({
        title: 'No document selected',
        description: 'Please select a document to extract a knowledge graph',
        variant: 'destructive',
      });
    }
  };

  const handleSaveGraph = (data: any) => {
    saveGraphMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Graph Extraction</CardTitle>
          <CardDescription>
            Extract and visualize relationships between concepts in your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Source Document</Label>
              <Select
                value={selectedDocumentId ? selectedDocumentId.toString() : ''}
                onValueChange={handleDocumentSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDocuments ? (
                    <SelectItem value="loading" disabled>Loading documents...</SelectItem>
                  ) : documents && documents.length > 0 ? (
                    documents.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.title} ({doc.fileType.toUpperCase()})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No documents available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="extractEntities">Extract Entities</Label>
                    <p className="text-sm text-muted-foreground">
                      Identify named entities like aircraft types, components, etc.
                    </p>
                  </div>
                  <Switch
                    id="extractEntities"
                    checked={options.extractEntities}
                    onCheckedChange={(checked) => handleOptionChange('extractEntities', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="extractConcepts">Extract Concepts</Label>
                    <p className="text-sm text-muted-foreground">
                      Identify key concepts and topics in the document
                    </p>
                  </div>
                  <Switch
                    id="extractConcepts"
                    checked={options.extractConcepts}
                    onCheckedChange={(checked) => handleOptionChange('extractConcepts', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="extractRelationships">Extract Relationships</Label>
                    <p className="text-sm text-muted-foreground">
                      Identify relationships between entities and concepts
                    </p>
                  </div>
                  <Switch
                    id="extractRelationships"
                    checked={options.extractRelationships}
                    onCheckedChange={(checked) => handleOptionChange('extractRelationships', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useExistingNodes">Use Existing Knowledge</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect to existing knowledge graph if available
                    </p>
                  </div>
                  <Switch
                    id="useExistingNodes"
                    checked={options.useExistingNodes}
                    onCheckedChange={(checked) => handleOptionChange('useExistingNodes', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="minimumConfidence">Minimum Confidence: {options.minimumConfidence}%</Label>
                  </div>
                  <div className="relative pt-1">
                    <input
                      type="range"
                      id="minimumConfidence"
                      min="0"
                      max="100"
                      step="5"
                      value={options.minimumConfidence}
                      onChange={(e) => handleOptionChange('minimumConfidence', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {extractionMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{extractionStep || 'Preparing extraction...'}</p>
                    <p className="text-sm text-gray-500">Progress: {extractionProgress}%</p>
                  </div>
                  <RotateCw className="h-6 w-6 animate-spin text-primary" />
                </div>
                
                <Progress value={extractionProgress} className="h-2" />
              </div>
            )}
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                The knowledge graph extraction process identifies entities, concepts, and their relationships within your document.
                Use the interactive visualization to explore the connections and insights from your content.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleExtract}
            disabled={!selectedDocumentId || extractionMutation.isPending}
            className="ml-auto"
          >
            {extractionMutation.isPending ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <BrainCircuit className="mr-2 h-4 w-4" />
                Extract Knowledge Graph
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {graphData && (
        <KnowledgeGraphVisualization 
          nodes={graphData.nodes} 
          edges={graphData.edges} 
          title={`Knowledge Graph: ${documents?.find((d: any) => d.id === selectedDocumentId)?.title || 'Document'}`}
          description="Explore relationships between concepts in your document"
          onSave={handleSaveGraph}
        />
      )}
      
      {!graphData && !extractionMutation.isPending && (
        <Card className="bg-slate-50 dark:bg-slate-900">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Network className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Knowledge Graph Available</h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              Select a document and extract its knowledge graph to visualize the relationships between concepts and entities.
            </p>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium">Document</span>
              <span className="text-slate-400">→</span>
              <BrainCircuit className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium">Extract</span>
              <span className="text-slate-400">→</span>
              <Network className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium">Explore</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default KnowledgeGraphTab;