import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Document } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KnowledgeGraphViewer from '@/components/knowledge-graph/knowledge-graph-viewer';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function KnowledgeGraphPage() {
  const { user } = useAuth();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | undefined>(undefined);
  const [nodeType, setNodeType] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('graph');

  // Fetch documents for the filter dropdown
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    enabled: !!user,
  });

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Knowledge Graph</h1>
      <p className="text-muted-foreground mb-8">
        Visualize relationships between concepts, competencies, and regulatory requirements across your training materials.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Filter Controls</CardTitle>
            <CardDescription>Filter the knowledge graph by document or node type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document">Source Document</Label>
              {isLoadingDocuments ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading documents...</span>
                </div>
              ) : (
                <Select
                  value={selectedDocumentId?.toString() || ''}
                  onValueChange={(value) => setSelectedDocumentId(value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger id="document">
                    <SelectValue placeholder="All documents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All documents</SelectItem>
                    {documents?.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nodeType">Node Type</Label>
              <Select
                value={nodeType || ''}
                onValueChange={(value) => setNodeType(value || undefined)}
              >
                <SelectTrigger id="nodeType">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="concept">Concepts</SelectItem>
                  <SelectItem value="competency">Competencies</SelectItem>
                  <SelectItem value="regulation">Regulations</SelectItem>
                  <SelectItem value="lesson">Lessons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="graph">Graph View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="graph">
              <KnowledgeGraphViewer 
                documentId={selectedDocumentId} 
                nodeType={nodeType}
                height={600}
              />
            </TabsContent>
            
            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Graph Elements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    List view of knowledge graph elements will be implemented in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Understanding the Knowledge Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            The knowledge graph visualizes the relationships between different training elements:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><span className="font-semibold">Concepts</span> - Core ideas and principles in the training program</li>
            <li><span className="font-semibold">Competencies</span> - Skills and abilities trainees need to demonstrate</li>
            <li><span className="font-semibold">Regulations</span> - Regulatory requirements that must be satisfied</li>
            <li><span className="font-semibold">Lessons</span> - Specific training activities that teach concepts</li>
          </ul>
          <p className="mt-4">
            Relationships between nodes show dependencies, prerequisites, and connections between different training elements.
            These relationships are extracted automatically from your training documents and syllabus materials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}