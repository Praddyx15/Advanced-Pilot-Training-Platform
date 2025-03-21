import { useState, useEffect } from "react";
import { useApp } from "@/contexts/app-context";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/components/dashboard/dashboard";
import ProgramsList from "@/components/programs/programs-list";
import ProgramDetail from "@/components/programs/program-detail";
import SessionsList from "@/components/sessions/sessions-list";
import SessionDetail from "@/components/sessions/session-detail";
import SessionForm from "@/components/sessions/session-form";
import AssessmentsList from "@/components/assessments/assessment-list";
import AssessmentForm from "@/components/assessments/assessment-form";
import TraineesList from "@/components/trainees/trainees-list";
import ResourcesList from "@/components/resources/resource-list";
import DocumentsList from "@/components/documents/document-list";
import SettingsPage from "@/components/settings/settings-page";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { 
    activeTab, 
    isLoadingPrograms,
    isLoadingSessions,
    isLoadingAssessments,
    isLoadingTrainees,
    isLoadingResources,
    isLoadingDocuments,
    selectedProgramId,
    selectedSessionId,
    isCreatingSession,
    isEditingAssessment,
    searchQuery,
    handleSearchChange
  } = useApp();

  // Determine which content to show
  const renderMainContent = () => {
    if (isLoadingPrograms || isLoadingSessions || isLoadingAssessments || 
        isLoadingTrainees || isLoadingResources || isLoadingDocuments) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "programs":
        return selectedProgramId ? 
          <ProgramDetail programId={selectedProgramId} /> : 
          <ProgramsList searchQuery={searchQuery} />;
      case "sessions":
        if (isCreatingSession) {
          return <SessionForm />;
        }
        return selectedSessionId ? 
          <SessionDetail sessionId={selectedSessionId} /> : 
          <SessionsList searchQuery={searchQuery} />;
      case "assessments":
        return isEditingAssessment ? 
          <AssessmentForm /> : 
          <AssessmentsList />;
      case "trainees":
        return <TraineesList searchQuery={searchQuery} />;
      case "resources":
        return <ResourcesList searchQuery={searchQuery} />;
      case "documents":
        return <DocumentsList searchQuery={searchQuery} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header searchQuery={searchQuery} onSearch={handleSearchChange} />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
