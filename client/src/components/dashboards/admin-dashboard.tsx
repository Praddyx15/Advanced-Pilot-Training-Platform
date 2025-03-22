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
  Loader2,
  Users,
  BarChart3,
  Calendar,
  ArrowUp,
  Plane,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminDashboard() {
  const [dateRange, setDateRange] = useState("January 1, 2025 - March 22, 2025");

  // Fetch training overview data
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['/api/admin/training-overview', dateRange],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/admin/training-overview?dateRange=${encodeURIComponent(dateRange)}`);
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return {
          activeStudents: {
            count: 128,
            change: 12,
            period: "%"
          },
          completionRate: {
            percentage: 86,
            change: 4,
            period: "%"
          },
          resourceUtilization: {
            percentage: 78,
            change: 7,
            period: "%"
          },
          complianceStatus: "Good"
        };
      }
    },
  });

  // Fetch training progress by program
  const { data: programsProgress, isLoading: isProgramsLoading } = useQuery({
    queryKey: ['/api/admin/programs-progress'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/programs-progress');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          { name: "PPL", progress: 42 },
          { name: "CPL", progress: 62 },
          { name: "IR", progress: 30 },
          { name: "ATPL", progress: 68 },
          { name: "Type", progress: 50 }
        ];
      }
    },
  });

  // Fetch instructor availability
  const { data: instructorAvailability, isLoading: isInstructorsLoading } = useQuery({
    queryKey: ['/api/admin/instructor-availability'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/instructor-availability');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          { day: "MON", slots: [
            { start: "08:00", end: "10:00" },
            { start: "13:00", end: "16:00" }
          ]},
          { day: "TUE", slots: [
            { start: "11:00", end: "13:00" }
          ]},
          { day: "WED", slots: [
            { start: "09:00", end: "12:00" },
            { start: "14:00", end: "16:00" }
          ]},
          { day: "THU", slots: [
            { start: "08:00", end: "14:00" }
          ]},
          { day: "FRI", slots: [
            { start: "13:00", end: "15:00" }
          ]},
          { day: "SAT", slots: [
            { start: "10:00", end: "12:00" }
          ]}
        ];
      }
    },
  });

  // Fetch upcoming training sessions
  const { data: upcomingSessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/admin/upcoming-sessions'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/upcoming-sessions');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: 1,
            title: "CPL Flight Training - Cross Country",
            student: "Emma Wilson",
            studentId: "ST1039",
            instructor: "Robert Chen",
            time: "Today, 14:00-16:30",
            aircraft: "C172 (N5078A)"
          },
          {
            id: 2,
            title: "ATPL Simulator - Emergency Procedures",
            student: "Michael Johnson",
            studentId: "ST0972",
            instructor: "Sarah Phillips",
            time: "Tomorrow, 09:00-12:00",
            simulator: "B737 SIM-1"
          }
        ];
      }
    },
  });

  // Fetch resource utilization data
  const { data: resourceUtilization, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['/api/admin/resource-utilization'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/resource-utilization');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          { type: "Aircraft", utilization: 80 },
          { type: "Simulators", utilization: 90 },
          { type: "Instructors", utilization: 75 },
          { type: "Classrooms", utilization: 65 },
          { type: "VR/AR Equipment", utilization: 70 }
        ];
      }
    },
  });

  // Loading state
  if (isOverviewLoading || isProgramsLoading || isInstructorsLoading || isSessionsLoading || isResourcesLoading) {
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
            <h1 className="text-2xl font-bold">Training Overview Dashboard</h1>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="January 1, 2025 - March 22, 2025">January 1, 2025 - March 22, 2025</SelectItem>
                <SelectItem value="October 1, 2024 - December 31, 2024">October 1, 2024 - December 31, 2024</SelectItem>
                <SelectItem value="July 1, 2024 - September 30, 2024">July 1, 2024 - September 30, 2024</SelectItem>
                <SelectItem value="April 1, 2024 - June 30, 2024">April 1, 2024 - June 30, 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Active Students */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{overviewData?.activeStudents.count}</div>
                <Badge className="bg-green-500">
                  <ArrowUp className="h-3 w-3 mr-1"/>
                  {overviewData?.activeStudents.change}%
                </Badge>
              </div>
              <Progress 
                value={75} 
                className="h-1.5 mt-2" 
              />
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{overviewData?.completionRate.percentage}%</div>
                <Badge className="bg-green-500">
                  <ArrowUp className="h-3 w-3 mr-1"/>
                  {overviewData?.completionRate.change}%
                </Badge>
              </div>
              <Progress 
                value={overviewData?.completionRate.percentage} 
                className="h-1.5 mt-2" 
              />
            </CardContent>
          </Card>

          {/* Resource Utilization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{overviewData?.resourceUtilization.percentage}%</div>
                <Badge className="bg-green-500">
                  <ArrowUp className="h-3 w-3 mr-1"/>
                  {overviewData?.resourceUtilization.change}%
                </Badge>
              </div>
              <Progress 
                value={overviewData?.resourceUtilization.percentage} 
                className="h-1.5 mt-2" 
              />
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{overviewData?.complianceStatus}</div>
              <Progress 
                value={85} 
                className="h-1.5 mt-2 bg-green-100" 
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Training Progress by Program */}
          <Card>
            <CardHeader>
              <CardTitle>Training Progress by Program</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end space-x-6">
                {programsProgress?.map((program, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-blue-500 rounded-t-sm mt-auto"
                      style={{ height: `${program.progress * 0.6}%` }}
                    ></div>
                    <span className="text-xs font-medium mt-2">{program.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructor Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Instructor Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {instructorAvailability?.map((day, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="text-xs font-medium text-center mb-1">{day.day}</div>
                    <div className="relative h-32 bg-gray-100 rounded">
                      {day.slots.map((slot, slotIndex) => {
                        const startHour = parseInt(slot.start.split(':')[0]);
                        const endHour = parseInt(slot.end.split(':')[0]);
                        const startPosition = ((startHour - 8) / 12) * 100;
                        const duration = (endHour - startHour) / 12 * 100;
                        
                        return (
                          <div 
                            key={slotIndex}
                            className="absolute left-0 right-0 bg-blue-300"
                            style={{
                              top: `${startPosition}%`,
                              height: `${duration}%`
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Training Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Training Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions?.map((session, index) => (
                  <div key={index} className="flex gap-3 border-b pb-4">
                    <div className="size-10 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                      {session.aircraft ? (
                        <Plane className="h-5 w-5 text-blue-600" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.student} (ID: {session.studentId})
                      </p>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          Instructor: {session.instructor}
                        </p>
                        <p className="text-xs">
                          {session.time}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.aircraft || session.simulator}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resourceUtilization?.map((resource, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{resource.type}</span>
                      <span className="text-sm">{resource.utilization}%</span>
                    </div>
                    <Progress value={resource.utilization} className="h-2" />
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