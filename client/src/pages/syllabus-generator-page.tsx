import { useAuth } from '@/hooks/use-auth';
import SyllabusGenerator from '@/components/syllabus/syllabus-generator';
import { Redirect } from 'wouter';

export default function SyllabusGeneratorPage() {
  const { user, isLoading } = useAuth();
  
  // Don't render anything while checking auth status
  if (isLoading) {
    return null;
  }
  
  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <SyllabusGenerator />;
}