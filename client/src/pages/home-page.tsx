import { useAuth } from '@/hooks/use-auth';
import { TraineeDashboard } from '@/components/dashboards/trainee-dashboard';
import { InstructorDashboard } from '@/components/dashboards/instructor-dashboard';
import { ATODashboard } from '@/components/dashboards/ato-dashboard';
import { ExaminerDashboard } from '@/components/dashboards/examiner-dashboard';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Render the appropriate dashboard based on user role
  const renderDashboard = () => {
    if (!user) return null;

    if (user.role === 'admin') {
      return <AdminDashboard />;
    } else if (user.role === 'instructor') {
      return <InstructorDashboard />;
    } else if (user.role === 'examiner') {
      return <ExaminerDashboard />;
    } else if (user.role === 'ato' || (user.organizationType === 'ATO' && user.role === 'manager')) {
      return <ATODashboard />;
    } else {
      // Default to trainee dashboard for any other role
      return <TraineeDashboard />;
    }
  };

  return (
    <AppLayout>
      {renderDashboard()}
    </AppLayout>
  );
}