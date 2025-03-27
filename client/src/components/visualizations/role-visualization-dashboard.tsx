import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { RoleType } from "@shared/risk-assessment-types";
import { useToast } from "@/hooks/use-toast";

// Import role-specific visualizations
import TraineeSkillRadar from "./trainee-skill-radar";
import AirlineComplianceChart from "./airline-compliance-chart";
import ExaminerPerformanceHeatmap from "./examiner-performance-heatmap";
import InstructorAnalyticsChart from "./instructor-analytics-chart";
import ATOCertificationChart from "./ato-certification-chart";
import RiskAssessmentMatrix3D from "./risk-assessment-matrix";

interface RoleVisualizationDashboardProps {
  userRole: RoleType;
}

export const RoleVisualizationDashboard: React.FC<RoleVisualizationDashboardProps> = ({
  userRole
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Get visualization data based on user role
  const { data: visualizationData, isLoading, error } = useQuery({
    queryKey: ["/api/visualizations", userRole],
    // If you have an API endpoint for visualization data, enable the queryFn
    // queryFn: () => fetch(`/api/visualizations?role=${userRole}`).then(res => res.json()),
    // For now, we'll disable network requests since the API endpoint isn't implemented yet
    enabled: false
  });
  
  // Sample data for development/testing
  const [sampleData, setSampleData] = useState<any>({
    traineeRadarData: [
      { skill: "Technical Knowledge", value: 82, fullMark: 100 },
      { skill: "Flight Controls", value: 75, fullMark: 100 },
      { skill: "Navigation", value: 86, fullMark: 100 },
      { skill: "Communication", value: 90, fullMark: 100 },
      { skill: "Emergency Procedures", value: 68, fullMark: 100 },
      { skill: "Decision Making", value: 72, fullMark: 100 },
    ],
    airlineComplianceData: [
      { regulation: "EASA FCL.055", status: "compliant", value: 92, dueDate: new Date(2025, 6, 15) },
      { regulation: "EASA FCL.625", status: "partial", value: 78, dueDate: new Date(2025, 4, 30) },
      { regulation: "FAA 14 CFR 61.58", status: "compliant", value: 95, dueDate: new Date(2025, 9, 10) },
      { regulation: "ICAO Annex 1", status: "non-compliant", value: 63, dueDate: new Date(2025, 3, 5) },
      { regulation: "EASA Part-MED", status: "compliant", value: 88, dueDate: new Date(2025, 8, 22) },
    ],
    examinerPerformanceData: [
      { competency: "Radio Communications", value: 88, average: 75 },
      { competency: "Instrument Approach", value: 72, average: 70 },
      { competency: "Emergency Procedures", value: 63, average: 65 },
      { competency: "Crosswind Landing", value: 78, average: 68 },
      { competency: "Cockpit Management", value: 92, average: 78 },
      { competency: "Situational Awareness", value: 81, average: 72 },
    ],
    instructorAnalyticsData: [
      { competency: "Technical Knowledge", value: 78, average: 72 },
      { competency: "Flight Controls", value: 65, average: 68 },
      { competency: "Navigation", value: 82, average: 75 },
      { competency: "Communication", value: 88, average: 80 },
      { competency: "Emergency Procedures", value: 71, average: 65 },
      { competency: "Decision Making", value: 76, average: 70 },
    ],
    atoCertificationData: [
      { name: "Active", value: 35, color: "#1bc5bd" },
      { name: "Pending Renewal", value: 12, color: "#ffa800" },
      { name: "In Approval Process", value: 8, color: "#3699ff" },
      { name: "Expired", value: 5, color: "#f64e60" },
    ],
    riskMatrixData: [
      { 
        severity: 4, 
        occurrence: 3, 
        detection: 2, 
        value: 24, 
        title: "Engine Failure", 
        category: "technical" 
      },
      { 
        severity: 3, 
        occurrence: 2, 
        detection: 4, 
        value: 24, 
        title: "Navigation Error", 
        category: "operational" 
      },
      { 
        severity: 5, 
        occurrence: 1, 
        detection: 2, 
        value: 10, 
        title: "Hydraulic System Failure", 
        category: "technical" 
      },
      { 
        severity: 2, 
        occurrence: 4, 
        detection: 3, 
        value: 24, 
        title: "Communication Loss", 
        category: "operational" 
      },
      { 
        severity: 4, 
        occurrence: 2, 
        detection: 3, 
        value: 24, 
        title: "Weather Hazard", 
        category: "environmental" 
      },
    ],
  });

  // Demo effect to simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      // This would be replaced with actual API data in production
      console.log(`Loading visualization data for ${userRole} role`);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [userRole]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading visualization data",
        description: "Could not load the visualization data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading visualization data...</span>
      </div>
    );
  }

  // Get the appropriate visualization component based on user role
  const getRoleVisualization = () => {
    switch (userRole) {
      case RoleType.TRAINEE:
        return (
          <TraineeSkillRadar 
            data={sampleData.traineeRadarData} 
            title="Your Skill Assessment"
            description="Overview of your aviation skills and competencies"
          />
        );
      case RoleType.AIRLINE:
        return (
          <AirlineComplianceChart 
            data={sampleData.airlineComplianceData} 
            title="Regulatory Compliance Status"
            description="Compliance levels for key aviation regulations"
          />
        );
      case RoleType.EXAMINER:
        return (
          <ExaminerPerformanceHeatmap 
            data={sampleData.examinerPerformanceData} 
            title="Trainee Performance Analysis"
            description="Comparative analysis of trainee performance vs. average"
          />
        );
      case RoleType.INSTRUCTOR:
        return (
          <InstructorAnalyticsChart 
            data={sampleData.instructorAnalyticsData} 
            title="Trainee Progress Tracking"
            description="Real-time progress monitoring of your trainees"
          />
        );
      case RoleType.ATO:
        return (
          <ATOCertificationChart 
            data={sampleData.atoCertificationData} 
            title="Training Program Status"
            description="Current status of all training program certifications"
          />
        );
      default:
        return (
          <div className="flex justify-center items-center h-[400px]">
            <span className="text-muted-foreground">No visualization available for this role</span>
          </div>
        );
    }
  };

  return (
    <Card className="shadow-md">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Role Overview</TabsTrigger>
          <TabsTrigger value="riskMatrix">Risk Assessment</TabsTrigger>
          <TabsTrigger value="trends">Trends Analysis</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="p-4">
          {getRoleVisualization()}
        </TabsContent>
        
        <TabsContent value="riskMatrix" className="p-4">
          {/* Role-specific configuration for risk assessment matrix */}
          {userRole === RoleType.TRAINEE && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Flight Risk Assessment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Visualize and understand your flight training risk profile in three dimensions
              </p>
              <RiskAssessmentMatrix3D 
                data={sampleData.riskMatrixData}
                config={{
                  minValue: 0,
                  maxValue: 100,
                  colors: {
                    veryLow: "#1bc5bd",
                    low: "#3699ff",
                    medium: "#ffa800",
                    high: "#f64e60",
                    veryHigh: "#8950fc"
                  },
                  animate: true,
                  showLabels: true,
                  rotationSpeed: 0.5
                }}
              />
            </div>
          )}
          
          {userRole === RoleType.INSTRUCTOR && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Student Risk Assessment Matrix</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Visualize and manage risk factors for your trainees across multiple dimensions
              </p>
              <RiskAssessmentMatrix3D 
                data={sampleData.riskMatrixData}
                config={{
                  minValue: 0,
                  maxValue: 100,
                  colors: {
                    veryLow: "#1bc5bd",
                    low: "#3699ff",
                    medium: "#ffa800",
                    high: "#f64e60",
                    veryHigh: "#8950fc"
                  },
                  animate: true,
                  showLabels: true,
                  rotationSpeed: 0.3
                }}
              />
            </div>
          )}
          
          {userRole !== RoleType.TRAINEE && userRole !== RoleType.INSTRUCTOR && (
            <RiskAssessmentMatrix3D 
              data={sampleData.riskMatrixData}
              config={{
                minValue: 0,
                maxValue: 100,
                colors: {
                  veryLow: "#1bc5bd",
                  low: "#3699ff",
                  medium: "#ffa800",
                  high: "#f64e60",
                  veryHigh: "#8950fc"
                },
                animate: true,
                showLabels: true
              }}
            />
          )}
        </TabsContent>
        
        <TabsContent value="trends" className="p-4">
          <div className="flex flex-col items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Trends analysis will be implemented soon</p>
          </div>
        </TabsContent>
        
        <TabsContent value="compliance" className="p-4">
          <div className="flex flex-col items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Compliance dashboard will be implemented soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default RoleVisualizationDashboard;