import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  File,
  FileText,
  FileSpreadsheet,
  PresentationIcon,
  FileArchive,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// Updated UploadedDocument interface to match document-detail-page
export interface UploadedDocument {
  id: number;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description?: string;
  url: string;
  createdAt: string;
  updatedAt?: string;
  processingStatus: string;
  isProcessed: boolean;
  tags?: string[];
  uploadedByName?: string;
  uploadedByAvatar?: string;
  uploadedByRole?: string;
  uploadedById: number;
  isFavorite?: boolean;
}

interface DocumentUploaderProps {
  onUploadComplete?: (document: UploadedDocument) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
}

export function DocumentUploader({
  onUploadComplete,
  maxFiles = 1,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
  maxFileSize = 10 // 10MB
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    // Validate max files
    if (acceptedFiles.length > maxFiles) {
      setError(`You can only upload ${maxFiles} file${maxFiles === 1 ? '' : 's'} at a time.`);
      return;
    }
    
    // Validate file size
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxFileSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`File${oversizedFiles.length > 1 ? 's' : ''} too large. Maximum size is ${maxFileSize}MB.`);
      return;
    }
    
    // Set the title to the first file name by default (without extension)
    if (acceptedFiles.length > 0 && !title) {
      const fileName = acceptedFiles[0].name;
      const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      setTitle(nameWithoutExtension);
    }
    
    setFiles(acceptedFiles);
  }, [maxFiles, maxFileSize, title]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedFileTypes.reduce((acc, type) => {
      // Map file extensions to MIME types
      const mimeType = getMimeType(type);
      return { ...acc, [mimeType]: [type] };
    }, {}),
    maxSize: maxFileSize * 1024 * 1024,
  });

  // Map file extensions to MIME types
  function getMimeType(extension: string): string {
    const extensionMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    
    return extensionMap[extension] || 'application/octet-stream';
  }

  // Get file icon based on file type
  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-12 w-12 text-red-500" />;
      case 'doc':
      case 'docx':
        return <File className="h-12 w-12 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-12 w-12 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <PresentationIcon className="h-12 w-12 text-orange-500" />;
      default:
        return <FileArchive className="h-12 w-12 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const increment = Math.random() * 15;
          const newProgress = Math.min(prev + increment, 95);
          return newProgress;
        });
      }, 500);
      
      try {
        const response = await apiRequest('POST', '/api/documents/upload', formData);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data: UploadedDocument) => {
      // Reset form
      setFiles([]);
      setTitle('');
      setDescription('');
      setUploading(false);
      setUploadProgress(0);
      
      // Show success toast
      toast({
        title: "Upload successful",
        description: "Your document has been uploaded and is being processed.",
        variant: "default",
      });
      
      // Invalidate documents query
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // Call callback
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Please select a file to upload.');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for the document.');
      return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    
    // Append the file (our backend expects 'file' as the field name)
    formData.append('file', files[0]);
    
    // Upload file
    uploadMutation.mutate(formData);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center mb-2">
          <CardTitle>Upload Document</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            onClick={() => {
              if (onUploadComplete) {
                onUploadComplete({} as any);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="m12 19-7-7 7-7"></path>
              <path d="M5 12h14"></path>
            </svg>
            Back to Documents
          </Button>
        </div>
        <CardDescription>
          Upload your document to extract content and generate forms.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* File drop area */}
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'bg-primary/5 border-primary' : 'border-border hover:bg-muted/50'}
              ${isDragReject ? 'border-destructive bg-destructive/5' : ''}
              ${error ? 'border-destructive' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {files.length > 0 ? (
              <div className="space-y-4">
                {files.map(file => (
                  <div key={file.name} className="flex items-center gap-4">
                    {getFileIcon(file)}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {file.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-lg font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports {acceptedFileTypes.join(', ')} (Max: {maxFileSize}MB)
                </p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Document details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter document title"
                disabled={uploading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter document description"
                disabled={uploading}
                rows={3}
              />
            </div>
          </div>
          
          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Uploading...</p>
                <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              setFiles([]);
              setTitle('');
              setDescription('');
              setError(null);
            }}
            disabled={uploading || files.length === 0}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            disabled={uploading || files.length === 0 || !title.trim()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}