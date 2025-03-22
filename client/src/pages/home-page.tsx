import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Layers, 
  Calendar, 
  ClipboardCheck, 
  Clock, 
  ChevronRight, 
  BarChart2, 
  CheckCircle2, 
  Medal, 
  FileText,
  PlusCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import { AppLayout } from '@/components/layouts/app-layout';

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch upcoming sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/sessions/upcoming'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sessions/upcoming');
      return await response.json();
    },
  });

  // Fetch recent assessments
  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['/api/assessments/recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/assessments/recent');
      return await response.json();
    },
  });

  // Fetch training programs
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/programs');
      return await response.json();
    },
  });

  // Fetch user achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/achievements/user');
      return await response.json();
    },
  });

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';
  const isTrainee = user?.role === 'trainee';
  const isAdmin = user?.role === 'admin';

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back, {user?.firstName || 'User'}</h1>
            <p className="text-muted-foreground">
              Your aviation training dashboard - view your progress and upcoming sessions.
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button asChild>
              <Link to="/programs">
                <Layers className="mr-2 h-4 w-4" />
                Training Programs
              </Link>
            </Button>
            {isInstructor && (
              <Button variant="outline" asChild>
                <Link to="/sessions/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Session
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Programs Enrolled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{isTrainee ? (programs?.length || 0) : '—'}</div>
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTrainee ? 'Active training programs' : 'Training programs available'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{sessions?.length || 0}</div>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Next 7 days
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Recent Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{assessments?.length || 0}</div>
                    <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{achievements?.length || 0}</div>
                    <Medal className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total badges earned
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>
                    Your scheduled training sessions for the next 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : sessions?.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex items-center border-b pb-3">
                          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{session.title}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              <span>{new Date(session.startTime).toLocaleString()}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/sessions/${session.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                      {sessions.length > 3 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/sessions">
                            View all sessions
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="font-medium mb-1">No upcoming sessions</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {isInstructor 
                          ? 'You have no upcoming training sessions scheduled.' 
                          : 'There are no upcoming sessions scheduled for you.'}
                      </p>
                      {isInstructor && (
                        <Button className="mt-4" size="sm" asChild>
                          <Link to="/sessions/create">
                            Schedule a Session
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Assessments</CardTitle>
                  <CardDescription>
                    {isInstructor 
                      ? 'Recently conducted trainee assessments' 
                      : 'Your recently completed assessments'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assessmentsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : assessments?.length > 0 ? (
                    <div className="space-y-4">
                      {assessments.slice(0, 3).map((assessment) => (
                        <div key={assessment.id} className="flex items-center border-b pb-3">
                          <div className={`size-10 rounded-full flex items-center justify-center mr-3 ${
                            assessment.score >= 80 ? 'bg-green-100 text-green-700' :
                            assessment.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            <div className="font-semibold text-sm">{assessment.score}%</div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{assessment.title}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              <span>{new Date(assessment.completedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/assessments/${assessment.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                      {assessments.length > 3 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/assessments">
                            View all assessments
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <ClipboardCheck className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="font-medium mb-1">No recent assessments</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {isInstructor 
                          ? 'You have not conducted any assessments recently.' 
                          : 'You have not completed any assessments recently.'}
                      </p>
                      {isInstructor && (
                        <Button className="mt-4" size="sm" asChild>
                          <Link to="/assessments/create">
                            Create Assessment
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>
                    Key metrics for the training platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Programs</p>
                      <p className="text-2xl font-bold">{programsLoading ? '—' : programs?.length || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                      <p className="text-2xl font-bold">{sessions?.filter(s => s.status === 'active').length || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Recent Documents</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {isTrainee && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Program Progress</CardTitle>
                    <CardDescription>
                      Your current progress in enrolled training programs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {programsLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : programs?.length > 0 ? (
                      <div className="space-y-6">
                        {programs.slice(0, 5).map((program) => (
                          <div key={program.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="font-medium">{program.title}</p>
                              <p className="text-sm">{program.progress || 0}%</p>
                            </div>
                            <Progress value={program.progress || 0} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <p>Enrolled: {new Date(program.enrolledAt).toLocaleDateString()}</p>
                              <p>{program.completedModules || 0}/{program.totalModules || 0} modules</p>
                            </div>
                          </div>
                        ))}
                        {programs.length > 5 && (
                          <Button variant="outline" className="w-full" asChild>
                            <Link to="/programs">
                              View all programs
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="font-medium mb-1">No enrolled programs</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          You are not currently enrolled in any training programs.
                        </p>
                        <Button className="mt-4" size="sm" asChild>
                          <Link to="/programs">
                            Browse Programs
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skill Progress</CardTitle>
                    <CardDescription>
                      Your proficiency levels across key competencies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {/* Sample skill data - this would be dynamic in real app */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Flight Planning</p>
                          <div className="flex items-center">
                            <p className="text-sm font-medium">Advanced</p>
                            <CheckCircle2 className="h-4 w-4 text-green-500 ml-1.5" />
                          </div>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Navigation</p>
                          <div className="flex items-center">
                            <p className="text-sm font-medium">Intermediate</p>
                            <CheckCircle2 className="h-4 w-4 text-yellow-500 ml-1.5" />
                          </div>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Emergency Procedures</p>
                          <div className="flex items-center">
                            <p className="text-sm font-medium">Advanced</p>
                            <CheckCircle2 className="h-4 w-4 text-green-500 ml-1.5" />
                          </div>
                        </div>
                        <Progress value={90} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Communication</p>
                          <div className="flex items-center">
                            <p className="text-sm font-medium">Proficient</p>
                            <CheckCircle2 className="h-4 w-4 text-blue-500 ml-1.5" />
                          </div>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Aircraft Systems</p>
                          <div className="flex items-center">
                            <p className="text-sm font-medium">Intermediate</p>
                            <CheckCircle2 className="h-4 w-4 text-yellow-500 ml-1.5" />
                          </div>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-6" asChild>
                      <Link to="/profile/skills">
                        View Detailed Skills
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {isInstructor && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Instructor Activity</CardTitle>
                    <CardDescription>
                      Your recent teaching and assessment activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Sessions Conducted</p>
                        <p className="text-lg font-semibold">24</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Assessments Completed</p>
                        <p className="text-lg font-semibold">36</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Active Trainees</p>
                        <p className="text-lg font-semibold">18</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Programs Managed</p>
                        <p className="text-lg font-semibold">5</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm font-medium mb-3">Teaching Hours (Last 30 days)</p>
                      <div className="h-24 bg-muted rounded-md p-2 flex items-end justify-between">
                        {/* Placeholder bar chart */}
                        <div className="w-1/7 h-[30%] bg-primary rounded-t"></div>
                        <div className="w-1/7 h-[60%] bg-primary rounded-t"></div>
                        <div className="w-1/7 h-[80%] bg-primary rounded-t"></div>
                        <div className="w-1/7 h-[40%] bg-primary rounded-t"></div>
                        <div className="w-1/7 h-[70%] bg-primary rounded-t"></div>
                        <div className="w-1/7 h-[50%] bg-primary rounded-t"></div>
                        <div className="w-1/7 h-[90%] bg-primary rounded-t"></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trainee Performance</CardTitle>
                    <CardDescription>
                      Performance overview of your trainees
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Average Assessment Score</p>
                        <div className="flex items-center text-lg font-semibold">
                          78%
                          <BarChart2 className="h-4 w-4 text-muted-foreground ml-1.5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Completion Rate</p>
                        <div className="flex items-center text-lg font-semibold">
                          84%
                          <BarChart2 className="h-4 w-4 text-muted-foreground ml-1.5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Attendance Rate</p>
                        <div className="flex items-center text-lg font-semibold">
                          92%
                          <BarChart2 className="h-4 w-4 text-muted-foreground ml-1.5" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="font-medium mb-3">Trainees Requiring Attention</p>
                      <div className="space-y-3">
                        <div className="flex items-center p-2 rounded-md border bg-amber-50">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                          <div>
                            <p className="font-medium text-sm">John Smith</p>
                            <p className="text-xs text-muted-foreground">Below target in Navigation module</p>
                          </div>
                          <Button variant="ghost" size="icon" className="ml-auto">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center p-2 rounded-md border bg-amber-50">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                          <div>
                            <p className="font-medium text-sm">Sarah Johnson</p>
                            <p className="text-xs text-muted-foreground">Missed two consecutive sessions</p>
                          </div>
                          <Button variant="ghost" size="icon" className="ml-auto">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Achievements</CardTitle>
                  <CardDescription>
                    Badges and awards you've earned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {achievementsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : achievements?.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {achievements.slice(0, 6).map((achievement) => (
                        <div key={achievement.id} className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <Medal className="h-8 w-8 text-primary" />
                          </div>
                          <p className="font-medium text-sm">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">{achievement.awardedAt}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Medal className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="font-medium mb-1">No achievements yet</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Complete training programs and assessments to earn achievements and badges.
                      </p>
                      <Button className="mt-4" size="sm" asChild>
                        <Link to="/achievements">
                          View Available Achievements
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Documents</CardTitle>
                  <CardDescription>
                    Training documents and resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sample document data - this would be dynamic in real app */}
                    <div className="flex items-center border-b pb-3">
                      <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">Aircraft Systems Manual</p>
                        <p className="text-xs text-muted-foreground">PDF • Updated 3 days ago</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center border-b pb-3">
                      <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">Emergency Procedures Guide</p>
                        <p className="text-xs text-muted-foreground">PDF • Updated 1 week ago</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center">
                      <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">Navigation Fundamentals</p>
                        <p className="text-xs text-muted-foreground">PDF • Updated 2 weeks ago</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full mt-2" asChild>
                      <Link to="/documents">
                        View All Documents
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}