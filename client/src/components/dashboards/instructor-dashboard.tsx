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
  CalendarDays, 
  Loader2,
  Users,
  CheckCircle,
  Clock,
  User,
  Play,
  ChevronRight,
  PieChart,
  BarChart,
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

export function InstructorDashboard() {
  const { data: instructorProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['/api/instructor/profile'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/instructor/profile');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return {
          id: 1,
          name: "Sarah Phillips",
          qualification: "A320 Type Rating Instructor",
          assignment: "Bay Assignment: 1 & 2",
          todaySessions: 2,
          activeTrainees: 8,
          pendingGradesheets: 3,
          teachingHours: 68,
          totalMonthlyHours: 80
        };
      }
    },
  });

  // Fetch today's FFS sessions
  const { data: todaysSessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/instructor/today-sessions'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/instructor/today-sessions');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: 1,
            name: "A320 FFS - Normal Procedures",
            trainee: "James Davis",
            trainingRecord: "TR-2025-03",
            bay: "Bay 2",
            duration: "4 hours",
            phase: "Phase 2",
            time: "14:00-18:00",
            status: "upcoming"
          },
          {
            id: 2,
            name: "A320 FFS - LOFT Scenario 3",
            trainee: "Emily Wilson",
            trainingRecord: "TR-2025-01",
            bay: "Bay 1",
            duration: "4 hours",
            phase: "Phase 3",
            time: "19:00-23:00",
            status: "upcoming"
          }
        ];
      }
    },
  });

  // Fetch pending gradesheets
  const { data: pendingGradesheets, isLoading: isGradesheetsLoading } = useQuery({
    queryKey: ['/api/instructor/pending-gradesheets'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/instructor/pending-gradesheets');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          {
            id: 1,
            trainee: "Michael Johnson",
            session: "A320 FFS Phase 2",
            date: "Mar 21, 2025"
          },
          {
            id: 2,
            trainee: "David Lee",
            session: "A320 FFS Phase 3",
            date: "Mar 21, 2025"
          }
        ];
      }
    },
  });

  // Fetch trainee performance overview
  const { data: traineesPerformance, isLoading: isTraineesLoading } = useQuery({
    queryKey: ['/api/instructor/trainees-performance'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/instructor/trainees-performance');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          { id: 1, name: "James Davis", program: "A320 TR", progress: 54, status: "On Track" },
          { id: 2, name: "Emily Wilson", program: "A320 TR", progress: 82, status: "On Track" },
          { id: 3, name: "Michael Johnson", program: "A320 TR", progress: 90, status: "Attention" },
          { id: 4, name: "David Lee", program: "A320 TR", progress: 75, status: "On Track" },
          { id: 5, name: "Sandra Martinez", program: "A320 TR", progress: 70, status: "On Track" }
        ];
      }
    },
  });

  // Fetch weekly schedule
  const { data: weeklySchedule, isLoading: isWeeklyScheduleLoading } = useQuery({
    queryKey: ['/api/instructor/weekly-schedule'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/instructor/weekly-schedule');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        const currentDate = new Date();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Get Monday

        const weekDays = Array.from({ length: 7 }, (_, i) => {
          const day = new Date(startOfWeek);
          day.setDate(startOfWeek.getDate() + i);
          return {
            date: day.toISOString(),
            dayNumber: day.getDate(),
            slots: []
          };
        });

        // Add some schedule slots
        weekDays[0].slots.push({ id: 1, type: "AM", time: "08:00-12:00" });
        weekDays[1].slots.push({ id: 2, type: "PM", time: "13:00-17:00" });
        weekDays[3].slots.push({ id: 3, type: "AM", time: "09:00-13:00" });
        weekDays[4].slots.push({ id: 4, type: "PM", time: "14:00-18:00" });
        weekDays[4].slots.push({ id: 5, type: "PM", time: "19:00-23:00" });
        weekDays[6].slots.push({ id: 6, type: "OFF", time: "Day Off" });

        return weekDays;
      }
    },
  });

  // Fetch assessment ratings data
  const { data: assessmentRatings, isLoading: isAssessmentRatingsLoading } = useQuery({
    queryKey: ['/api/instructor/assessment-ratings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/instructor/assessment-ratings');
        return await response.json();
      } catch (error) {
        // Return mock data for development
        return [
          { name: "Excellent", count: 15, color: "#10b981" },
          { name: "Satisfactory", count: 42, color: "#3b82f6" },
          { name: "Unsatisfactory", count: 8, color: "#f97316" },
          { name: "Needs Improvement", count: 12, color: "#f59e0b" },
        ];
      }
    },
  });

  // Loading states
  if (isProfileLoading || isSessionsLoading || isGradesheetsLoading || isTraineesLoading || isWeeklyScheduleLoading || isAssessmentRatingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {instructorProfile?.qualification} • {instructorProfile?.assignment}
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Schedule */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{instructorProfile?.todaySessions}</div>
                <div className="w-10 h-5 rounded bg-teal-100 text-teal-800 text-xs font-medium flex items-center justify-center">
                  On Duty
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">sessions</p>
              <Progress 
                value={100} 
                className="h-1.5 mt-2 bg-teal-100" 
              />
            </CardContent>
          </Card>

          {/* Active Trainees */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Trainees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{instructorProfile?.activeTrainees}</div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">trainees</p>
              <Progress 
                value={75} 
                className="h-1.5 mt-2" 
              />
            </CardContent>
          </Card>

          {/* Pending Gradesheets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Gradesheets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{instructorProfile?.pendingGradesheets}</div>
                <div className="w-14 h-5 rounded bg-amber-100 text-amber-800 text-xs font-medium flex items-center justify-center">
                  Due within 24h
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">to complete</p>
              <Progress 
                value={40} 
                className="h-1.5 mt-2 bg-amber-100" 
              />
            </CardContent>
          </Card>

          {/* Teaching Hours */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Teaching Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{instructorProfile?.teachingHours}</div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">/ {instructorProfile?.totalMonthlyHours} hrs</p>
              <Progress 
                value={(instructorProfile?.teachingHours / instructorProfile?.totalMonthlyHours) * 100} 
                className="h-1.5 mt-2" 
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's FFS Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Today's FFS Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysSessions?.map((session, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-teal-500 before:rounded-l-lg">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">{session.name}</h3>
                      <Badge variant="secondary" className="text-xs">{session.time}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Trainee: {session.trainee} • {session.trainingRecord}
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {session.bay} • {session.duration} • {session.phase}
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-teal-500 hover:bg-teal-600"
                    >
                      {session.time.split('-')[0] < new Date().toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }) ? 'Start Session' : 'Upcoming'}
                      <Play className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trainee Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Trainee Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Program</th>
                      <th className="pb-2 font-medium">Progress</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traineesPerformance?.map((trainee, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 text-sm font-medium">{trainee.name}</td>
                        <td className="py-3 text-sm">{trainee.program}</td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <Progress 
                              value={trainee.progress} 
                              className="h-1.5 w-16 mr-2" 
                            />
                            <span className="text-xs">{trainee.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge 
                            variant={trainee.status === 'Attention' ? 'destructive' : 'default'}
                            className={`${trainee.status === 'On Track' ? 'bg-teal-500 hover:bg-teal-600' : ''}`}
                          >
                            {trainee.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Assessment Ratings */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Ratings Distribution</CardTitle>
              <CardDescription>Overview of all trainee assessment ratings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={assessmentRatings}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {assessmentRatings?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} assessments`, name]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" className="w-full md:w-auto">
                View Detailed Assessment Report
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {/* Pending Gradesheets */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Gradesheets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingGradesheets?.map((gradesheet, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-amber-500 before:rounded-l-lg">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">{gradesheet.trainee} - {gradesheet.session}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      Session Date: {gradesheet.date}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full justify-center"
                    >
                      Complete
                      <CheckCircle className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                <div className="text-xs font-medium">Mon</div>
                <div className="text-xs font-medium">Tue</div>
                <div className="text-xs font-medium">Wed</div>
                <div className="text-xs font-medium">Thu</div>
                <div className="text-xs font-medium">Fri</div>
                <div className="text-xs font-medium">Sat</div>
                <div className="text-xs font-medium">Sun</div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {weeklySchedule?.map((day, index) => (
                  <div key={index} className="text-xs">
                    {day.dayNumber}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weeklySchedule?.map((day, index) => (
                  <div key={index} className="min-h-14 text-xs">
                    {day.slots.map((slot, slotIndex) => (
                      <div 
                        key={slotIndex} 
                        className={`mb-1 p-1 rounded text-center ${
                          slot.type === 'AM' ? 'bg-blue-100 text-blue-700' : 
                          slot.type === 'PM' ? 'bg-teal-100 text-teal-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {slot.type}
                      </div>
                    ))}
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