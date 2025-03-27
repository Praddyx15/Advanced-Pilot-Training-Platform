import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  File, FileText, FileSpreadsheet, PresentationIcon, FileArchive, 
  Search, MoreVertical, Eye, ArrowUpDown, Download, Trash2, Clock, 
  Filter, CheckCircle2, BookOpenCheck, BookOpen, Brain, 
  CalendarDays, FilePlus2, FileSearch, BarChart3, Database, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { UploadedDocument } from './document-uploader';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function DocumentList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<keyof UploadedDocument>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<UploadedDocument | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeDocument, setActiveDocument] = useState<UploadedDocument | null>(null);
  const { toast } = useToast();

  // Fetch documents
  const { data: documents, isLoading, error } = useQuery<UploadedDocument[]>({
    queryKey: ['/api/documents'],
    // Use default fetcher
  });
  
  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest(
        'DELETE',
        `/api/documents/${documentId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: "The document has been permanently deleted.",
        variant: "default",
      });
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete document: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Extract data from document mutation
  const extractDataMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest(
        'POST',
        `/api/documents/${documentId}/extract`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Data extraction complete",
        description: "Document data has been successfully extracted.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction failed",
        description: `Failed to extract data: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Generate session plan mutation
  const generateSessionPlanMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest(
        'POST',
        `/api/documents/${documentId}/generate-session-plan`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Session plan generated",
        description: "A new training session plan has been created from the document.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: `Failed to generate session plan: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handler for document download
  const handleDownload = (document: UploadedDocument) => {
    toast({
      title: "Download started",
      description: `Downloading ${document.fileName}...`,
    });
    
    // Create download link
    const downloadLink = `/api/documents/${document.id}/download`;
    const link = window.document.createElement('a');
    link.href = downloadLink;
    link.setAttribute('download', document.fileName);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };
  
  // Confirmation for document deletion
  const confirmDelete = (document: UploadedDocument) => {
    setDocumentToDelete(document);
    setShowDeleteConfirm(true);
  };
  
  // View document details
  const viewDocumentDetails = (document: UploadedDocument) => {
    // Redirect to document detail page
    window.location.href = `/documents/${document.id}`;
  };

  // Define file type icons
  const fileIcons: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-5 w-5 text-red-500" />,
    docx: <File className="h-5 w-5 text-blue-500" />,
    xlsx: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
    pptx: <PresentationIcon className="h-5 w-5 text-orange-500" />,
    txt: <FileText className="h-5 w-5 text-gray-500" />,
    default: <FileArchive className="h-5 w-5 text-gray-500" />
  };

  // Get the appropriate icon for a file type
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase().replace('.', '');
    return fileIcons[type] || fileIcons.default;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy, h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Sort and filter documents
  const getSortedAndFilteredDocuments = () => {
    if (!documents) return [];
    
    let filteredDocs = [...documents];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredDocs = filteredDocs.filter(doc => 
        doc.title.toLowerCase().includes(query) || 
        doc.fileName.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filteredDocs = filteredDocs.filter(doc => {
        if (statusFilter === 'processed') return doc.isProcessed;
        if (statusFilter === 'pending') return !doc.isProcessed;
        return true;
      });
    }
    
    // Sort
    return filteredDocs.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Handle dates
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        const aDate = new Date(a[sortBy] as string).getTime();
        const bDate = new Date(b[sortBy] as string).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      // Handle numbers
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    });
  };

  // Handle sort click
  const handleSort = (column: keyof UploadedDocument) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Handle status filter
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status === statusFilter ? null : status);
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Your uploaded training documents and manuals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="rounded-md border">
            <div className="p-2">
              <Skeleton className="h-10 w-full" />
            </div>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-2 border-t">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error loading documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was an error loading your documents. Please try again later.</p>
          <pre className="bg-muted p-2 rounded mt-2 text-xs">{(error as Error).message}</pre>
        </CardContent>
      </Card>
    );
  }

  const sortedDocuments = getSortedAndFilteredDocuments();

  return (
    <Card>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{documentToDelete?.title}</span> and all its extracted data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDelete) {
                  deleteMutation.mutate(documentToDelete.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Your uploaded training documents and manuals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Status
                  {statusFilter && (
                    <Badge variant="secondary" className="ml-2">
                      {statusFilter}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => handleStatusFilter('processed')}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Processed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilter('pending')}>
                  <Clock className="mr-2 h-4 w-4 text-amber-500" />
                  Pending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {documents && documents.length === 0 ? (
          <div className="text-center p-8 border rounded-md">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-muted-foreground mt-2">
              Upload your first document to get started.
            </p>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="text-center p-8 border rounded-md">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No matching documents</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-[200px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('title')}
                      className="-ml-4 h-8 font-medium"
                    >
                      Document
                      {sortBy === 'title' && (
                        <ArrowUpDown className={cn(
                          "ml-2 h-4 w-4",
                          sortOrder === 'asc' ? "rotate-0" : "rotate-180"
                        )} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('fileSize')}
                      className="-ml-3 h-8 font-medium"
                    >
                      Size
                      {sortBy === 'fileSize' && (
                        <ArrowUpDown className={cn(
                          "ml-2 h-4 w-4",
                          sortOrder === 'asc' ? "rotate-0" : "rotate-180"
                        )} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('createdAt')}
                      className="-ml-3 h-8 font-medium"
                    >
                      Uploaded
                      {sortBy === 'createdAt' && (
                        <ArrowUpDown className={cn(
                          "ml-2 h-4 w-4",
                          sortOrder === 'asc' ? "rotate-0" : "rotate-180"
                        )} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex justify-center">
                        {getFileIcon(doc.fileType)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[200px] sm:max-w-[300px]">
                        {doc.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                        {doc.fileName}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.fileType.toUpperCase().replace('.', '')}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {doc.isProcessed ? (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Processed
                        </Badge>
                      ) : doc.processingStatus === 'processing' ? (
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          <Clock className="mr-1 h-3 w-3 animate-pulse" />
                          Processing
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {formatDate(doc.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewDocumentDetails(doc)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setActiveDocument(doc);
                              extractDataMutation.mutate(doc.id);
                            }}
                            disabled={doc.isProcessed || extractDataMutation.isPending}
                          >
                            <FileSearch className="mr-2 h-4 w-4" />
                            Extract Data
                            {extractDataMutation.isPending && doc.id === activeDocument?.id && (
                              <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setActiveDocument(doc);
                              generateSessionPlanMutation.mutate(doc.id);
                            }}
                            disabled={!doc.isProcessed || generateSessionPlanMutation.isPending}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Generate Session Plan
                            {generateSessionPlanMutation.isPending && doc.id === activeDocument?.id && (
                              <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => confirmDelete(doc)}
                            className="text-destructive"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                            {deleteMutation.isPending && doc.id === documentToDelete?.id && (
                              <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}