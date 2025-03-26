import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileDown, ClipboardEdit, Loader2, FileText,
  CheckCircle, AlertTriangle, FileType, FormInput
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UploadedDocument } from './document-uploader';

interface ExtractedContent {
  id: number;
  documentId: number;
  textContent: string;
  structuredContent: any;
  sections: any[];
  extractedKeywords: string[];
  confidenceScore: number;
  extractionTime: number;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedForm {
  id: number;
  documentId: number;
  extractionId: number;
  formType: string;
  title: string;
  description: string;
  fields: FormField[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  value?: any;
}

const FORM_TYPES = [
  { id: 'session_plan', name: 'Training Session Plan' },
  { id: 'compliance_procedure', name: 'Compliance Procedure' },
  { id: 'assessment_form', name: 'Assessment Form' },
  { id: 'feedback_form', name: 'Feedback Form' },
  { id: 'checklist', name: 'Operational Checklist' }
];

interface FormGeneratorProps {
  documentId: number;
  extractionId?: number;
}

export function DocumentFormGenerator({ documentId, extractionId }: FormGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedFormType, setSelectedFormType] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get document details
  const { data: document, isLoading: isLoadingDocument } = useQuery<UploadedDocument>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId,
  });
  
  // Get extraction result if available
  const { 
    data: extractionResult, 
    isLoading: isLoadingExtraction
  } = useQuery<ExtractedContent>({
    queryKey: [`/api/documents/${documentId}/extraction`],
    enabled: !!documentId,
    // Don't throw error if extraction doesn't exist yet
    throwOnError: false,
  });
  
  // Get generated forms if any
  const {
    data: generatedForms,
    isLoading: isLoadingForms
  } = useQuery<GeneratedForm[]>({
    queryKey: [`/api/documents/${documentId}/forms`],
    enabled: !!documentId,
    throwOnError: false,
  });
  
  // Form generation mutation
  const generateFormMutation = useMutation({
    mutationFn: async (data: { formType: string; title?: string; description?: string }) => {
      setIsGenerating(true);
      // Start with initial progress
      setGenerationProgress(5);
      
      // Simulate progress updates while generation happens on server
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          // Slowly increase up to 90%
          const increment = Math.floor(Math.random() * 5) + 1;
          const newValue = Math.min(prev + increment, 90);
          return newValue;
        });
      }, 800);
      
      try {
        const res = await apiRequest('POST', `/api/documents/${documentId}/forms`, {
          formType: data.formType,
          title: data.title || undefined,
          description: data.description || undefined,
          extractionId: extractionId || extractionResult?.id,
        });
        
        const responseData = await res.json();
        
        // Clear interval and set to 100% when done
        clearInterval(progressInterval);
        setGenerationProgress(100);
        
        // Short delay to show 100% before resetting
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress(0);
        }, 500);
        
        return responseData;
      } catch (error) {
        clearInterval(progressInterval);
        setIsGenerating(false);
        throw error;
      }
    },
    onSuccess: (data: GeneratedForm) => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/forms`] });
      
      toast({
        title: 'Form Generated',
        description: `${data.title} has been successfully generated.`,
        variant: 'default',
      });
      
      // Reset form inputs
      setSelectedFormType('');
      setCustomTitle('');
      setCustomDescription('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate form. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const isLoading = isLoadingDocument || isLoadingExtraction || isLoadingForms;
  const hasExtraction = !!extractionResult;
  const hasForms = (generatedForms?.length || 0) > 0;
  
  const handleGenerateForm = () => {
    if (!selectedFormType) {
      toast({
        title: 'Form Type Required',
        description: 'Please select a form type to generate.',
        variant: 'destructive',
      });
      return;
    }
    
    generateFormMutation.mutate({
      formType: selectedFormType,
      title: customTitle,
      description: customDescription,
    });
  };
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FormInput className="mr-2 h-5 w-5" />
            Form Generation
          </CardTitle>
          <CardDescription>
            Generate training forms, compliance procedures, and checklists from document content
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !hasExtraction ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Extraction Required</AlertTitle>
              <AlertDescription>
                You need to extract the document content before generating forms.
                Please use the Document Extraction tool first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {!isGenerating && !hasForms && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Ready to Generate</AlertTitle>
                  <AlertDescription>
                    Document content has been extracted and is ready for form generation.
                    Select a form type below to get started.
                  </AlertDescription>
                </Alert>
              )}
              
              {hasForms && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Generated Forms</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generatedForms?.map((form) => (
                      <div 
                        key={form.id} 
                        className="p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => setIsFormPreviewOpen(true)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileType className="h-5 w-5 text-primary" />
                            <span className="font-medium">{form.title}</span>
                          </div>
                          <Badge variant="outline">{getFormTypeName(form.formType)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {form.description || 'No description'}
                        </p>
                        <div className="flex justify-end mt-2">
                          <Button variant="ghost" size="sm">
                            <FileDown className="h-3.5 w-3.5 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Generating form content...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
              )}
              
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium">Generate New Form</h3>
                
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="form-type">Form Type</Label>
                    <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                      <SelectTrigger id="form-type">
                        <SelectValue placeholder="Select form type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORM_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="form-title">Form Title (Optional)</Label>
                    <Input 
                      id="form-title"
                      placeholder="Custom form title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Leave blank to generate from document content
                    </p>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="form-description">Description (Optional)</Label>
                    <Textarea 
                      id="form-description"
                      placeholder="Custom form description"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleGenerateForm} 
            disabled={isGenerating || !hasExtraction || !selectedFormType}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Form...
              </>
            ) : (
              <>
                <ClipboardEdit className="mr-2 h-4 w-4" />
                Generate Form
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Form Preview Dialog would go here */}
      <Dialog open={isFormPreviewOpen} onOpenChange={setIsFormPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>
              Preview generated form content
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-8 py-4">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">Training Session Plan</h2>
                <p className="text-muted-foreground mt-1">
                  Based on {document?.title}
                </p>
              </div>
              
              {/* Sample form preview */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session-title">Session Title</Label>
                  <Input id="session-title" value="Introduction to Flight Controls" readOnly />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session-objective">Session Objective</Label>
                  <Textarea 
                    id="session-objective" 
                    value="Familiarize trainees with primary and secondary flight controls, their functions, and proper operation techniques."
                    rows={3}
                    readOnly
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-date">Date</Label>
                    <Input id="session-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-duration">Duration (hours)</Label>
                    <Input id="session-duration" type="number" defaultValue={2} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session-topics">Topics Covered</Label>
                  <div className="border rounded-md p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-1">1.</div>
                      <div className="flex-1">
                        <p className="font-medium">Primary Flight Controls</p>
                        <p className="text-sm text-muted-foreground">Ailerons, elevator, and rudder function and operation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-1">2.</div>
                      <div className="flex-1">
                        <p className="font-medium">Secondary Flight Controls</p>
                        <p className="text-sm text-muted-foreground">Flaps, slats, spoilers, and trim systems</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-1">3.</div>
                      <div className="flex-1">
                        <p className="font-medium">Control System Failures</p>
                        <p className="text-sm text-muted-foreground">Recognition and response procedures</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session-resources">Required Resources</Label>
                  <div className="border rounded-md p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Aircraft Systems Manual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Flight Controls Demonstration Model</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Simulator (FTD Level 5 or higher)</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session-notes">Additional Notes</Label>
                  <Textarea 
                    id="session-notes" 
                    placeholder="Add any additional notes here..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-4">
            <Button variant="outline" className="mr-auto">
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => setIsFormPreviewOpen(false)}>
              Close
            </Button>
            <Button>Save Form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getFormTypeName(formTypeId: string): string {
  const formType = FORM_TYPES.find(t => t.id === formTypeId);
  return formType?.name || formTypeId;
}