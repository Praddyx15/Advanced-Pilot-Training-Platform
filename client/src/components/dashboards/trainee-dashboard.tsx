import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { ComingSoon } from '@/components/shared/coming-soon';
import { CPLTraineeDashboard } from './cpl-trainee-dashboard';

// Define types for our data structures
interface TraineeProfile {
  firstName: string;
  lastName: string;
  id: string;
  program: string;
  programCompletion: number;
  totalFlightHours: number;
  soloHours: number;
  instructorHours: number;
  nextMilestone: string;
  licenseProgress: {
    groundTheory: number;
    flightTraining: number;
    skillTest: number;
  };
}

interface UpcomingSession {
  id: number;
  title: string;
  type: string;
  date: string;
  time: string;
  instructor: string;
  aircraft?: string;
  location?: string;
  status: string;
}

interface LearningResource {
  id: number;
  title: string;
  type: string;
  progress: number;
  dueDate?: string;
  completedOn?: string;
  priority: string;
  requiredFor?: string;
}

interface PerformanceGoal {
  id: number;
  title: string;
  current: number;
  target: number;
  deadline: string;
}

interface Achievement {
  id: number;
  title: string;
  date: string;
  description: string;
  badge: string;
}

export function TraineeDashboard() {
  const [location] = useLocation();
  
  // Check if we're at a specific feature page  
  if (location.startsWith('/flight-records')) {
    return <ComingSoon title="Flight Records" description="Access to your digital logbook and flight records is coming soon." />;
  }
  
  if (location.startsWith('/risk-assessment')) {
    return <ComingSoon title="3D Risk Assessment" description="Advanced 3D risk assessment visualization tools are coming soon." />;
  }
  
  if (location.startsWith('/ar-visualization')) {
    return <ComingSoon title="AR/VR Visualization" description="Augmented and Virtual Reality training visualization is coming soon." />;
  }
  
  if (location.startsWith('/biometric-assessment')) {
    return <ComingSoon title="Biometric Assessment" description="Advanced biometric data integration for performance assessment is coming soon." />;
  }
  
  if (location.startsWith('/maintenance-tracking')) {
    return <ComingSoon title="Maintenance Tracking" description="Aircraft maintenance and inspection tracking tools are coming soon." />;
  }
  
  if (location.startsWith('/video-conferencing')) {
    return <ComingSoon title="Video Conferencing" description="Integrated video conferencing with AI transcription is coming soon." />;
  }
  
  if (location.startsWith('/collaborative-editing')) {
    return <ComingSoon title="Collaborative Editing" description="Real-time collaborative document and syllabus editing is coming soon." />;
  }
  
  if (location.startsWith('/blockchain-audit')) {
    return <ComingSoon title="Blockchain Audit Trails" description="Secure blockchain-backed audit trails for training records are coming soon." />;
  }
  
  // Render the new CPL trainee dashboard as the default view
  return <CPLTraineeDashboard />;
}