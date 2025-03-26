import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, ChevronLeft, Loader2, AlertTriangle,
  Calendar, Clock, User, FileBarChart,
  FileSpreadsheet, FileQuestion, FilePlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DocumentExtractor } from './document-extractor';
import { DocumentFormGenerator } from './document-form-generator';
import { Link, useRoute } from 'wouter';
import { formatDistanceToNow, format } from 'date-fns';
import { UploadedDocument } from './document-uploader';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentDetailPage() {
  // In a real app, we'd get this from the URL
  const [, params] = useRoute<{ id: string }>('/documents/:id');
  const documentId = params?.id ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState('details');
  
  const { data: document, isLoading, error } = useQuery<UploadedDocument>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId,
  });
  
  if (isLoading) {
    return (
      <div className="container py-6 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }
  
  if (error || !document) {
    return (
      <div className="container py-6 max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/documents">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold ml-2">Document Not Found</h1>
        </div>
        
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h2 className="text-lg font-medium">Error Loading Document</h2>
            <p>The document could not be found or you don't have permission to access it.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/documents">Back to Documents</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const getFileIcon = () => {
    const fileType = document.fileType.toLowerCase();
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-12 w-12 text-red-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-12 w-12 text-green-500" />;
      default:
        return <FileQuestion className="h-12 w-12 text-gray-500" />;
    }
  };
  
  return (
    <div className="container py-6 max-w-7xl mx-auto space-y-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/documents">Documents</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="truncate max-w-[200px] inline-block">
                {document.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-start mt-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <h1 className="text-2xl font-bold">{document.title}</h1>
                <p className="text-muted-foreground">{document.fileName} • {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{format(new Date(document.createdAt), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{format(new Date(document.createdAt), 'h:mm a')}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-1" />
                <span>Uploaded by {document.uploadedByRole}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <FileBarChart className="h-4 w-4 mr-1" />
                <span>Status: {document.isProcessed ? 'Processed' : 'Pending Processing'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/documents/upload">
                <FilePlus className="h-4 w-4 mr-2" />
                Upload New
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/documents">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Document Details</TabsTrigger>
          <TabsTrigger value="extract">Extract Content</TabsTrigger>
          <TabsTrigger value="generate">Generate Forms</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Document Information</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Title:</div>
                  <div>{document.title}</div>
                  
                  <div className="font-medium">File Name:</div>
                  <div>{document.fileName}</div>
                  
                  <div className="font-medium">File Type:</div>
                  <div>{document.fileType.toUpperCase()}</div>
                  
                  <div className="font-medium">Size:</div>
                  <div>{formatBytes(document.fileSize)}</div>
                  
                  <div className="font-medium">Upload Date:</div>
                  <div>{format(new Date(document.createdAt), 'PPP')}</div>
                  
                  <div className="font-medium">Status:</div>
                  <div>{document.isProcessed ? 'Processed' : 'Pending Processing'}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Document Preview</h2>
                <div className="border rounded-md h-64 flex items-center justify-center bg-muted/50">
                  {getFileIcon()}
                  <p className="ml-2 text-muted-foreground">Preview not available in this version</p>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    Download Document
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Related Content</h2>
              <div className="text-center py-8 border rounded-md">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No related content available</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('extract')}>
                  Extract Document Content
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="extract">
            <DocumentExtractor documentId={documentId} />
          </TabsContent>
          
          <TabsContent value="generate">
            <DocumentFormGenerator documentId={documentId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Utility function to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}