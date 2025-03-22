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
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { AppProvider } from "./contexts/app-context";
import { ThemeProvider } from "./contexts/theme-context";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/syllabus-generator" component={SyllabusGeneratorPage} />
      <ProtectedRoute path="/knowledge-graph" component={KnowledgeGraphPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboardPage} />
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
            <Router />
            <Toaster />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
