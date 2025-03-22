import { useAuth } from '@/hooks/use-auth';
import SyllabusGenerator from '@/components/syllabus/syllabus-generator';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function SyllabusGeneratorPage() {
  const { user, isLoading } = useAuth();
  
  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <SyllabusGenerator />;
}