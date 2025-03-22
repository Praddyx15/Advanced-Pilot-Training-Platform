import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import GraphVisualization, { KnowledgeGraphData, GraphNode } from '@/components/knowledge-graph/graph-visualization';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Info, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layouts/app-layout';

export default function KnowledgeGraphPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('document');
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [programId, setProgramId] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Fetch documents for the document graph
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/documents');
      return await response.json();
    },
  });

  // Fetch programs for the program graph
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/programs');
      return await response.json();
    },
  });

  // Fetch knowledge graph for a specific document
  const { 
    data: documentGraph, 
    isLoading: documentGraphLoading,
    refetch: refetchDocumentGraph 
  } = useQuery({
    queryKey: ['/api/knowledge-graph/document', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const response = await apiRequest('GET', `/api/knowledge-graph/document/${documentId}`);
      return await response.json();
    },
    enabled: !!documentId,
  });

  // Fetch knowledge graph for a specific program
  const { 
    data: programGraph, 
    isLoading: programGraphLoading,
    refetch: refetchProgramGraph 
  } = useQuery({
    queryKey: ['/api/knowledge-graph/program', programId],
    queryFn: async () => {
      if (!programId) return null;
      const response = await apiRequest('GET', `/api/knowledge-graph/program/${programId}`);
      return await response.json();
    },
    enabled: !!programId,
  });

  // Automatically select first document/program if available
  useEffect(() => {
    if (documents?.length && !documentId) {
      setDocumentId(documents[0].id);
    }
    if (programs?.length && !programId) {
      setProgramId(programs[0].id);
    }
  }, [documents, programs, documentId, programId]);

  // Handle graph regeneration
  const handleRegenerateGraph = async () => {
    try {
      if (activeTab === 'document' && documentId) {
        const response = await apiRequest('POST', `/api/knowledge-graph/document/${documentId}/generate`);
        if (response.ok) {
          toast({
            title: 'Knowledge graph generation started',
            description: 'This may take a few moments to complete.',
          });
          refetchDocumentGraph();
        }
      } else if (activeTab === 'program' && programId) {
        const response = await apiRequest('POST', `/api/knowledge-graph/program/${programId}/generate`);
        if (response.ok) {
          toast({
            title: 'Knowledge graph generation started',
            description: 'This may take a few moments to complete.',
          });
          refetchProgramGraph();
        }
      }
    } catch (error) {
      toast({
        title: 'Error generating knowledge graph',
        description: 'There was a problem generating the knowledge graph. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle node click
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  // Graph data based on selected tab
  const graphData: KnowledgeGraphData = {
    nodes: (activeTab === 'document' ? documentGraph?.nodes : programGraph?.nodes) || [],
    edges: (activeTab === 'document' ? documentGraph?.edges : programGraph?.edges) || [],
  };

  const isLoading = 
    (activeTab === 'document' && (documentsLoading || documentGraphLoading)) || 
    (activeTab === 'program' && (programsLoading || programGraphLoading));

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Knowledge Graph</h1>
            <p className="text-muted-foreground">
              Visualize knowledge relationships between concepts, documents, and training programs
            </p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>About Knowledge Graphs</AlertDialogTitle>
                <AlertDialogDescription>
                  Knowledge graphs visualize the connections between different training elements. You can:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>View connections between concepts in documents</li>
                    <li>Explore relationships between training modules</li>
                    <li>Filter by node types and relationship types</li>
                    <li>Zoom and pan to navigate complex graphs</li>
                    <li>Click nodes to see detailed information</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Got it</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="document">Document Graphs</TabsTrigger>
              <TabsTrigger value="program">Program Graphs</TabsTrigger>
            </TabsList>

            <TabsContent value="document" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Document Knowledge Graph</CardTitle>
                  <CardDescription>
                    Visualize concepts, entities and relationships extracted from documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <Select
                        value={documentId?.toString() || ''}
                        onValueChange={(value) => setDocumentId(parseInt(value))}
                        disabled={documentsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a document" />
                        </SelectTrigger>
                        <SelectContent>
                          {documents?.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id.toString()}>
                              {doc.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleRegenerateGraph} 
                      disabled={!documentId || documentGraphLoading}
                    >
                      {documentGraphLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : 'Generate Graph'}
                    </Button>
                  </div>

                  <div className="flex justify-center">
                    <GraphVisualization 
                      data={graphData}
                      width={800}
                      height={500}
                      isLoading={isLoading}
                      onNodeClick={handleNodeClick}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="program" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Program Knowledge Graph</CardTitle>
                  <CardDescription>
                    Visualize modules, lessons, competencies and their relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <Select
                        value={programId?.toString() || ''}
                        onValueChange={(value) => setProgramId(parseInt(value))}
                        disabled={programsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a training program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs?.map((program) => (
                            <SelectItem key={program.id} value={program.id.toString()}>
                              {program.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleRegenerateGraph} 
                      disabled={!programId || programGraphLoading}
                    >
                      {programGraphLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : 'Generate Graph'}
                    </Button>
                  </div>

                  <div className="flex justify-center">
                    <GraphVisualization 
                      data={graphData}
                      width={800}
                      height={500}
                      isLoading={isLoading}
                      onNodeClick={handleNodeClick}
                      colorScheme="category"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {selectedNode && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle>Selected Node: {selectedNode.content}</CardTitle>
              <CardDescription>
                Type: {selectedNode.type} | Importance: {selectedNode.importance?.toFixed(2) || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Node Details</h4>
                  <div className="text-sm text-muted-foreground">
                    {selectedNode.content}
                  </div>
                </div>

                {selectedNode.metadata && (
                  <div>
                    <h4 className="font-medium mb-1">Metadata</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedNode.metadata).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium mr-2">{key}:</span>
                          <span className="text-muted-foreground">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedNode(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!graphData.nodes.length && !isLoading && (
          <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Knowledge Graph Available</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Select a document or program and click "Generate Graph" to create a knowledge graph visualization.
            </p>
            <Button onClick={handleRegenerateGraph} disabled={(!documentId && activeTab === 'document') || (!programId && activeTab === 'program')}>
              Generate Knowledge Graph
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}