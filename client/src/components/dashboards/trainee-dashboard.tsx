import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { ComingSoon } from '@/components/shared/coming-soon';
import { CPLTraineeDashboard } from './cpl-trainee-dashboard';
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
  // Fetch trainee profile and progress data
  const { data: traineeData, isLoading: isTraineeLoading } = useQuery({
    queryKey: ['/api/trainee/profile'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/profile');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return {
          firstName: "Emma",
          lastName: "Wilson",
          id: "ST1039",
          program: "Commercial Pilot License (CPL)",
          programCompletion: 68,
          totalFlightHours: 153.5,
          soloHours: 32.8,
          instructorHours: 120.7,
          nextMilestone: "Long Cross-Country Flight",
          licenseProgress: {
            groundTheory: 85,
            flightTraining: 62,
            skillTest: 0
          }
        };
      }
    },
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/trainee/upcoming-sessions'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/upcoming-sessions');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);
        
        return [
          {
            id: 1,
            title: "Cross-Country Flight",
            type: "Flight",
            date: today.toISOString(),
            time: "14:00-16:30",
            instructor: "Robert Chen",
            aircraft: "C172 (G-ABCD)",
            status: "confirmed"
          },
          {
            id: 2,
            title: "Navigation Theory Review",
            type: "Ground",
            date: tomorrow.toISOString(),
            time: "10:00-12:00",
            instructor: "Sarah Phillips",
            location: "Classroom 3B",
            status: "confirmed"
          },
          {
            id: 3,
            title: "Instrument Approaches",
            type: "Simulator",
            date: dayAfter.toISOString(),
            time: "13:00-15:00",
            instructor: "Michael Johnson",
            location: "FNTP II Sim",
            status: "tentative"
          }
        ];
      }
    },
  });

  // Fetch learning resources
  const { data: learningResources, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['/api/trainee/learning-resources'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/learning-resources');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: 1,
            title: "Navigation VOR & ILS",
            type: "E-Learning Module",
            progress: 80,
            dueDate: "Mar 26, 2025",
            priority: "high",
            requiredFor: "Radio Navigation"
          },
          {
            id: 2,
            title: "Radio Communications",
            type: "Video Course",
            progress: 100,
            completedOn: "Mar 15, 2025",
            priority: "completed"
          },
          {
            id: 3,
            title: "Complex Flight Planning",
            type: "Interactive Exercise",
            progress: 0,
            dueDate: "Apr 2, 2025",
            priority: "medium",
            requiredFor: "Long Cross-Country"
          }
        ];
      }
    },
  });

  // Fetch performance goals
  const { data: performanceGoals, isLoading: isGoalsLoading } = useQuery({
    queryKey: ['/api/trainee/performance-goals'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/performance-goals');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: 1,
            title: "Precision Landing Accuracy",
            current: 75,
            target: 90,
            deadline: "Apr 30, 2025"
          },
          {
            id: 2,
            title: "Navigation Accuracy",
            current: 85,
            target: 90,
            deadline: "Apr 15, 2025"
          },
          {
            id: 3,
            title: "Instrument Approach Procedures",
            current: 60,
            target: 85,
            deadline: "May 10, 2025"
          }
        ];
      }
    },
  });

  // Fetch recent achievements
  const { data: recentAchievements, isLoading: isAchievementsLoading } = useQuery({
    queryKey: ['/api/trainee/achievements'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/trainee/achievements');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: 1,
            title: "Solo Cross-Country Master",
            date: "Mar 12, 2025",
            description: "Completed a 150nm solo cross-country flight with 3 landings at different airports.",
            badge: "gold"
          },
          {
            id: 2,
            title: "Perfect Navigation Quiz",
            date: "Mar 05, 2025",
            description: "Scored 100% on the advanced navigation systems quiz.",
            badge: "silver"
          },
          {
            id: 3,
            title: "Radio Communications Expert",
            date: "Feb 25, 2025",
            description: "Demonstrated excellent radio communication skills during busy airspace operations.",
            badge: "bronze"
          }
        ];
      }
    },
  });

  // Loading state
  if (isTraineeLoading || isSessionsLoading || isResourcesLoading || isGoalsLoading || isAchievementsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if today
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Welcome and summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {traineeData?.firstName}</h1>
            <p className="text-sm text-muted-foreground">
              Student ID: {traineeData?.id} • Program: {traineeData?.program}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">
                Program Progress: {traineeData?.programCompletion}%
              </span>
            </div>
            <Progress 
              value={traineeData?.programCompletion} 
              className="h-2 w-40 mt-1" 
            />
          </div>
        </div>

        {/* Training summary cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Total Flight Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{traineeData?.totalFlightHours}</div>
              <div className="flex flex-col mt-2">
                <div className="flex justify-between text-xs">
                  <span>Solo: {traineeData?.soloHours}h</span>
                  <span>Dual: {traineeData?.instructorHours}h</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full" 
                    style={{ width: `${(traineeData?.soloHours / traineeData?.totalFlightHours) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Ground Theory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{traineeData?.licenseProgress.groundTheory}%</div>
              <div className="text-sm text-purple-100 mt-1">
                Complete
              </div>
              <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: `${traineeData?.licenseProgress.groundTheory}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Flight Training</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{traineeData?.licenseProgress.flightTraining}%</div>
              <div className="text-sm text-purple-100 mt-1">
                Complete
              </div>
              <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: `${traineeData?.licenseProgress.flightTraining}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Next Milestone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-medium">{traineeData?.nextMilestone}</div>
              <div className="mt-2 flex items-center text-xs text-purple-100">
                <Trophy className="h-3 w-3 mr-1" />
                <span>Key program requirement</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analytics Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Performance Analytics
            </CardTitle>
            <CardDescription>
              Your current performance across key competency areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="80%" data={[
                  { subject: 'Navigation', score: 78, fullMark: 100 },
                  { subject: 'Communication', score: 82, fullMark: 100 },
                  { subject: 'Aircraft Control', score: 85, fullMark: 100 },
                  { subject: 'Emergency Procedures', score: 70, fullMark: 100 },
                  { subject: 'Decision Making', score: 76, fullMark: 100 },
                  { subject: 'Technical Knowledge', score: 88, fullMark: 100 },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Tooltip />
                  <Radar 
                    name="Performance" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4 px-6">
            <div className="text-sm text-muted-foreground">
              Last assessment: March 15, 2025
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/my-performance">
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming sessions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <CalendarClock className="h-5 w-5 mr-2 text-purple-600" />
                Upcoming Training Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions?.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start pb-4 border-b last:border-0 last:pb-0">
                    <div className={`
                      size-10 flex-shrink-0 rounded-md flex items-center justify-center
                      ${item.type === 'Flight' ? 'bg-blue-100 text-blue-600' : 
                        item.type === 'Simulator' ? 'bg-purple-100 text-purple-600' : 
                        'bg-green-100 text-green-600'}
                    `}>
                      {item.type === 'Flight' ? (
                        <Plane className="h-5 w-5" />
                      ) : item.type === 'Simulator' ? (
                        <BookMarked className="h-5 w-5" />
                      ) : (
                        <BookOpen className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge 
                          variant={item.status === 'confirmed' ? 'default' : 'outline'}
                          className={item.status === 'tentative' ? 'border-amber-500 text-amber-500' : ''}
                        >
                          {item.status === 'tentative' ? 'Tentative' : 'Confirmed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isToday(item.date) ? 'Today' : formatDate(item.date)}, {item.time}
                      </p>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Instructor: {item.instructor}</span>
                        <span>{item.aircraft || item.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 px-6">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/my-schedule">
                  View Full Schedule
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Learning resources */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                Learning Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningResources?.map((resource, index) => (
                  <div key={index} className="pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{resource.title}</h3>
                      {resource.priority === 'high' ? (
                        <Badge className="bg-red-500">{resource.priority}</Badge>
                      ) : resource.priority === 'medium' ? (
                        <Badge className="bg-amber-500">{resource.priority}</Badge>
                      ) : resource.priority === 'completed' ? (
                        <Badge className="bg-green-500">Completed</Badge>
                      ) : (
                        <Badge>{resource.priority}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{resource.type}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>
                          {resource.progress}%
                          {resource.priority === 'completed' ? (
                            <CheckCircle2 className="h-3 w-3 ml-1 inline text-green-500" />
                          ) : resource.dueDate ? (
                            <span className="text-muted-foreground"> • Due {resource.dueDate}</span>
                          ) : null}
                        </span>
                      </div>
                      <Progress 
                        value={resource.progress} 
                        className="h-2" 
                      />
                    </div>
                    {resource.requiredFor && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                          Required for: {resource.requiredFor}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 px-6">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/elearning">
                  Go to E-Learning Platform
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Performance Goals */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-purple-600" />
                Performance Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceGoals?.map((goal, index) => (
                  <div key={index} className="pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{goal.title}</h3>
                      <span className="text-sm font-medium">
                        {goal.current}
                        <span className="text-muted-foreground">/{goal.target}</span>
                      </span>
                    </div>
                    <Progress 
                      value={(goal.current / goal.target) * 100} 
                      className="h-2 mt-2" 
                    />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Target date: {goal.deadline}
                      </span>
                      <span className="flex items-center">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {goal.target - goal.current} points to target
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 px-6">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/progress">
                  View All Performance Metrics
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Recent achievements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-purple-600" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAchievements?.map((achievement) => (
                  <div key={achievement.id} className="flex gap-4 items-start pb-4 border-b last:border-0 last:pb-0">
                    <div 
                      className={`
                        size-10 flex-shrink-0 rounded-full flex items-center justify-center
                        ${achievement.badge === 'gold' ? 'bg-amber-100' : 
                          achievement.badge === 'silver' ? 'bg-gray-100' : 
                          'bg-amber-50'}
                      `}
                    >
                      <Trophy 
                        className={`h-5 w-5 
                          ${achievement.badge === 'gold' ? 'text-amber-600' : 
                            achievement.badge === 'silver' ? 'text-gray-500' : 
                            'text-amber-700'}`
                        } 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Awarded: {achievement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 px-6">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/achievements">
                  View Achievement History
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}