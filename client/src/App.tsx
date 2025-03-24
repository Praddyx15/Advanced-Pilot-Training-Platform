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
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { AppProvider } from "./contexts/app-context";
import { ThemeProvider } from "./contexts/theme-context";
import { NotificationProvider } from "./components/notification/notification-provider";

function Router() {
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
              <Router />
              <Toaster />
            </NotificationProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/theme-context';
import AppLayout from './components/layouts/app-layout';
import LoginPage from './pages/auth/login';
import DashboardPage from './pages/dashboard';
import './App.css';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
            {/* Add more routes as needed */}
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
