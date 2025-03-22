import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  ArrowLeft, 
  Search, 
  FileUp, 
  Filter, 
  Plus, 
  FileCog, 
  Trash2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import DocumentCard from '@/components/documents/document-card';
import { DocumentDetailDialog } from '@/components/documents/document-detail';
import { Document } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';

export default function DocumentsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentTab, setCurrentTab] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTags, setUploadTags] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [documentToAnalyze, setDocumentToAnalyze] = useState<Document | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Fetch documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    enabled: !!user,
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    },
  });

  // Upload document mutation
  const { mutate: uploadDocument, isPending: isUploading } = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest('POST', '/api/documents/upload', formData, {
        skipContentType: true
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadTags('');
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to upload document: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete document mutation
  const { mutate: deleteDocument, isPending: isDeleting } = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      setDocumentToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete document: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Analyze document mutation
  const { mutate: analyzeDocument, isPending: isAnalyzing } = useMutation({
    mutationFn: async (documentId: number) => {
      const res = await apiRequest('POST', `/api/documents/${documentId}/analyze`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Analysis Started',
        description: 'Document analysis has been initiated',
      });
      setDocumentToAnalyze(null);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to analyze document: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const filteredDocuments = documents
    ? documents.filter((doc: Document) => {
        const matchesSearch = !searchQuery || 
          doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        
        const matchesType = filterType === 'all' || doc.fileType === filterType;
        
        const matchesTab = currentTab === 'all' || 
          (currentTab === 'regulatory' && doc.tags && doc.tags.includes('regulatory')) ||
          (currentTab === 'training' && doc.tags && doc.tags.includes('training')) ||
          (currentTab === 'analysis' && doc.documentAnalysisId);
        
        return matchesSearch && matchesType && matchesTab;
      })
    : [];

  const handleUpload = () => {
    if (!uploadFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('uploadedBy', user!.id.toString());
    
    if (uploadTags) {
      formData.append('tags', uploadTags);
    }

    uploadDocument(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleDocumentView = (document: Document) => {
    // In a real app, this would open the document viewer
    toast({
      title: 'Viewing Document',
      description: `Opening ${document.fileName}...`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">
            Upload, manage, and analyze your training documents
          </p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => setLocation('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileUp className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a new document to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                  />
                  {uploadFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="regulatory, training, manual, etc."
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={isUploading || !uploadFile}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>Upload</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Browse, search, and manage your document library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documents by name, description, or tags..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="doc">Word</SelectItem>
                    <SelectItem value="xls">Excel</SelectItem>
                    <SelectItem value="ppt">PowerPoint</SelectItem>
                    <SelectItem value="txt">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
                <TabsTrigger value="training">Training Materials</TabsTrigger>
                <TabsTrigger value="analysis">Analyzed</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                {renderDocumentGrid()}
              </TabsContent>
              
              <TabsContent value="regulatory" className="mt-0">
                {renderDocumentGrid()}
              </TabsContent>
              
              <TabsContent value="training" className="mt-0">
                {renderDocumentGrid()}
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-0">
                {renderDocumentGrid()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Document Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document "{documentToDelete?.fileName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => documentToDelete && deleteDocument(documentToDelete.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Analysis Confirmation Dialog */}
      <AlertDialog open={!!documentToAnalyze} onOpenChange={(open) => !open && setDocumentToAnalyze(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analyze Document</AlertDialogTitle>
            <AlertDialogDescription>
              Start an AI-powered analysis of "{documentToAnalyze?.fileName}"? This will extract key information, identify regulatory requirements, and generate metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => documentToAnalyze && analyzeDocument(documentToAnalyze.id)}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileCog className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function renderDocumentGrid() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!filteredDocuments || filteredDocuments.length === 0) {
      return (
        <div className="text-center py-12 border rounded-md bg-muted/10">
          <div className="flex justify-center mb-4">
            <FileUp className="h-16 w-16 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No documents found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterType !== 'all' || currentTab !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first document to get started'}
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredDocuments.map((document: Document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onView={handleDocumentView}
            onDelete={setDocumentToDelete}
            onAnalyze={setDocumentToAnalyze}
          />
        ))}
      </div>
    );
  }
}