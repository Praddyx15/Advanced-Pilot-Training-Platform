import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SyllabusGeneratorPage from "@/pages/syllabus-generator-page";
import KnowledgeGraphPage from "@/pages/knowledge-graph-page";
import AnalyticsDashboardPage from "@/pages/analytics-dashboard";
import SessionReplayPage from "@/pages/session-replay-page";
import AchievementsPage from "@/pages/achievements-page";
import DocumentsPage from "@/pages/documents-page";
import DocumentProcessorPage from "@/pages/document-processor-page";
import CompliancePage from "@/pages/compliance-page";
import TestNotificationPage from "@/pages/test-notification-page";
import TrainingProgramsPage from "@/pages/training-programs-page";
import HelpPage from "@/pages/help-page";
import AssessmentsPage from "@/pages/assessments-page";
import AssessmentGradingPage from "@/pages/assessment-grading-page";
import TraineePerformancePage from "@/pages/trainee-performance-page";
import SchedulePage from "@/pages/schedule-page";
import MessagingPage from "@/pages/messaging-page";
import ResourcesPage from "@/pages/resources-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { AppProvider } from "./contexts/app-context";
import { ThemeProvider } from "./contexts/theme-context";
import { NotificationProvider } from "./components/notification/notification-provider";

function AppRouter() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/syllabus-generator" component={SyllabusGeneratorPage} />
      <ProtectedRoute path="/knowledge-graph" component={KnowledgeGraphPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboardPage} />
      <ProtectedRoute path="/session-replay" component={SessionReplayPage} />
      <ProtectedRoute path="/achievements" component={AchievementsPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/document-processor" component={DocumentProcessorPage} />
      <ProtectedRoute path="/compliance" component={CompliancePage} />
      <ProtectedRoute path="/training-programs" component={TrainingProgramsPage} />
      <ProtectedRoute path="/test-notification" component={TestNotificationPage} />
      <ProtectedRoute path="/help" component={HelpPage} />
      <ProtectedRoute path="/assessments" component={AssessmentsPage} />
      <ProtectedRoute path="/assessments/:id/grade" component={AssessmentGradingPage} />
      <ProtectedRoute path="/trainee-performance" component={TraineePerformancePage} />
      <ProtectedRoute path="/trainee-performance/:id" component={TraineePerformancePage} />
      <ProtectedRoute path="/schedule" component={SchedulePage} />
      <ProtectedRoute path="/messaging" component={MessagingPage} />
      <ProtectedRoute path="/resources" component={ResourcesPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <NotificationProvider>
              <AppRouter />
              <Toaster />
            </NotificationProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
