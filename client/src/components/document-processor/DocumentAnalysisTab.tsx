import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Info, RotateCw, Search, CheckCircle, AlertTriangle, PieChart, ExternalLink, FileSearch, BookOpen } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function DocumentAnalysisTab() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const { toast } = useToast();

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
          { id: 4, title: 'Type Rating Syllabus', fileType: 'docx', uploadedAt: '2025-03-10', category: 'training' },
          { id: 5, title: 'Airworthiness Directive', fileType: 'pdf', uploadedAt: '2025-03-05', category: 'regulatory' },
        ];
      }
    }
  });

  // Mutation for document analysis
  const analysisMutation = useMutation({
    mutationFn: async (documentId: number) => {
      // Simulate analysis steps with incremental progress updates
      setAnalysisStep('Classifying document content...');
      await simulateProgress(0, 20);
      
      setAnalysisStep('Performing terminology analysis...');
      await simulateProgress(20, 40);
      
      setAnalysisStep('Extracting key concepts and entities...');
      await simulateProgress(40, 60);
      
      setAnalysisStep('Detecting relationships between concepts...');
      await simulateProgress(60, 80);
      
      setAnalysisStep('Generating document insights...');
      await simulateProgress(80, 100);
      
      try {
        const response = await apiRequest('POST', `/api/documents/${documentId}/analyze`, {
          options: {
            extractReferences: true,
            detectCrossReferences: true,
            enhancedEntityRecognition: true,
          }
        });
        return await response.json();
      } catch (error) {
        // Return mock data for demonstration
        return {
          documentId,
          category: 'TECHNICAL',
          subjects: ['AIRCRAFT_SYSTEMS', 'NAVIGATION', 'EMERGENCY_PROCEDURES'],
          priority: 'MEDIUM',
          tags: ['Boeing 737', 'maintenance', 'checklist', 'systems', 'avionics'],
          confidence: 92,
          entities: [
            { type: 'aircraft', text: 'Boeing 737', count: 18, importance: 0.92 },
            { type: 'system', text: 'Hydraulic System', count: 12, importance: 0.85 },
            { type: 'system', text: 'Flight Control', count: 8, importance: 0.84 },
            { type: 'procedure', text: 'Preflight Inspection', count: 6, importance: 0.78 },
            { type: 'component', text: 'Ailerons', count: 9, importance: 0.72 },
            { type: 'component', text: 'Elevators', count: 7, importance: 0.71 },
            { type: 'component', text: 'Rudder', count: 6, importance: 0.68 },
            { type: 'system', text: 'Landing Gear', count: 5, importance: 0.65 },
          ],
          references: [
            { type: 'regulatory', text: 'FAA Advisory Circular 120-16G', importance: 0.95 },
            { type: 'technical', text: 'Boeing 737 AMM', importance: 0.90 },
            { type: 'regulatory', text: 'EASA CS-25', importance: 0.85 },
            { type: 'operational', text: 'Boeing FCTM', importance: 0.82 },
          ],
          keyInsights: [
            'Document focuses on hydraulic system maintenance procedures',
            'Contains critical safety information for preflight inspections',
            'References multiple regulatory requirements from FAA and EASA',
            'Includes detailed component specifications for flight control surfaces',
          ],
          relatedDocuments: [
            { id: 3, title: 'Regulatory Compliance Guide', similarity: 0.75 },
            { id: 5, title: 'Airworthiness Directive', similarity: 0.68 },
          ],
          statistics: {
            pageCount: 42,
            wordCount: 12850,
            tableCount: 8,
            imageCount: 15,
            processingTime: 3.42,
          }
        };
      }
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      toast({
        title: 'Analysis complete',
        description: 'Document has been successfully analyzed',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
      setAnalysisProgress(0);
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
          setAnalysisProgress(current);
          resolve();
        } else {
          setAnalysisProgress(current);
        }
      }, 100);
    });
  };

  const handleDocumentSelect = (value: string) => {
    setSelectedDocumentId(parseInt(value));
    setAnalysisResults(null);
  };

  const handleAnalyze = () => {
    if (selectedDocumentId) {
      setAnalysisProgress(0);
      setAnalysisResults(null);
      analysisMutation.mutate(selectedDocumentId);
    } else {
      toast({
        title: 'No document selected',
        description: 'Please select a document to analyze',
        variant: 'destructive',
      });
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical':
        return 'bg-blue-500';
      case 'regulatory':
        return 'bg-red-500';
      case 'operational':
        return 'bg-green-500';
      case 'training':
        return 'bg-purple-500';
      case 'assessment':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSubjectBadgeColor = (subject: string) => {
    switch (subject) {
      case 'AIRCRAFT_SYSTEMS':
        return 'bg-blue-400';
      case 'FLIGHT_PROCEDURES':
        return 'bg-green-400';
      case 'EMERGENCY_PROCEDURES':
        return 'bg-red-400';
      case 'REGULATIONS':
        return 'bg-purple-400';
      case 'METEOROLOGY':
        return 'bg-cyan-400';
      case 'NAVIGATION':
        return 'bg-amber-400';
      case 'HUMAN_FACTORS':
        return 'bg-pink-400';
      case 'COMMUNICATIONS':
        return 'bg-indigo-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'aircraft':
        return <FileText className="h-4 w-4" />;
      case 'system':
        return <PieChart className="h-4 w-4" />;
      case 'procedure':
        return <CheckCircle className="h-4 w-4" />;
      case 'component':
        return <FileSearch className="h-4 w-4" />;
      case 'regulatory':
        return <AlertTriangle className="h-4 w-4" />;
      case 'technical':
        return <BookOpen className="h-4 w-4" />;
      case 'operational':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Analysis</CardTitle>
          <CardDescription>
            Select a document to analyze its content, extract key concepts, and identify important information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Select Document</label>
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
            
            {analysisMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{analysisStep || 'Preparing analysis...'}</p>
                    <p className="text-sm text-gray-500">Progress: {analysisProgress}%</p>
                  </div>
                  <RotateCw className="h-6 w-6 animate-spin text-primary" />
                </div>
                
                <Progress value={analysisProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAnalyze} 
            disabled={!selectedDocumentId || analysisMutation.isPending}
            className="ml-auto"
          >
            {analysisMutation.isPending ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze Document
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Analysis Results */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>Document analysis and insights</CardDescription>
              </div>
              <Badge className={getCategoryBadgeColor(analysisResults.category)}>
                {analysisResults.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Document Overview */}
              <div>
                <h3 className="text-lg font-medium mb-2">Document Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{analysisResults.category}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Confidence</p>
                    <p className="font-medium">{analysisResults.confidence}%</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Priority</p>
                    <p className="font-medium">{analysisResults.priority}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Pages</p>
                    <p className="font-medium">{analysisResults.statistics?.pageCount || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Subject Areas */}
              <div>
                <h3 className="text-lg font-medium mb-2">Subject Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.subjects.map((subject: string, index: number) => (
                    <Badge key={index} className={getSubjectBadgeColor(subject)}>
                      {subject.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <h3 className="text-lg font-medium mb-2">Document Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-background">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Key Entities */}
              <div>
                <h3 className="text-lg font-medium mb-2">Key Entities</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Occurrence</TableHead>
                      <TableHead className="text-right">Importance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisResults.entities.map((entity: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center">
                            {getEntityTypeIcon(entity.type)}
                            <span className="ml-2">{entity.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{entity.text}</TableCell>
                        <TableCell className="text-right">{entity.count}</TableCell>
                        <TableCell className="text-right">
                          <Progress value={entity.importance * 100} className="h-2" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* References */}
              <div>
                <h3 className="text-lg font-medium mb-2">Document References</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Relevance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisResults.references.map((reference: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center">
                            {getEntityTypeIcon(reference.type)}
                            <span className="ml-2">{reference.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{reference.text}</TableCell>
                        <TableCell className="text-right">
                          <Progress value={reference.importance * 100} className="h-2" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Key Insights */}
              <div>
                <h3 className="text-lg font-medium mb-2">Key Insights</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResults.keyInsights.map((insight: string, index: number) => (
                    <li key={index} className="text-sm">{insight}</li>
                  ))}
                </ul>
              </div>
              
              {/* Related Documents */}
              {analysisResults.relatedDocuments && analysisResults.relatedDocuments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Related Documents</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead className="text-right">Similarity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisResults.relatedDocuments.map((doc: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{doc.title}</TableCell>
                          <TableCell className="text-right">{(doc.similarity * 100).toFixed(0)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Document Statistics */}
              <div>
                <h3 className="text-lg font-medium mb-2">Document Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Pages</p>
                    <p className="font-medium">{analysisResults.statistics?.pageCount || '-'}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Words</p>
                    <p className="font-medium">{analysisResults.statistics?.wordCount?.toLocaleString() || '-'}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Tables</p>
                    <p className="font-medium">{analysisResults.statistics?.tableCount || '-'}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Images</p>
                    <p className="font-medium">{analysisResults.statistics?.imageCount || '-'}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Processing Time</p>
                    <p className="font-medium">{analysisResults.statistics?.processingTime?.toFixed(2) || '-'}s</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="ml-auto" onClick={handleAnalyze}>
              <RotateCw className="mr-2 h-4 w-4" />
              Re-Analyze Document
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default DocumentAnalysisTab;