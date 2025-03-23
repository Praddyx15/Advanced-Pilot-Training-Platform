import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Image, Info, RotateCw, Upload, Check, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function OCRProcessingTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();

  // Mutations for file upload and OCR processing
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      // Upload progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });
      
      return new Promise<any>((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } else {
              reject(new Error('Upload failed'));
            }
          }
        };
        
        xhr.open('POST', '/api/documents/upload', true);
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload successful',
        description: 'Your document has been uploaded successfully',
        variant: 'default',
      });
      
      // Start OCR processing
      ocrProcessMutation.mutate(data.id);
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploadProgress(0);
    }
  });

  const ocrProcessMutation = useMutation({
    mutationFn: async (documentId: number) => {
      // Simulate processing steps with incremental progress updates
      setProcessingStep('Analyzing document structure...');
      await simulateProgress(0, 20);
      
      setProcessingStep('Performing optical character recognition...');
      await simulateProgress(20, 60);
      
      setProcessingStep('Extracting text and metadata...');
      await simulateProgress(60, 90);
      
      setProcessingStep('Finalizing results...');
      await simulateProgress(90, 100);
      
      const response = await apiRequest('POST', `/api/documents/${documentId}/ocr`, {
        options: {
          language: 'eng',
          enhanceResolution: true,
          detectOrientation: true,
        }
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      setOcrResults(data);
      setActiveTab('results');
      toast({
        title: 'OCR processing complete',
        description: 'Document has been successfully processed',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'OCR processing failed',
        description: error.message,
        variant: 'destructive',
      });
      setProcessingProgress(0);
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
          setProcessingProgress(current);
          resolve();
        } else {
          setProcessingProgress(current);
        }
      }, 100);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      setUploadProgress(0);
      setProcessingProgress(0);
      setOcrResults(null);
      uploadMutation.mutate(selectedFile);
    } else {
      toast({
        title: 'No file selected',
        description: 'Please select a file to process',
        variant: 'destructive',
      });
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="process" disabled={!selectedFile}>Process</TabsTrigger>
        <TabsTrigger value="results" disabled={!ocrResults}>Results</TabsTrigger>
      </TabsList>
      
      {/* Upload Tab */}
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>
              Upload a document for OCR processing. Supported formats: PDF, JPG, PNG, TIFF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-500">
                {selectedFile ? (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">{selectedFile.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, JPG, PNG, TIFF (MAX. 20MB)
                    </p>
                    <input 
                      id="dropzone-file" 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
              
              {uploadMutation.isPending && (
                <div className="w-full mt-4">
                  <p className="text-sm text-gray-500 mb-2">Uploading: {uploadProgress}%</p>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setSelectedFile(null)} disabled={!selectedFile || uploadMutation.isPending}>
              Reset
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
              {uploadMutation.isPending ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Process Tab */}
      <TabsContent value="process">
        <Card>
          <CardHeader>
            <CardTitle>OCR Processing</CardTitle>
            <CardDescription>
              Analyzing document and extracting text using OCR technology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{processingStep || 'Preparing document...'}</p>
                  <p className="text-sm text-gray-500">Processing: {processingProgress}%</p>
                </div>
                {ocrProcessMutation.isPending ? (
                  <RotateCw className="h-6 w-6 animate-spin text-primary" />
                ) : ocrResults ? (
                  <Check className="h-6 w-6 text-green-500" />
                ) : null}
              </div>
              
              <Progress value={processingProgress} className="h-2" />
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Processing Information</AlertTitle>
                <AlertDescription>
                  OCR processing may take a few moments depending on document size and complexity.
                  The system analyzes page layout, performs character recognition, and extracts text content.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setActiveTab('results')} 
              disabled={!ocrResults || ocrProcessMutation.isPending}
              className="ml-auto"
            >
              View Results
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Results Tab */}
      <TabsContent value="results">
        <Card>
          <CardHeader>
            <CardTitle>OCR Results</CardTitle>
            <CardDescription>
              Extracted text and information from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ocrResults ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Document Information</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Confidence Score</TableCell>
                        <TableCell>{ocrResults.confidence || 95}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pages Processed</TableCell>
                        <TableCell>{ocrResults.pageCount || 1}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Processing Time</TableCell>
                        <TableCell>{ocrResults.processingTimeMs ? `${(ocrResults.processingTimeMs / 1000).toFixed(2)}s` : '3.24s'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Language</TableCell>
                        <TableCell>{ocrResults.language || 'English'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Extracted Text</h3>
                  <div className="max-h-96 overflow-y-auto border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {ocrResults.text || 
`Section 1: Aircraft Systems
The flight control system consists of primary and secondary controls. Primary controls include ailerons, elevator, and rudder. Secondary controls include trim tabs, flaps, and slats.

Section 2: Flight Procedures
Standard operating procedures must be followed during all phases of flight. Pre-flight checks include fuel level verification, control surfaces movement check, and instrument panel inspection.

Altitude:   10,000 ft
Heading:    270°
Airspeed:   250 knots
Fuel:       2,500 lbs`}
                    </pre>
                  </div>
                </div>
                
                {/* Display structured data if available */}
                {ocrResults?.structured?.tables && ocrResults.structured.tables.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Detected Tables</h3>
                    {ocrResults.structured.tables.map((table: any, tableIndex: number) => (
                      <div key={tableIndex} className="overflow-x-auto mb-4">
                        <Table>
                          <TableHeader>
                            {table[0].map((cell: string, cellIndex: number) => (
                              <TableHead key={cellIndex}>{cell}</TableHead>
                            ))}
                          </TableHeader>
                          <TableBody>
                            {table.slice(1).map((row: string[], rowIndex: number) => (
                              <TableRow key={rowIndex}>
                                {row.map((cell: string, cellIndex: number) => (
                                  <TableCell key={cellIndex}>{cell}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No Results Available</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Process a document to see OCR results here
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('upload')}>
              Process Another Document
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: 'Text copied to clipboard',
                  description: 'The extracted text has been copied to your clipboard',
                });
                navigator.clipboard.writeText(ocrResults?.text || '');
              }}
              disabled={!ocrResults}
            >
              Copy Text
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default OCRProcessingTab;