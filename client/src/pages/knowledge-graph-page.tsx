import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import KnowledgeGraphViewer from "@/components/knowledge-graph/knowledge-graph-viewer";
import { 
  Loader2, 
  FileText, 
  BarChart, 
  Network, 
  Search 
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export default function KnowledgeGraphPage() {
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch documents to allow filtering knowledge graph by document
  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Error",
          description: "Failed to load documents. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  const filteredDocuments = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Handle document selection
  const handleDocumentChange = (documentId: string) => {
    setSelectedDocumentId(parseInt(documentId));
  };
  
  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
        <p className="text-muted-foreground">
          Visualize and explore connections between concepts, competencies, and training materials.
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 max-w-xs">
          <Select 
            value={selectedDocumentId?.toString() || "all"} 
            onValueChange={handleDocumentChange}
            disabled={documentsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Knowledge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Knowledge</SelectItem>
              {filteredDocuments.map(doc => (
                <SelectItem key={doc.id} value={doc.id.toString()}>
                  {doc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">
            <Network className="h-4 w-4 mr-2" />
            Knowledge Graph
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="flex-1 min-h-0 mt-4">
          <Card className="flex-1 h-full">
            <CardContent className="p-0 h-full">
              <div className="h-full max-h-[calc(100vh-240px)]">
                <KnowledgeGraphViewer 
                  documentId={selectedDocumentId || undefined}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Analysis</CardTitle>
              <CardDescription>
                View documents that have been analyzed and contributed to the knowledge graph.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredDocuments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments.map(doc => (
                    <Card key={doc.id} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base truncate">{doc.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {doc.fileType && <span className="capitalize">{doc.fileType}</span>}
                          <span> • {new Date().toLocaleDateString()}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {doc.description ? "Analyzed" : "Not analyzed"}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocumentId(doc.id);
                              setActiveTab("all");
                            }}
                          >
                            View Graph
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No documents found</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Upload and analyze documents to build your knowledge graph.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Graph Statistics</CardTitle>
              <CardDescription>
                Overview of your knowledge graph structure and insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardDescription>Total Concepts</CardDescription>
                    <CardTitle className="text-3xl">248</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardDescription>Total Relationships</CardDescription>
                    <CardTitle className="text-3xl">412</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardDescription>Documents Analyzed</CardDescription>
                    <CardTitle className="text-3xl">17</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardDescription>Average Connections</CardDescription>
                    <CardTitle className="text-3xl">3.3</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}