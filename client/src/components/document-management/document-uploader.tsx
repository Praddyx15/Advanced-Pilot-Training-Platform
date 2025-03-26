import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUp, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// TypeScript interfaces
export interface UploadedDocument {
  id: number;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  isProcessed: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedById: number;
  createdAt: string;
  updatedAt: string;
}

interface DocumentUploaderProps {
  onUploadComplete?: (document: UploadedDocument) => void;
}

export function DocumentUploader({ onUploadComplete }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/documents/upload', formData, {
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      return await response.json() as UploadedDocument;
    },
    onSuccess: (data) => {
      setUploading(false);
      setSelectedFile(null);
      setCustomTitle('');
      setUploadProgress(0);
      
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      toast({
        title: "Document uploaded successfully",
        description: `${data.title} has been uploaded and is being processed.`,
        variant: "default",
      });
      
      if (onUploadComplete) {
        onUploadComplete(data);
      }
    },
    onError: (error: Error) => {
      setUploading(false);
      setUploadProgress(0);
      
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      // Set default title from filename (without extension)
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
      setCustomTitle(defaultTitle);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', customTitle || selectedFile.name.replace(/\.[^/.]+$/, ""));
    
    uploadMutation.mutate(formData);
  };

  // Format file size in a readable way
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon/color based on extension
  const getFileTypeInfo = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'pdf':
        return { color: 'text-red-500', name: 'PDF' };
      case 'docx':
        return { color: 'text-blue-500', name: 'Word Document' };
      case 'xlsx':
        return { color: 'text-green-500', name: 'Excel Spreadsheet' };
      case 'pptx':
        return { color: 'text-orange-500', name: 'PowerPoint Presentation' };
      case 'txt':
        return { color: 'text-gray-500', name: 'Text Document' };
      default:
        return { color: 'text-gray-500', name: 'Document' };
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload training documents, manuals, or procedures for processing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!selectedFile ? (
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
              isDragActive && "border-primary/50 bg-primary/5",
              isDragAccept && "border-green-500/50 bg-green-500/5",
              isDragReject && "border-red-500/50 bg-red-500/5",
              !isDragActive && "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            
            <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
            
            <h3 className="text-lg font-medium mb-1">Drag and drop your file here</h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse your files
            </p>
            
            <p className="text-xs text-muted-foreground">
              Supported file types: PDF, DOCX, XLSX, PPTX, TXT
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/20">
              <div className={cn("p-2 rounded-md bg-background", getFileTypeInfo(selectedFile.name).color)}>
                <FileUp className="h-6 w-6" />
              </div>
              
              <div className="flex-1 space-y-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{getFileTypeInfo(selectedFile.name).name}</span>
                  <span>•</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </p>
              </div>
              
              <Button
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setCustomTitle('');
                }}
                disabled={uploading}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter a descriptive title for this document"
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                This title will be used to identify your document in the system
              </p>
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedFile(null);
            setCustomTitle('');
          }}
          disabled={!selectedFile || uploading}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || !customTitle || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}