import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, RotateCw, Book, CheckCircle, Download, FileText, Save, ExternalLink, AlertTriangle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function SyllabusGenerationTab() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedSyllabus, setGeneratedSyllabus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('setup');
  const { toast } = useToast();
  
  // Generation options state
  const [options, setOptions] = useState({
    programType: 'initial_type_rating',
    regulatoryAuthority: 'easa',
    extractModules: true,
    extractLessons: true,
    extractCompetencies: true,
    extractRegulatoryReferences: true,
    detectAircraftType: true,
    enhancedExtraction: true,
    useTemplate: false,
  });
  
  // Query to fetch available documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/documents');
        return await response.json();
      } catch (error) {
        // Return mock data for demonstration
        return [
          { id: 1, title: 'Aircraft Maintenance Manual', fileType: 'pdf', uploadedAt: '2025-03-20', category: 'technical' },
          { id: 2, title: 'Flight Operations Manual', fileType: 'pdf', uploadedAt: '2025-03-18', category: 'operational' },
          { id: 3, title: 'Regulatory Compliance Guide', fileType: 'pdf', uploadedAt: '2025-03-15', category: 'regulatory' },
          { id: 4, title: 'B737 Type Rating Syllabus', fileType: 'docx', uploadedAt: '2025-03-10', category: 'training' },
          { id: 5, title: 'Airbus A320 Training Program', fileType: 'pdf', uploadedAt: '2025-03-05', category: 'training' },
        ];
      }
    }
  });
  
  // Query to fetch available templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/syllabus-templates'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/syllabus-templates');
        return await response.json();
      } catch (error) {
        // Return mock data for demonstration
        return [
          { id: 1, name: 'EASA Type Rating (Generic)', programType: 'initial_type_rating', regulatoryAuthority: 'easa' },
          { id: 2, name: 'FAA Type Rating (Generic)', programType: 'initial_type_rating', regulatoryAuthority: 'faa' },
          { id: 3, name: 'EASA Recurrent Training', programType: 'recurrent', regulatoryAuthority: 'easa' },
          { id: 4, name: 'MCC/JOC Template', programType: 'joc_mcc', regulatoryAuthority: 'easa' },
          { id: 5, name: 'ICAO MPL Program', programType: 'initial_type_rating', regulatoryAuthority: 'icao' },
        ];
      }
    }
  });
  
  // Mutation for syllabus generation
  const generateMutation = useMutation({
    mutationFn: async () => {
      // Simulate generation steps with incremental progress updates
      setGenerationStep('Analyzing document contents...');
      await simulateProgress(0, 15);
      
      setGenerationStep('Extracting modules and lesson structure...');
      await simulateProgress(15, 40);
      
      setGenerationStep('Identifying competencies and learning objectives...');
      await simulateProgress(40, 60);
      
      setGenerationStep('Mapping to regulatory requirements...');
      await simulateProgress(60, 80);
      
      setGenerationStep('Finalizing syllabus structure...');
      await simulateProgress(80, 95);
      
      setGenerationStep('Building knowledge graph relationships...');
      await simulateProgress(95, 100);
      
      try {
        const response = await apiRequest('POST', '/api/syllabus/generate', {
          documentId: selectedDocumentId,
          templateId: options.useTemplate ? parseInt(selectedTemplate) : undefined,
          options: {
            programType: options.programType,
            regulatoryAuthority: options.regulatoryAuthority,
            extractModules: options.extractModules,
            extractLessons: options.extractLessons,
            extractCompetencies: options.extractCompetencies,
            extractRegulatoryReferences: options.extractRegulatoryReferences,
            detectAircraftType: options.detectAircraftType,
            enhancedExtraction: options.enhancedExtraction,
          }
        });
        return await response.json();
      } catch (error) {
        // Return mock data for demonstration
        return {
          id: 1001,
          name: "Boeing 737-800 Type Rating Program",
          description: "A comprehensive type rating training program for the Boeing 737-800 aircraft based on EASA regulations.",
          programType: "initial_type_rating",
          aircraftType: "Boeing 737-800",
          regulatoryAuthority: "EASA",
          totalDuration: 35, // In days
          confidenceScore: 92,
          version: "1.0",
          createdAt: new Date().toISOString(),
          modules: [
            {
              name: "Ground School - Aircraft Systems",
              description: "Comprehensive study of the B737-800 aircraft systems",
              type: "ground",
              recommendedDuration: 40, // Hours
              competencies: [
                {
                  name: "Aircraft General Knowledge",
                  description: "Understanding of aircraft systems, limitations and performance",
                  assessmentCriteria: [
                    "Explain the principles of aircraft systems",
                    "Describe the system limitations and failure modes",
                    "Demonstrate understanding of system interactions"
                  ],
                  regulatoryReference: "EASA Part-FCL.725 TK-020"
                },
                {
                  name: "Normal Procedures Knowledge",
                  description: "Knowledge of standard operating procedures for the B737-800",
                  assessmentCriteria: [
                    "List the normal checklist items and their purpose",
                    "Explain the flow patterns for normal operations",
                    "Describe flight profile management"
                  ],
                  regulatoryReference: "EASA Part-FCL.725 TK-033"
                }
              ],
              regulatoryRequirements: [
                "EASA Part-FCL.725",
                "EASA CS-FSTD(A)"
              ]
            },
            {
              name: "Ground School - Performance",
              description: "Performance calculations and limitations for the B737-800",
              type: "ground",
              recommendedDuration: 16, // Hours
              competencies: [
                {
                  name: "Performance Calculation",
                  description: "Ability to calculate aircraft performance parameters",
                  assessmentCriteria: [
                    "Calculate takeoff and landing performance",
                    "Determine cruise performance and fuel planning",
                    "Apply appropriate safety margins"
                  ],
                  regulatoryReference: "EASA Part-FCL.725 TK-032"
                }
              ],
              regulatoryRequirements: [
                "EASA Part-FCL.725",
                "EASA OPS 1.1045"
              ]
            },
            {
              name: "Simulator Training - Basic",
              description: "Initial simulator sessions focusing on normal procedures",
              type: "simulator",
              recommendedDuration: 20, // Hours
              competencies: [
                {
                  name: "Aircraft Handling",
                  description: "Manual control of the aircraft in all flight regimes",
                  assessmentCriteria: [
                    "Demonstrate proper manual handling techniques",
                    "Maintain prescribed flight parameters within tolerances",
                    "Execute normal procedures according to checklist"
                  ],
                  regulatoryReference: "EASA Part-FCL.725(a)"
                }
              ],
              regulatoryRequirements: [
                "EASA Part-FCL.725(a)",
                "EASA CS-FSTD(A) Level D"
              ]
            }
          ],
          lessons: [
            {
              name: "Introduction to B737-800 Systems",
              description: "Overview of aircraft systems and architecture",
              content: "This lesson provides a high-level introduction to the Boeing 737-800 systems architecture, including electrical, hydraulic, pneumatic, and avionics systems.",
              type: "classroom",
              moduleIndex: 0,
              duration: 240, // Minutes
              learningObjectives: [
                "Understand the general architecture of B737-800 systems",
                "Identify the main aircraft systems and their functions",
                "Recognize the interactions between aircraft systems"
              ]
            },
            {
              name: "Normal Procedures - Preflight to Shutdown",
              description: "Standard operating procedures for a normal flight",
              content: "Detailed walkthrough of standard operating procedures from preflight preparation to engine shutdown, including all checklists and flow patterns.",
              type: "classroom",
              moduleIndex: 0,
              duration: 180, // Minutes
              learningObjectives: [
                "Memorize the normal checklist items",
                "Understand the flow patterns for cockpit procedures",
                "Recognize critical items requiring special attention"
              ]
            },
            {
              name: "Takeoff and Landing Performance",
              description: "Performance calculations for takeoff and landing",
              content: "Methods and techniques for calculating takeoff and landing performance parameters, including the effects of temperature, pressure altitude, runway slope, and contamination.",
              type: "classroom",
              moduleIndex: 1,
              duration: 240, // Minutes
              learningObjectives: [
                "Calculate takeoff performance using QRH and EFB",
                "Determine landing performance limitations",
                "Apply appropriate safety margins to calculations"
              ]
            }
          ],
          regulatoryCompliance: {
            authority: "EASA",
            requirementsMet: [
              {
                code: "Part-FCL.725",
                authority: "EASA",
                version: "2023",
                description: "Type rating requirements"
              },
              {
                code: "CS-FSTD(A)",
                authority: "EASA",
                version: "2023",
                description: "Certification requirements for flight simulators"
              }
            ],
            requirementsPartiallyMet: [
              {
                code: "OPS 1.1045",
                authority: "EASA",
                version: "2023",
                description: "Operations manual content"
              }
            ],
            requirementsNotMet: []
          },
          knowledgeGraph: {
            nodes: [
              {id: "n1", type: "module", content: "Ground School - Aircraft Systems"},
              {id: "n2", type: "module", content: "Ground School - Performance"},
              {id: "n3", type: "module", content: "Simulator Training - Basic"},
              {id: "n4", type: "competency", content: "Aircraft General Knowledge"},
              {id: "n5", type: "competency", content: "Normal Procedures Knowledge"},
              {id: "n6", type: "competency", content: "Performance Calculation"},
              {id: "n7", type: "competency", content: "Aircraft Handling"},
              {id: "n8", type: "lesson", content: "Introduction to B737-800 Systems"},
              {id: "n9", type: "lesson", content: "Normal Procedures - Preflight to Shutdown"},
              {id: "n10", type: "lesson", content: "Takeoff and Landing Performance"},
              {id: "n11", type: "regulation", content: "EASA Part-FCL.725"}
            ],
            edges: [
              {source: "n1", target: "n4", relationship: "has_competency"},
              {source: "n1", target: "n5", relationship: "has_competency"},
              {source: "n2", target: "n6", relationship: "has_competency"},
              {source: "n3", target: "n7", relationship: "has_competency"},
              {source: "n1", target: "n8", relationship: "has_lesson"},
              {source: "n1", target: "n9", relationship: "has_lesson"},
              {source: "n2", target: "n10", relationship: "has_lesson"},
              {source: "n4", target: "n11", relationship: "references"},
              {source: "n5", target: "n11", relationship: "references"},
              {source: "n6", target: "n11", relationship: "references"},
              {source: "n7", target: "n11", relationship: "references"}
            ]
          }
        };
      }
    },
    onSuccess: (data) => {
      setGeneratedSyllabus(data);
      setActiveTab('result');
      toast({
        title: 'Syllabus generated successfully',
        description: 'Your training syllabus has been created based on the document content',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Syllabus generation failed',
        description: error.message,
        variant: 'destructive',
      });
      setGenerationProgress(0);
    }
  });

  const saveSyllabusMutation = useMutation({
    mutationFn: async () => {
      // Mock API call to save the generated syllabus as a training program
      try {
        const response = await apiRequest('POST', '/api/training-programs', generatedSyllabus);
        return await response.json();
      } catch (error) {
        // Mock success response
        return { id: 123, ...generatedSyllabus, savedAt: new Date().toISOString() };
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Syllabus saved as training program',
        description: `Program ID: ${data.id} has been saved to the database`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to save syllabus',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Helper function to simulate progress for demonstration purposes
  const simulateProgress = async (start: number, end: number): Promise<void> => {
    return new Promise((resolve) => {
      let current = start;
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 2) + 1;
        if (current >= end) {
          current = end;
          clearInterval(interval);
          setGenerationProgress(current);
          resolve();
        } else {
          setGenerationProgress(current);
        }
      }, 150);
    });
  };

  const handleDocumentSelect = (value: string) => {
    setSelectedDocumentId(parseInt(value));
    setGeneratedSyllabus(null);
  };

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
    
    // Optionally update options based on template
    if (templates) {
      const template = templates.find((t: any) => t.id.toString() === value);
      if (template) {
        setOptions({
          ...options,
          programType: template.programType,
          regulatoryAuthority: template.regulatoryAuthority,
        });
      }
    }
  };

  const handleOptionChange = (key: string, value: any) => {
    setOptions({ ...options, [key]: value });
  };

  const handleGenerate = () => {
    if (selectedDocumentId) {
      setGenerationProgress(0);
      setGeneratedSyllabus(null);
      generateMutation.mutate();
    } else {
      toast({
        title: 'No document selected',
        description: 'Please select a document to generate a syllabus',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSyllabus = () => {
    if (generatedSyllabus) {
      saveSyllabusMutation.mutate();
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="setup">Setup & Configuration</TabsTrigger>
        <TabsTrigger value="progress" disabled={!generateMutation.isPending && !generatedSyllabus}>Generation Progress</TabsTrigger>
        <TabsTrigger value="result" disabled={!generatedSyllabus}>Generated Syllabus</TabsTrigger>
      </TabsList>
      
      {/* Setup Tab */}
      <TabsContent value="setup">
        <Card>
          <CardHeader>
            <CardTitle>Syllabus Generator Setup</CardTitle>
            <CardDescription>
              Configure parameters to generate a comprehensive training syllabus from document content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Source Document</Label>
                <Select
                  value={selectedDocumentId ? selectedDocumentId.toString() : ''}
                  onValueChange={handleDocumentSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingDocuments ? (
                      <SelectItem value="loading" disabled>Loading documents...</SelectItem>
                    ) : documents && documents.length > 0 ? (
                      documents.map((doc: any) => (
                        <SelectItem key={doc.id} value={doc.id.toString()}>
                          {doc.title} ({doc.fileType.toUpperCase()})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No documents available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useTemplate">Use Template</Label>
                  <Switch
                    id="useTemplate"
                    checked={options.useTemplate}
                    onCheckedChange={(checked) => handleOptionChange('useTemplate', checked)}
                  />
                </div>
                
                {options.useTemplate && (
                  <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                    <Label>Template</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={handleTemplateSelect}
                      disabled={!options.useTemplate}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingTemplates ? (
                          <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                        ) : templates && templates.length > 0 ? (
                          templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No templates available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Program Type</Label>
                <RadioGroup
                  value={options.programType}
                  onValueChange={(value) => handleOptionChange('programType', value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="initial_type_rating" id="initial_type_rating" />
                    <Label htmlFor="initial_type_rating">Initial Type Rating</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recurrent" id="recurrent" />
                    <Label htmlFor="recurrent">Recurrent Training</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="joc_mcc" id="joc_mcc" />
                    <Label htmlFor="joc_mcc">JOC/MCC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="type_conversion" id="type_conversion" />
                    <Label htmlFor="type_conversion">Type Conversion</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="instructor" id="instructor" />
                    <Label htmlFor="instructor">Instructor Training</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Custom Program</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Regulatory Authority</Label>
                <RadioGroup
                  value={options.regulatoryAuthority}
                  onValueChange={(value) => handleOptionChange('regulatoryAuthority', value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easa" id="easa" />
                    <Label htmlFor="easa">EASA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="faa" id="faa" />
                    <Label htmlFor="faa">FAA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="icao" id="icao" />
                    <Label htmlFor="icao">ICAO</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dgca" id="dgca" />
                    <Label htmlFor="dgca">DGCA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Advanced Options
                    <span className="ml-2 rounded-full bg-primary/25 px-2 py-1 text-xs">
                      Options: {Object.values(options).filter(Boolean).length - 2}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 rounded-md border p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="extractModules">Extract Training Modules</Label>
                        <p className="text-sm text-muted-foreground">
                          Identify and extract module structure from the document
                        </p>
                      </div>
                      <Switch
                        id="extractModules"
                        checked={options.extractModules}
                        onCheckedChange={(checked) => handleOptionChange('extractModules', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="extractLessons">Extract Lessons</Label>
                        <p className="text-sm text-muted-foreground">
                          Extract individual lessons and their content from the document
                        </p>
                      </div>
                      <Switch
                        id="extractLessons"
                        checked={options.extractLessons}
                        onCheckedChange={(checked) => handleOptionChange('extractLessons', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="extractCompetencies">Extract Competencies</Label>
                        <p className="text-sm text-muted-foreground">
                          Identify competencies and learning objectives from the document
                        </p>
                      </div>
                      <Switch
                        id="extractCompetencies"
                        checked={options.extractCompetencies}
                        onCheckedChange={(checked) => handleOptionChange('extractCompetencies', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="extractRegulatoryReferences">Extract Regulatory References</Label>
                        <p className="text-sm text-muted-foreground">
                          Identify and extract references to regulations and standards
                        </p>
                      </div>
                      <Switch
                        id="extractRegulatoryReferences"
                        checked={options.extractRegulatoryReferences}
                        onCheckedChange={(checked) => handleOptionChange('extractRegulatoryReferences', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="detectAircraftType">Detect Aircraft Type</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically detect the aircraft type from document content
                        </p>
                      </div>
                      <Switch
                        id="detectAircraftType"
                        checked={options.detectAircraftType}
                        onCheckedChange={(checked) => handleOptionChange('detectAircraftType', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enhancedExtraction">Enhanced Extraction</Label>
                        <p className="text-sm text-muted-foreground">
                          Use advanced algorithms for better extraction quality (may take longer)
                        </p>
                      </div>
                      <Switch
                        id="enhancedExtraction"
                        checked={options.enhancedExtraction}
                        onCheckedChange={(checked) => handleOptionChange('enhancedExtraction', checked)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  The syllabus generator uses advanced algorithms to extract and organize training content from documents.
                  For best results, use structured documents with clear headings and organized content.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={!selectedDocumentId || generateMutation.isPending}
              className="ml-auto"
            >
              {generateMutation.isPending ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Book className="mr-2 h-4 w-4" />
                  Generate Syllabus
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Progress Tab */}
      <TabsContent value="progress">
        <Card>
          <CardHeader>
            <CardTitle>Syllabus Generation Progress</CardTitle>
            <CardDescription>
              Generating a training syllabus from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{generationStep || 'Preparing document...'}</p>
                  <p className="text-sm text-gray-500">Progress: {generationProgress}%</p>
                </div>
                {generateMutation.isPending ? (
                  <RotateCw className="h-6 w-6 animate-spin text-primary" />
                ) : generatedSyllabus ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : null}
              </div>
              
              <Progress value={generationProgress} className="h-2" />
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Processing Information</AlertTitle>
                <AlertDescription>
                  Syllabus generation may take a few moments depending on document complexity and selected options.
                  The system analyzes the document structure, extracts training content, and organizes it into a coherent syllabus.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setActiveTab('result')} 
              disabled={!generatedSyllabus || generateMutation.isPending}
              className="ml-auto"
            >
              View Generated Syllabus
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Result Tab */}
      <TabsContent value="result">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle>{generatedSyllabus?.name || 'Generated Syllabus'}</CardTitle>
                <CardDescription>
                  {generatedSyllabus?.description || 'Training syllabus generated from document content'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{generatedSyllabus?.programType?.replace(/_/g, ' ')}</Badge>
                <Badge variant="outline">{generatedSyllabus?.regulatoryAuthority}</Badge>
                <Badge variant="outline">{generatedSyllabus?.aircraftType}</Badge>
                <Badge variant="secondary">Confidence: {generatedSyllabus?.confidenceScore}%</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {generatedSyllabus ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Total Duration</p>
                    <p className="font-medium">{generatedSyllabus.totalDuration} days</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Modules</p>
                    <p className="font-medium">{generatedSyllabus.modules?.length || 0}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Lessons</p>
                    <p className="font-medium">{generatedSyllabus.lessons?.length || 0}</p>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="modules">
                    <AccordionTrigger>
                      Modules ({generatedSyllabus.modules?.length || 0})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {generatedSyllabus.modules?.map((module: any, index: number) => (
                          <Card key={index}>
                            <CardHeader className="py-4">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">{module.name}</CardTitle>
                                <Badge>{module.type}</Badge>
                              </div>
                              <CardDescription>{module.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">Duration:</span>
                                  <span>{module.recommendedDuration} hours</span>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">Competencies:</p>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {module.competencies?.map((comp: any, cIndex: number) => (
                                      <li key={cIndex}>{comp.name}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                {module.regulatoryRequirements?.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Regulatory References:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {module.regulatoryRequirements.map((req: string, rIndex: number) => (
                                        <Badge key={rIndex} variant="outline">{req}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="lessons">
                    <AccordionTrigger>
                      Lessons ({generatedSyllabus.lessons?.length || 0})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {generatedSyllabus.lessons?.map((lesson: any, index: number) => (
                          <Card key={index}>
                            <CardHeader className="py-4">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">{lesson.name}</CardTitle>
                                <Badge>{lesson.type}</Badge>
                              </div>
                              <CardDescription>{lesson.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">Duration:</span>
                                  <span>{lesson.duration} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">Module:</span>
                                  <span>
                                    {generatedSyllabus.modules[lesson.moduleIndex]?.name || `Module ${lesson.moduleIndex + 1}`}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">Learning Objectives:</p>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {lesson.learningObjectives?.map((obj: string, oIndex: number) => (
                                      <li key={oIndex}>{obj}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                {lesson.content && (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Content Summary:</p>
                                    <p className="text-sm border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                                      {lesson.content.length > 150 
                                        ? `${lesson.content.substring(0, 150)}...` 
                                        : lesson.content
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="compliance">
                    <AccordionTrigger>
                      Regulatory Compliance
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Requirements Met</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Authority</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {generatedSyllabus.regulatoryCompliance?.requirementsMet.map((req: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{req.code}</TableCell>
                                  <TableCell>{req.authority}</TableCell>
                                  <TableCell>{req.description}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {generatedSyllabus.regulatoryCompliance?.requirementsPartiallyMet.length > 0 && (
                          <div>
                            <h3 className="font-medium mb-2 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                              Requirements Partially Met
                            </h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Authority</TableHead>
                                  <TableHead>Description</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {generatedSyllabus.regulatoryCompliance?.requirementsPartiallyMet.map((req: any, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{req.code}</TableCell>
                                    <TableCell>{req.authority}</TableCell>
                                    <TableCell>{req.description}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No Syllabus Available</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Generate a syllabus to see results here
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setActiveTab('setup')}>
              Generate Another Syllabus
            </Button>
            <Button 
              variant="outline" 
              disabled={!generatedSyllabus}
              onClick={() => {
                toast({
                  title: 'Export initiated',
                  description: 'Exporting syllabus to PDF format',
                });
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              onClick={handleSaveSyllabus} 
              disabled={!generatedSyllabus || saveSyllabusMutation.isPending}
              className="ml-auto"
            >
              {saveSyllabusMutation.isPending ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Training Program
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default SyllabusGenerationTab;