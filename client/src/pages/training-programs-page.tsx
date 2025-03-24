import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useApp } from '@/contexts/app-context';
import ProgramsList from '@/components/programs/programs-list';
import ProgramDetail from '@/components/programs/program-detail';
import { AppLayout } from '@/components/layouts/app-layout';

export default function TrainingProgramsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedProgramId } = useApp();

  // Fetch all training programs
  const { data: programs = [] } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/programs');
        return await response.json();
      } catch (error) {
        console.error('Error fetching programs:', error);
        return [];
      }
    },
  });

  return (
    <>
      <Helmet>
        <title>Training Programs | Advanced Pilot Training Platform</title>
      </Helmet>
      <AppLayout>
        <div className="container mx-auto max-w-7xl">
          {selectedProgramId ? (
            <ProgramDetail programId={selectedProgramId} />
          ) : (
            <ProgramsList 
              searchQuery={searchQuery} 
            />
          )}
        </div>
      </AppLayout>
    </>
  );
}