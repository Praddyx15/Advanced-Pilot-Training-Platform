import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CalendarClock,
  GraduationCap,
  Trophy,
  BookOpen,
  CheckCircle2,
  Star,
  Clock,
  ChevronRight,
  BookMarked,
  Plane,
  XOctagon,
  AlertCircle,
  FileCheck,
  ArrowRight,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export function CPLTraineeDashboard() {
  // Fetch trainee profile and progress data
  const { data: traineeData, isLoading: isTraineeLoading } = useQuery({
    queryKey: ['/api/trainee/profile'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/profile');
        return await response.json();
      } catch (error) {
        // Return sample data for development
        return {
          firstName: "Michael",
          lastName: "Wilson",
          id: "ST0972",
          program: "ATPL",
          phase: "Advanced",
          programCompletion: 68,
          flightHours: 142.5,
          theorySessions: 12,
          theorySessions_total: 14,
          daysRemaining: 72,
          criticalPath: true
        };
      }
    },
  });

  // Fetch upcoming schedule
  const { data: upcomingSchedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['/api/trainee/upcoming-schedule'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/upcoming-schedule');
        return await response.json();
      } catch (error) {
        // Return sample data for development
        return [
          {
            activity: "B737 Simulator Session",
            date: "Today",
            time: "14:00-17:00",
            status: "today"
          },
          {
            activity: "Emergency Procedures",
            date: "Tomorrow",
            time: "09:00-12:00",
            status: "confirmed"
          },
          {
            activity: "Flight Planning Seminar",
            date: "Mar 24",
            time: "13:00-15:00",
            status: "confirmed"
          },
          {
            activity: "Cross-Country Flight",
            date: "Mar 25",
            time: "10:00-16:00",
            status: "pending"
          }
        ];
      }
    },
  });

  // Fetch performance analytics
  const { data: performanceData, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['/api/trainee/performance-analytics'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/performance-analytics');
        return await response.json();
      } catch (error) {
        // Return sample data for development
        return [
          { skill: "Technical Knowledge", value: 75 },
          { skill: "Procedures", value: 65 },
          { skill: "Decision Making", value: 70 },
          { skill: "Flight Skills", value: 80 },
          { skill: "CRM", value: 68 },
        ];
      }
    },
  });

  // Fetch recommended resources
  const { data: recommendedResources, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['/api/trainee/recommended-resources'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/recommended-resources');
        return await response.json();
      } catch (error) {
        // Return sample data for development
        return [
          {
            title: "Emergency Procedures Handbook",
            type: "document",
            description: "B737 Quick Reference • PDF Document",
            action: "Open"
          },
          {
            title: "Decision Making Under Pressure",
            type: "video",
            description: "Training Video • 45 minutes",
            action: "Watch"
          }
        ];
      }
    },
  });
  
  // Fetch instructor feedback
  const { data: instructorFeedback, isLoading: isFeedbackLoading } = useQuery({
    queryKey: ['/api/trainee/instructor-feedback'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/instructor-feedback');
        return await response.json();
      } catch (error) {
        // Return sample data for development
        return "Michael demonstrates strong technical knowledge but needs more practice with emergency procedures.";
      }
    },
  });
  
  // Fetch training goals
  const { data: trainingGoals, isLoading: isGoalsLoading } = useQuery({
    queryKey: ['/api/trainee/training-goals'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/training-goals');
        return await response.json();
      } catch (error) {
        // Return sample data for development
        return [
          {
            goal: "Complete Emergency Procedures Training",
            progress: 75
          },
          {
            goal: "Pass All Theory Exams",
            progress: 85
          },
          {
            goal: "Complete Cross-Country Flight Requirements",
            progress: 60
          }
        ];
      }
    },
  });

  // Loading state
  if (isTraineeLoading || isScheduleLoading || isPerformanceLoading || 
      isResourcesLoading || isFeedbackLoading || isGoalsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Status badge color helper
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'today': return 'bg-blue-600';
      case 'confirmed': return 'bg-green-600';
      case 'pending': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container py-6">
      {/* Header with program info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Training Dashboard</h1>
        <p className="text-muted-foreground">
          Program: {traineeData.program} • ID: {traineeData.id} • Phase: {traineeData.phase}
        </p>
      </div>
      
      {/* Progress metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{traineeData.programCompletion}%</div>
            <Progress 
              value={traineeData.programCompletion} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
        
        {/* Flight Hours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Flight Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{traineeData.flightHours}</div>
            <div className="text-xs text-muted-foreground">/ 215 hrs</div>
            <Progress 
              value={(traineeData.flightHours / 215) * 100} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
        
        {/* Theory Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Theory Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{traineeData.theorySessions}</div>
            <div className="text-xs text-muted-foreground">/ {traineeData.theorySessions_total} exams</div>
            <Progress 
              value={(traineeData.theorySessions / traineeData.theorySessions_total) * 100} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
        
        {/* Days Remaining */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Days Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{traineeData.daysRemaining}</div>
            <div className="text-xs text-red-500 font-medium">Critical path</div>
            <Progress 
              value={30} 
              className="h-2 mt-2 bg-red-200" 
              indicatorClassName="bg-red-500"
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Schedule and Performance Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>My Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingSchedule.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.activity}</TableCell>
                    <TableCell>{item.date}, {item.time}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Performance Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                cx="50%" 
                cy="50%" 
                outerRadius="80%" 
                data={performanceData}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  fill="#6366f1" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recommended Resources, Feedback and Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedResources.map((resource, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`flex items-center justify-center size-10 rounded ${
                    resource.type === 'document' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {resource.type === 'document' ? (
                      <BookOpen className="h-5 w-5" />
                    ) : (
                      <BookMarked className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {resource.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          {/* Recent Instructor Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Instructor Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{instructorFeedback}</p>
            </CardContent>
          </Card>
          
          {/* My Training Goals */}
          <Card>
            <CardHeader>
              <CardTitle>My Training Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingGoals.map((goal, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{goal.goal}</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}