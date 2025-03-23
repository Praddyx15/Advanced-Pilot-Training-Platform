import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, FileText, Search, CompareIcon, Languages, Check, X, ArrowRight, BookOpen, FileCog, Download, ExternalLink, FileSearch, Sparkles, ArrowUp, PieChart, ListChecks, Scroll } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from '@/components/layouts/app-layout';

// Import document related types if needed
// import { DocumentCategory, SubjectArea, PriorityLevel } from '@shared/document-types';

/**
 * Document Processor Page
 * 
 * This page provides interfaces for:
 * - Document upload and processing
 * - OCR and text extraction from multiple formats
 * - Document classification 
 * - Document comparison
 * - Translation and multi-language support
 */
export default function DocumentProcessorPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upload");
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Processor</h1>
            <p className="text-muted-foreground">Upload, analyze, extract, and compare document content</p>
          </div>
        </div>
        
        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full md:w-4/5 lg:w-3/4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="extract">Extract</TabsTrigger>
            <TabsTrigger value="classify">Classify</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <DocumentUploadTab />
          </TabsContent>
          
          <TabsContent value="extract" className="space-y-4">
            <TextExtractionTab />
          </TabsContent>
          
          <TabsContent value="classify" className="space-y-4">
            <ClassificationTab />
          </TabsContent>
          
          <TabsContent value="compare" className="space-y-4">
            <ComparisonTab />
          </TabsContent>

          <TabsContent value="syllabus" className="space-y-4">
            <SyllabusGenerationTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

/**
 * Document Upload Interface
 */
function DocumentUploadTab() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/documents/upload", undefined, {
        body: formData,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Your document has been uploaded and is ready for processing.",
      });
      setSelectedFile(null);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", selectedFile.name);
    formData.append("description", "Uploaded from Document Processor");
    
    uploadMutation.mutate(formData);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload documents for processing. Supported formats include PDF, Word (DOCX, DOC),
          Excel (XLSX, XLS), PowerPoint (PPTX, PPT), HTML, and image files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            {selectedFile ? selectedFile.name : "Drag & drop your file here or click to browse"}
          </p>
          <Input 
            type="file" 
            className="hidden" 
            id="file-upload" 
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.html,.htm,.jpg,.jpeg,.png,.gif,.tif,.tiff"
          />
          <Label 
            htmlFor="file-upload" 
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm"
          >
            Select File
          </Label>
        </div>
        
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Upload Progress</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>Upload Document</>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedFile(null)}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Recently Uploaded Documents</h3>
          <RecentDocumentsTable />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Text Extraction Interface
 */
function TextExtractionTab() {
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [extractionOptions, setExtractionOptions] = useState({
    ocrEnabled: true,
    language: "eng"
  });
  
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/documents');
      return await res.json();
    }
  });
  
  const extractMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await apiRequest('POST', `/api/documents/${documentId}/extract`, extractionOptions);
      return await res.json();
    },
    onSuccess: (data) => {
      setExtractedText(data.text);
      toast({
        title: "Text extraction complete",
        description: "Document text has been successfully extracted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleExtract = () => {
    if (!selectedDocument) return;
    extractMutation.mutate(selectedDocument);
  };
  
  const supportedLanguages = [
    { code: "eng", name: "English" },
    { code: "fra", name: "French" },
    { code: "deu", name: "German" },
    { code: "spa", name: "Spanish" },
    { code: "por", name: "Portuguese" },
    { code: "ita", name: "Italian" },
    { code: "rus", name: "Russian" },
    { code: "jpn", name: "Japanese" },
    { code: "kor", name: "Korean" },
    { code: "chi_sim", name: "Chinese (Simplified)" },
    { code: "chi_tra", name: "Chinese (Traditional)" },
    { code: "ara", name: "Arabic" },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Extract Text</CardTitle>
        <CardDescription>
          Extract text content from documents using OCR and content parsing technologies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-select">Select Document</Label>
              <Select 
                value={selectedDocument} 
                onValueChange={setSelectedDocument}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDocuments ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading documents...
                    </div>
                  ) : (
                    documents?.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Extraction Options</Label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="ocr-enabled"
                  checked={extractionOptions.ocrEnabled}
                  onChange={(e) => setExtractionOptions({
                    ...extractionOptions,
                    ocrEnabled: e.target.checked
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="ocr-enabled" className="text-sm font-normal">
                  Enable OCR for images/scanned documents
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language-select">OCR Language</Label>
                <Select 
                  value={extractionOptions.language}
                  onValueChange={(value) => setExtractionOptions({
                    ...extractionOptions,
                    language: value
                  })}
                  disabled={!extractionOptions.ocrEnabled}
                >
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleExtract} 
              disabled={!selectedDocument || extractMutation.isPending}
              className="w-full"
            >
              {extractMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>Extract Text</>
              )}
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Extracted Text</Label>
            <ScrollArea className="h-[400px] border rounded-md p-4">
              {extractMutation.isPending ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : extractedText ? (
                <p className="whitespace-pre-line">{extractedText}</p>
              ) : (
                <p className="text-muted-foreground text-center">
                  Select a document and click "Extract Text" to see the results here
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Document Classification Interface
 */
function ClassificationTab() {
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [classificationResult, setClassificationResult] = useState<any>(null);
  
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/documents');
      return await res.json();
    }
  });
  
  const classifyMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await apiRequest('POST', `/api/documents/${documentId}/classify`);
      return await res.json();
    },
    onSuccess: (data) => {
      setClassificationResult(data);
      toast({
        title: "Classification complete",
        description: "Document has been analyzed and classified",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Classification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleClassify = () => {
    if (!selectedDocument) return;
    classifyMutation.mutate(selectedDocument);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Classify Document</CardTitle>
        <CardDescription>
          Analyze documents to determine category, subject matter, priority, and extract tags
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-select">Select Document</Label>
              <Select 
                value={selectedDocument} 
                onValueChange={setSelectedDocument}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDocuments ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading documents...
                    </div>
                  ) : (
                    documents?.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleClassify} 
              disabled={!selectedDocument || classifyMutation.isPending}
              className="w-full"
            >
              {classifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Classifying...
                </>
              ) : (
                <>Classify Document</>
              )}
            </Button>
          </div>
          
          <div className="space-y-4">
            {classificationResult ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Category</Label>
                    <div className="flex items-center space-x-2">
                      <Badge className="capitalize">
                        {classificationResult.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Priority</Label>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className="capitalize" 
                        variant={
                          classificationResult.priority === 'critical' ? 'destructive' :
                          classificationResult.priority === 'high' ? 'default' :
                          classificationResult.priority === 'medium' ? 'secondary' :
                          'outline'
                        }
                      >
                        {classificationResult.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Subjects</Label>
                  <div className="flex flex-wrap gap-2">
                    {classificationResult.subjects.map((subject: string) => (
                      <Badge key={subject} variant="secondary" className="capitalize">
                        {subject.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {classificationResult.tags.slice(0, 12).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="capitalize">
                        {tag}
                      </Badge>
                    ))}
                    {classificationResult.tags.length > 12 && (
                      <Badge variant="outline">+{classificationResult.tags.length - 12} more</Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Confidence</Label>
                  <Progress value={classificationResult.confidence * 100} className="h-2" />
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(classificationResult.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                {classificationResult.metadata.regulatoryReferences && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Regulatory References</Label>
                    <div className="flex flex-wrap gap-2">
                      {classificationResult.metadata.regulatoryReferences.map((ref: string) => (
                        <Badge key={ref} variant="default" className="font-mono">
                          {ref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {classificationResult.metadata.aircraftTypes && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Aircraft Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {classificationResult.metadata.aircraftTypes.map((type: string) => (
                        <Badge key={type} variant="default" className="font-mono">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] border rounded-md">
                <div className="text-center text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-2" />
                  <p>Select a document and click "Classify Document" to analyze</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Document Comparison Interface
 */
function ComparisonTab() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState({
    before: "",
    after: ""
  });
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [comparisonOptions, setComparisonOptions] = useState({
    ignoreWhitespace: true,
    ignoreCase: false,
    includeImpactAnalysis: true
  });
  
  const { data: documentList, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/documents');
      return await res.json();
    }
  });
  
  const compareMutation = useMutation({
    mutationFn: async (params: typeof documents) => {
      const res = await apiRequest('POST', `/api/documents/compare`, {
        beforeDocumentId: params.before,
        afterDocumentId: params.after,
        options: comparisonOptions
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setComparisonResult(data);
      toast({
        title: "Comparison complete",
        description: "Documents have been compared successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Comparison failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleCompare = () => {
    if (!documents.before || !documents.after) return;
    compareMutation.mutate(documents);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare Documents</CardTitle>
        <CardDescription>
          Compare two documents to identify changes and analyze their significance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="before-document">Before Document</Label>
              <Select 
                value={documents.before} 
                onValueChange={(value) => setDocuments({...documents, before: value})}
              >
                <SelectTrigger id="before-document">
                  <SelectValue placeholder="Select first document" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDocuments ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading documents...
                    </div>
                  ) : (
                    documentList?.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="after-document">After Document</Label>
              <Select 
                value={documents.after} 
                onValueChange={(value) => setDocuments({...documents, after: value})}
              >
                <SelectTrigger id="after-document">
                  <SelectValue placeholder="Select second document" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDocuments ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading documents...
                    </div>
                  ) : (
                    documentList?.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Comparison Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ignore-whitespace"
                    checked={comparisonOptions.ignoreWhitespace}
                    onChange={(e) => setComparisonOptions({
                      ...comparisonOptions,
                      ignoreWhitespace: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="ignore-whitespace" className="text-sm font-normal">
                    Ignore whitespace differences
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ignore-case"
                    checked={comparisonOptions.ignoreCase}
                    onChange={(e) => setComparisonOptions({
                      ...comparisonOptions,
                      ignoreCase: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="ignore-case" className="text-sm font-normal">
                    Ignore case differences
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-impact"
                    checked={comparisonOptions.includeImpactAnalysis}
                    onChange={(e) => setComparisonOptions({
                      ...comparisonOptions,
                      includeImpactAnalysis: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="include-impact" className="text-sm font-normal">
                    Include impact analysis
                  </Label>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleCompare} 
              disabled={!documents.before || !documents.after || compareMutation.isPending}
              className="w-full"
            >
              {compareMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>Compare Documents</>
              )}
            </Button>
          </div>
          
          <div className="space-y-4">
            {comparisonResult ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Overall Similarity</Label>
                    <Progress value={comparisonResult.overallSimilarity * 100} className="h-2" />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {Math.round(comparisonResult.overallSimilarity * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Content Similarity</Label>
                    <Progress value={comparisonResult.contentSimilarity * 100} className="h-2" />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {Math.round(comparisonResult.contentSimilarity * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Change Summary</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {comparisonResult.summary.removed}
                      </Badge>
                      <span className="text-sm">Removed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {comparisonResult.summary.added}
                      </Badge>
                      <span className="text-sm">Added</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {comparisonResult.summary.modified}
                      </Badge>
                      <span className="text-sm">Modified</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Change Significance</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {comparisonResult.summary.major}
                      </Badge>
                      <span className="text-sm">Major</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {comparisonResult.summary.minor}
                      </Badge>
                      <span className="text-sm">Minor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {comparisonResult.summary.trivial}
                      </Badge>
                      <span className="text-sm">Trivial</span>
                    </div>
                  </div>
                </div>
                
                {comparisonResult.impactAnalysis && (
                  <Alert>
                    <AlertTitle className="flex items-center">
                      Impact Analysis
                      <Badge className="ml-2 capitalize">
                        {comparisonResult.impactAnalysis.severity} impact
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Affected Areas</Label>
                          <div className="flex flex-wrap gap-2">
                            {comparisonResult.impactAnalysis.affectedAreas.map((area: string) => (
                              <Badge key={area} variant="outline" className="capitalize">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Recommendations</Label>
                          <ul className="text-sm space-y-1 list-disc pl-4">
                            {comparisonResult.impactAnalysis.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] border rounded-md">
                <div className="text-center text-muted-foreground">
                  <CompareIcon className="h-10 w-10 mx-auto mb-2" />
                  <p>Select two documents and click "Compare Documents"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recent Documents Table Component
 */
function RecentDocumentsTable() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/documents');
      return await res.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2" />
        <p>No documents found. Upload your first document to get started.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left font-medium py-2">Title</th>
            <th className="text-left font-medium py-2">Type</th>
            <th className="text-left font-medium py-2">Date</th>
            <th className="text-right font-medium py-2">Size</th>
          </tr>
        </thead>
        <tbody>
          {documents.slice(0, 5).map((doc: any) => (
            <tr key={doc.id} className="border-b last:border-0">
              <td className="py-2">{doc.title}</td>
              <td className="py-2 capitalize">{doc.fileType || "unknown"}</td>
              <td className="py-2">{new Date(doc.createdAt).toLocaleDateString()}</td>
              <td className="py-2 text-right">{formatFileSize(doc.fileSize)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Utility function to format file size
 */
function formatFileSize(sizeInBytes: number | null) {
  if (sizeInBytes === null || sizeInBytes === undefined) return "Unknown";
  
  const kb = sizeInBytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}