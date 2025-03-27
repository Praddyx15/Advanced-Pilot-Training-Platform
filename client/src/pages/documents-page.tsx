import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentList } from '@/components/document-management/document-list';
import { DocumentUploader } from '@/components/document-management/document-uploader';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('browse');
  const { user } = useAuth();
  useDocumentTitle('Documents');

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'instructor':
        return '/instructor';
      case 'admin':
        return '/admin';
      case 'trainee':
        return '/trainee';
      default:
        return '/';
    }
  };

  return (
    <div className="container py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground mt-2">
            Browse, upload, and manage your training documents
          </p>
        </div>
        
        <Link href={getDashboardLink()}>
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="browse">Browse Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="mt-6">
          <DocumentList />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-6">
          <DocumentUploader onUploadComplete={() => setActiveTab('browse')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}