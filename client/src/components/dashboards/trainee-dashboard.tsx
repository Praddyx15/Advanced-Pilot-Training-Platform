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
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Calendar, 
  Loader2,
  Plane,
  FileText,
  Video,
  ExternalLink,
} from 'lucide-react';

export function TraineeDashboard() {
  const [activeTab] = useState('overview');

  // Fetch trainee profile data
  const { data: traineeProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['/api/trainee/profile'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/profile');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return {
          id: "ST0972",
          program: "ATPL",
          phase: "Advanced",
          overallProgress: 68,
          flightHours: 142.5,
          totalFlightHours: 215,
          theoryProgress: 12,
          totalTheoryExams: 14,
          daysRemaining: 72,
          isCriticalPath: true
        };
      }
    },
  });

  // Fetch upcoming schedule
  const { data: upcomingSchedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['/api/trainee/schedule'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/schedule');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: 1,
            activity: "B737 Simulator Session",
            date: new Date().toISOString(),
            time: "14:00-17:00",
            status: "today"
          },
          {
            id: 2,
            activity: "Emergency Procedures",
            date: new Date(Date.now() + 86400000).toISOString(),
            time: "09:00-12:00",
            status: "confirmed"
          },
          {
            id: 3,
            activity: "Flight Planning Seminar",
            date: new Date(Date.now() + 86400000 * 2).toISOString(),
            time: "13:00-15:00",
            status: "confirmed"
          },
          {
            id: 4,
            activity: "Cross-Country Flight",
            date: new Date(Date.now() + 86400000 * 3).toISOString(),
            time: "10:00-16:00",
            status: "pending"
          }
        ];
      }
    },
  });

  // Fetch recommended resources
  const { data: resources, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['/api/trainee/resources'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/resources');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: 1,
            title: "Emergency Procedures Handbook",
            description: "B737 Quick Reference",
            type: "pdf",
            icon: "P"
          },
          {
            id: 2,
            title: "Decision Making Under Pressure",
            description: "Training Video",
            type: "video",
            duration: 45
          }
        ];
      }
    },
  });

  // Fetch instructor feedback
  const { data: feedback, isLoading: isFeedbackLoading } = useQuery({
    queryKey: ['/api/trainee/feedback'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/feedback');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return {
          latestFeedback: "Michael demonstrates strong technical knowledge but needs to improve communication during complex procedures.",
          instructorName: "Sarah Phillips"
        };
      }
    }
  });

  // Fetch training goals
  const { data: goals, isLoading: isGoalsLoading } = useQuery({
    queryKey: ['/api/trainee/goals'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/goals');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          { id: 1, title: "Complete Emergency Procedures Training", progress: 75 },
          { id: 2, title: "Pass All Theory Exams", progress: 85 },
          { id: 3, title: "Complete Cross-Country Flight Requirements", progress: 60 }
        ];
      }
    }
  });

  // Fetch performance analytics
  const { data: performance, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['/api/trainee/performance'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/performance');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return {
          technicalKnowledge: 85,
          procedures: 75,
          flightSkills: 80,
          decisionMaking: 70,
          crm: 65
        };
      }
    }
  });

  // Loading states
  if (isProfileLoading || isScheduleLoading || isResourcesLoading || isFeedbackLoading || isGoalsLoading || isPerformanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Training Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Program: {traineeProfile?.program} • ID: {traineeProfile?.id} • Phase: {traineeProfile?.phase}
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <Badge variant="outline" className="mr-2">
              3 New notifications
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Overall Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold pb-2">{traineeProfile?.overallProgress}%</div>
              <Progress value={traineeProfile?.overallProgress} className="h-2" />
            </CardContent>
          </Card>

          {/* Flight Hours */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Flight Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{traineeProfile?.flightHours} <span className="text-sm font-normal text-muted-foreground">/ {traineeProfile?.totalFlightHours} hrs</span></div>
              <Progress 
                value={(traineeProfile?.flightHours / traineeProfile?.totalFlightHours) * 100} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>

          {/* Theory Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Theory Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{traineeProfile?.theoryProgress} <span className="text-sm font-normal text-muted-foreground">/ {traineeProfile?.totalTheoryExams} exams</span></div>
              <Progress 
                value={(traineeProfile?.theoryProgress / traineeProfile?.totalTheoryExams) * 100} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>

          {/* Days Remaining */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Days Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{traineeProfile?.daysRemaining}</div>
              <div className={`text-xs ${traineeProfile?.isCriticalPath ? 'text-destructive' : 'text-muted-foreground'} mt-1`}>
                {traineeProfile?.isCriticalPath ? 'Critical path' : 'On track'}
              </div>
              <Progress 
                value={(traineeProfile?.daysRemaining / 90) * 100} 
                className={`h-2 mt-2 ${traineeProfile?.isCriticalPath ? 'bg-destructive/20' : ''}`}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* My Upcoming Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>My Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSchedule?.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="mr-4 flex-shrink-0">
                      <div className="bg-primary/10 rounded-md p-2">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.activity}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}, {item.time}
                      </p>
                    </div>
                    <Badge 
                      className={
                        item.status === 'today' ? 'bg-blue-500' : 
                        item.status === 'confirmed' ? 'bg-green-500' : 
                        'bg-purple-500'
                      }
                    >
                      {item.status === 'today' ? 'Today' : 
                       item.status === 'confirmed' ? 'Confirmed' : 
                       'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-64">
                {/* This is a placeholder for a radar chart */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary/20"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Radar points */}
                  <div className="absolute" style={{ top: '30%', left: '30%' }}>
                    <div className="size-3 rounded-full bg-primary"></div>
                  </div>
                  <div className="absolute" style={{ top: '40%', left: '70%' }}>
                    <div className="size-3 rounded-full bg-primary"></div>
                  </div>
                  <div className="absolute" style={{ top: '60%', left: '60%' }}>
                    <div className="size-3 rounded-full bg-primary"></div>
                  </div>
                  <div className="absolute" style={{ top: '70%', left: '30%' }}>
                    <div className="size-3 rounded-full bg-primary"></div>
                  </div>
                  <div className="absolute" style={{ top: '50%', left: '20%' }}>
                    <div className="size-3 rounded-full bg-primary"></div>
                  </div>
                  
                  {/* Labels */}
                  <div className="absolute text-xs font-medium" style={{ top: '20%', left: '50%', transform: 'translateX(-50%)' }}>
                    Technical Knowledge
                  </div>
                  <div className="absolute text-xs font-medium" style={{ top: '50%', right: '10%' }}>
                    Procedures
                  </div>
                  <div className="absolute text-xs font-medium" style={{ bottom: '25%', right: '20%' }}>
                    Flight Skills
                  </div>
                  <div className="absolute text-xs font-medium" style={{ bottom: '20%', left: '50%', transform: 'translateX(-50%)' }}>
                    Decision Making
                  </div>
                  <div className="absolute text-xs font-medium" style={{ top: '50%', left: '10%' }}>
                    CRM
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources?.map((resource, index) => (
                  <div key={index} className="flex items-center">
                    <div className="mr-4 flex-shrink-0">
                      <div className={`size-10 rounded-md flex items-center justify-center ${
                        resource.type === 'pdf' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {resource.type === 'pdf' ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <Video className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{resource.title}</p>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </div>
                    <Button size="sm" variant="secondary">
                      {resource.type === 'pdf' ? 'Open' : 'Watch'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Instructor Feedback & Training Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Instructor Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <p className="italic text-muted-foreground">"{feedback?.latestFeedback}"</p>
                <p className="text-sm mt-2 text-right">- {feedback?.instructorName}</p>
              </div>

              <h3 className="font-semibold mb-4">My Training Goals</h3>
              <div className="space-y-4">
                {goals?.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{goal.title}</span>
                      <span className="text-sm font-medium">{goal.progress}%</span>
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