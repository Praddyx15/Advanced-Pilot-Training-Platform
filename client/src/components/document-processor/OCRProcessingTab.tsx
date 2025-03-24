import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileUp, 
  Scan, 
  FileText, 
  Table, 
  Languages, 
  Download, 
  RotateCw, 
  Eye, 
  Copy, 
  Check 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function OCRProcessingTab() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [activeTab, setActiveTab] = useState('upload');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // OCR settings
  const [ocrSettings, setOcrSettings] = useState({
    language: 'eng',
    detectTables: true,
    detectForms: true,
    enhanceImage: true,
    pageSegmentationMode: 'auto',
    confidenceThreshold: 60
  });
  
  // Available languages for OCR
  const languages = [
    { value: 'eng', label: 'English' },
    { value: 'fra', label: 'French' },
    { value: 'deu', label: 'German' },
    { value: 'spa', label: 'Spanish' },
    { value: 'ita', label: 'Italian' },
    { value: 'por', label: 'Portuguese' },
    { value: 'rus', label: 'Russian' },
    { value: 'ara', label: 'Arabic' },
    { value: 'chi_sim', label: 'Chinese (Simplified)' },
    { value: 'chi_tra', label: 'Chinese (Traditional)' },
    { value: 'jpn', label: 'Japanese' },
    { value: 'kor', label: 'Korean' }
  ];
  
  // Page segmentation modes
  const pageSegmentationModes = [
    { value: 'auto', label: 'Automatic page segmentation' },
    { value: 'single_column', label: 'Single column text' },
    { value: 'single_block', label: 'Single uniform block of text' },
    { value: 'single_line', label: 'Single text line' },
    { value: 'single_word', label: 'Single word' },
    { value: 'sparse_text', label: 'Sparse text' },
    { value: 'sparse_text_osd', label: 'Sparse text with orientation and script detection' }
  ];
  
  // Mutation for OCR processing
  const ocrMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        // Update progress steps
        setProcessingStep('Uploading document...');
        await simulateProgress(0, 15);
        
        setProcessingStep('Preprocessing image...');
        await simulateProgress(15, 30);
        
        setProcessingStep('Applying OCR...');
        await simulateProgress(30, 60);
        
        setProcessingStep('Detecting layout and structure...');
        await simulateProgress(60, 80);
        
        setProcessingStep('Post-processing and analyzing results...');
        await simulateProgress(80, 100);
        
        // Call OCR API endpoint
        const response = await apiRequest('POST', '/api/ocr/process', formData);
        return await response.json();
      } catch (error) {
        // Convert the error to a standard format
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('An unexpected error occurred during OCR processing');
        }
      }
    },
    onSuccess: (data) => {
      setOcrResult(data);
      setActiveTab('results');
      toast({
        title: 'OCR processing complete',
        description: 'Text has been successfully extracted from the document.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'OCR processing failed',
        description: error.message || 'An error occurred during OCR processing.',
        variant: 'destructive',
      });
      setOcrProgress(0);
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
          setOcrProgress(current);
          resolve();
        } else {
          setOcrProgress(current);
        }
      }, 100);
    });
  };
  

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview for supported image types
      if (selectedFile.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // For PDFs and other documents, show a generic preview
        setPreview(null);
      }
      
      // Reset previous results
      setOcrResult(null);
      setOcrProgress(0);
    }
  };
  
  // Handle OCR process button
  const handleOcrProcess = () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to process.',
        variant: 'destructive',
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('settings', JSON.stringify(ocrSettings));
    
    setOcrProgress(0);
    ocrMutation.mutate(formData);
  };
  
  // Handle settings change
  const handleSettingChange = (key: string, value: any) => {
    setOcrSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Copy extracted text to clipboard
  const copyToClipboard = () => {
    if (ocrResult && ocrResult.text) {
      navigator.clipboard.writeText(ocrResult.text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: 'Text copied',
          description: 'The extracted text has been copied to clipboard.',
        });
      });
    }
  };
  
  // Download OCR results as JSON
  const downloadResults = () => {
    if (!ocrResult) return;
    
    const dataStr = JSON.stringify(ocrResult, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ocr-results-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="upload" disabled={ocrMutation.isPending}>
            <FileUp className="mr-2 h-4 w-4" />
            Upload & Settings
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!ocrResult && !ocrMutation.isPending}>
            <FileText className="mr-2 h-4 w-4" />
            OCR Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File upload card */}
            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>
                  Upload an image or document for OCR processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/jpeg,image/png,image/tiff,application/pdf"
                  />
                  
                  {preview ? (
                    <div className="space-y-4">
                      <img 
                        src={preview} 
                        alt="Document preview" 
                        className="max-h-64 mx-auto object-contain rounded-md"
                      />
                      <p className="text-sm text-gray-500">{file?.name}</p>
                    </div>
                  ) : file ? (
                    <div className="space-y-4">
                      <div className="w-32 h-40 mx-auto bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                        <FileText className="h-16 w-16 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">{file.name}</p>
                    </div>
                  ) : (
                    <div className="py-8">
                      <FileUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm font-medium mb-1">
                        Click to select or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports JPG, PNG, TIFF, and PDF
                      </p>
                    </div>
                  )}
                </div>
                
                {file && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>File: {file.name}</span>
                      <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                    >
                      Remove file
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={!file || ocrMutation.isPending}
                  onClick={handleOcrProcess}
                >
                  {ocrMutation.isPending ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Process with OCR
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* OCR settings card */}
            <Card>
              <CardHeader>
                <CardTitle>OCR Settings</CardTitle>
                <CardDescription>
                  Configure options for optimal text extraction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={ocrSettings.language} 
                    onValueChange={(value) => handleSettingChange('language', value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Select primary language in the document
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="pageSegmentationMode">Page Segmentation</Label>
                  <Select 
                    value={ocrSettings.pageSegmentationMode} 
                    onValueChange={(value) => handleSettingChange('pageSegmentationMode', value)}
                  >
                    <SelectTrigger id="pageSegmentationMode">
                      <SelectValue placeholder="Select Segmentation Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSegmentationModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    How the engine should analyze the page layout
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="confidenceThreshold">Confidence Threshold: {ocrSettings.confidenceThreshold}%</Label>
                  <div className="relative pt-1">
                    <input
                      type="range"
                      id="confidenceThreshold"
                      min="0"
                      max="100"
                      step="5"
                      value={ocrSettings.confidenceThreshold}
                      onChange={(e) => handleSettingChange('confidenceThreshold', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Minimum confidence level to include recognized text
                  </p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="detectTables">Detect Tables</Label>
                      <p className="text-xs text-gray-500">
                        Identify and extract tabular data
                      </p>
                    </div>
                    <Switch
                      id="detectTables"
                      checked={ocrSettings.detectTables}
                      onCheckedChange={(checked) => handleSettingChange('detectTables', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="detectForms">Detect Forms</Label>
                      <p className="text-xs text-gray-500">
                        Identify form fields and structure
                      </p>
                    </div>
                    <Switch
                      id="detectForms"
                      checked={ocrSettings.detectForms}
                      onCheckedChange={(checked) => handleSettingChange('detectForms', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enhanceImage">Enhance Image</Label>
                      <p className="text-xs text-gray-500">
                        Apply preprocessing to improve OCR quality
                      </p>
                    </div>
                    <Switch
                      id="enhanceImage"
                      checked={ocrSettings.enhanceImage}
                      onCheckedChange={(checked) => handleSettingChange('enhanceImage', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Progress section */}
          {ocrMutation.isPending && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{processingStep || 'Preparing OCR...'}</h3>
                      <p className="text-sm text-gray-500">Progress: {ocrProgress}%</p>
                    </div>
                    <RotateCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  
                  <Progress value={ocrProgress} className="h-2" />
                  
                  <p className="text-sm text-gray-500">
                    OCR is processing your document. This may take a few moments depending on document size and complexity.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="results">
          {ocrResult ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* OCR results overview */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Extracted Text</CardTitle>
                      <CardDescription>
                        Text extracted from your document
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyToClipboard}
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Text
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={downloadResults}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] rounded-md border p-4">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                      {ocrResult.text}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* OCR statistics and info */}
              <Card>
                <CardHeader>
                  <CardTitle>OCR Analysis</CardTitle>
                  <CardDescription>
                    Statistics and detection information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Document Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pages</span>
                        <span>{ocrResult.pageCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Language</span>
                        <span>{languages.find(l => l.value === ocrResult.detectedLanguage)?.label || ocrResult.detectedLanguage}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Processing Time</span>
                        <span>{ocrResult.processingTime}s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Overall Confidence</span>
                        <span className={`font-medium ${ocrResult.confidence > 90 ? 'text-green-600' : ocrResult.confidence > 75 ? 'text-amber-600' : 'text-red-600'}`}>
                          {ocrResult.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Detected Elements</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Text Lines</span>
                        <span>{ocrResult.lines?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Words</span>
                        <span>{ocrResult.words?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tables</span>
                        <span>{ocrResult.tables?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Form Fields</span>
                        <span>{ocrResult.forms?.reduce((count: number, form: any) => count + (form.fields?.length || 0), 0) || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Confidence Levels</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Low Confidence Words</span>
                          <span>{ocrResult.words?.filter((w: any) => w.confidence < ocrSettings.confidenceThreshold).length || 0}</span>
                        </div>
                        <Progress value={
                          ocrResult.words?.length 
                            ? 100 - (ocrResult.words.filter((w: any) => w.confidence < ocrSettings.confidenceThreshold).length / ocrResult.words.length * 100)
                            : 100
                        } className="h-1.5" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Actions</h3>
                    <div className="space-y-2">
                      <Button className="w-full" variant="default" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Visualize Results
                      </Button>
                      <Button className="w-full" variant="outline" size="sm">
                        <Table className="mr-2 h-4 w-4" />
                        View Detected Tables
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Detected tables section (optional) */}
              {ocrResult.tables && ocrResult.tables.length > 0 && (
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Detected Tables</CardTitle>
                    <CardDescription>
                      {ocrResult.tables.length} table{ocrResult.tables.length !== 1 ? 's' : ''} found in the document
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {ocrResult.tables.map((table: any, index: number) => (
                        <div key={index} className="border rounded-md overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800">
                                {table.cells[0]?.map((cell: any, cellIndex: number) => (
                                  <th key={cellIndex} className="p-2 text-left text-sm font-medium border">
                                    {cell.text}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.cells.slice(1).map((row: any, rowIndex: number) => (
                                <tr key={rowIndex}>
                                  {row.map((cell: any, cellIndex: number) => (
                                    <td key={cellIndex} className="p-2 text-sm border">
                                      {cell.text}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : ocrMutation.isPending ? (
            <div className="text-center py-10">
              <RotateCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium">{processingStep || 'Processing Document'}</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                The OCR engine is extracting text from your document.
              </p>
              <div className="max-w-md mx-auto mt-4">
                <Progress value={ocrProgress} className="h-2" />
                <p className="text-sm mt-1 text-gray-500">Progress: {ocrProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Results Available</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Upload a document and process it to see OCR results here.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab('upload')}
              >
                Go to Upload
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Help alert */}
      <Alert>
        <Languages className="h-4 w-4" />
        <AlertTitle>OCR processing tips</AlertTitle>
        <AlertDescription>
          For best results, use high-resolution images with clear text. OCR works best on documents with good contrast and minimal background noise. Multi-language detection is supported, but selecting the primary language improves accuracy.
        </AlertDescription>
      </Alert>
    </div>
  );
}