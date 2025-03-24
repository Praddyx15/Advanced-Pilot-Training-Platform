import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NotificationBell } from '@/components/notification/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart,
  BarChart2,
  BarChart3,
  Book,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clipboard,
  Clock,
  Code,
  Cog,
  File,
  FileCheck,

  FileCode,
  FileSearch,
  FileText,
  Gauge,
  GraduationCap,
  Home,
  Layers,
  LineChart,
  LogOut,
  Menu,
  MessageSquare,
  PanelTop,
  Plane,
  Search,
  Settings,
  Shield,
  Star,
  Trophy,
  User,
  UserCog,
  Users,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user role and organization type
  const userRole = user?.role || 'trainee';
  const userOrgType = user?.organizationType || 'personal';
  
  // Define theme colors based on user role & organization
  const getThemeColors = () => {
    if (userRole === 'admin') {
      return {
        primary: '#0e7490', // Teal 600 (swapped from ATO)
        secondary: '#0891b2', // Teal 500
        sidebar: 'from-slate-800 to-slate-900',
        header: 'bg-slate-800',
        text: 'text-white',
        logo: 'Admin Portal'
      };
    } else if (userRole === 'instructor' && userOrgType === 'ATO') {
      return {
        primary: '#0f766e', // Teal 700 (swapped from Admin)
        secondary: '#14b8a6', // Teal 400
        sidebar: 'from-teal-800 to-teal-900',
        header: 'bg-teal-800',
        text: 'text-white',
        logo: 'ATO Instructor Portal'
      };
    } else if (userRole === 'trainee' && userOrgType === 'ATO') {
      return {
        primary: '#6d28d9', // Purple 700
        secondary: '#8b5cf6', // Purple 500  
        sidebar: 'from-purple-800 to-purple-900',
        header: 'bg-purple-800',
        text: 'text-white',
        logo: 'ATO Student Portal'
      };
    } else if (userRole === 'trainee' && userOrgType === 'Airline') {
      return {
        primary: '#6d28d9', // Purple 700
        secondary: '#8b5cf6', // Purple 500  
        sidebar: 'from-purple-800 to-purple-900',
        header: 'bg-purple-800',
        text: 'text-white',
        logo: 'Airline Student Portal'
      };
    } else if (userRole === 'examiner') {
      return {
        primary: '#7e22ce', // Purple 800
        secondary: '#a855f7', // Purple 500
        sidebar: 'from-purple-800 to-purple-900',
        header: 'bg-purple-800',
        text: 'text-white',
        logo: 'ATO Examiner Portal'
      };
    } else if (userRole === 'instructor' && userOrgType === 'Airline') {
      return {
        primary: '#2563eb', // Blue 600
        secondary: '#3b82f6', // Blue 500
        sidebar: 'from-blue-800 to-blue-900',
        header: 'bg-blue-800',
        text: 'text-white',
        logo: 'Airline Instructor Portal'
      };
    } else {
      return {
        primary: '#2563eb', // Blue 600
        secondary: '#3b82f6', // Blue 500
        sidebar: 'from-blue-800 to-blue-900',
        header: 'bg-blue-800',
        text: 'text-white',
        logo: 'Training Management'
      };
    }
  };

  const theme = getThemeColors();

  // Define navigation based on user role
  const getNavigation = () => {
    // Common menus available to all users
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Document Repository', href: '/documents', icon: FileText },
      { name: 'Document Processor', href: '/document-processor', icon: FileSearch },
      { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
    ];

    if (userRole === 'admin') {
      return [
        ...baseNavigation,
        // Core Admin Features
        { name: 'User Management', href: '/users', icon: Users },
        { name: 'Planning & Scheduling', href: '/planning', icon: Calendar },
        
        // Organization Management
        { name: 'Student Management', href: '/students', icon: UserCog },
        { name: 'Instructor Portal', href: '/instructors', icon: Briefcase },
        
        // Document & Knowledge Management
        { name: 'Document Management', href: '/document-management', icon: File },
        { name: 'Syllabus Generator', href: '/syllabus-generator', icon: Book },
        
        // Compliance & Analytics
        { name: 'Compliance', href: '/compliance', icon: FileCheck },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Audit Logs', href: '/audit-logs', icon: Shield },
        
        // Platform Management
        { name: 'API Management', href: '/api-docs', icon: Code },
        { name: 'System Config', href: '/configuration', icon: Settings },
        
        // Resources & E-Learning
        { name: 'Resources', href: '/resources', icon: Plane },
        { name: 'E-Learning', href: '/elearning', icon: GraduationCap },
        { name: 'VR/AR Training', href: '/vr-training', icon: Activity },
      ];
    } else if (userRole === 'instructor') {
      return [
        ...baseNavigation,
        // Schedule & Sessions
        { name: 'My Schedule', href: '/my-schedule', icon: Calendar },
        { name: 'Session Management', href: '/sessions', icon: Clock },
        { name: 'FFS Sessions', href: '/ffs-sessions', icon: Plane },
        
        // Trainee Management
        { name: 'My Trainees', href: '/my-trainees', icon: Users },
        { name: 'Progress Tracking', href: '/trainee-progress', icon: LineChart },
        
        // Assessment Tools
        { name: 'Assessments', href: '/assessments', icon: CheckSquare },
        { name: 'Gradesheets', href: '/gradesheets', icon: FileCheck },
        
        // Learning Materials
        { name: 'Training Materials', href: '/materials', icon: FileText },
        { name: 'Syllabus Manager', href: '/syllabus', icon: BookOpen },
        
        // Analytics & Reporting
        { name: 'Performance Metrics', href: '/metrics', icon: BarChart2 },
        { name: 'Reporting', href: '/reporting', icon: BarChart3 },
        
        // Communication
        { name: 'Messaging', href: '/messaging', icon: MessageSquare },
      ];
    } else if (userRole === 'examiner') {
      return [
        ...baseNavigation,
        // Examination Management
        { name: 'Examination Schedule', href: '/exam-schedule', icon: Calendar },
        { name: 'Skill Tests', href: '/skill-tests', icon: CheckSquare },
        { name: 'APC/OPC Sessions', href: '/apc-opc', icon: Plane },
        { name: 'Line Checks', href: '/line-checks', icon: FileCheck },
        
        // Results & Analytics
        { name: 'Results & Reports', href: '/results', icon: FileText },
        { name: 'Performance Analytics', href: '/performance', icon: LineChart },
        
        // Regulatory & Compliance
        { name: 'Regulatory Records', href: '/regulatory', icon: Briefcase },
        { name: 'Compliance Verification', href: '/verification', icon: Shield },
        { name: 'Examiner Authorizations', href: '/authorizations', icon: Award },
        
        // Quality Management
        { name: 'Quality Assurance', href: '/quality', icon: Activity },
        { name: 'Standards Monitoring', href: '/standards', icon: BarChart },
        
        // Documents & Knowledge
        { name: 'Document Analysis', href: '/document-analysis', icon: Search },
      ];
    } else {
      // Trainee navigation
      return [
        ...baseNavigation,
        // Schedule & Learning
        { name: 'My Schedule', href: '/my-schedule', icon: Calendar },
        { name: 'E-Learning', href: '/elearning', icon: GraduationCap },
        
        // Progress & Records
        { name: 'Training Progress', href: '/progress', icon: Activity },
        { name: 'Flight Records', href: '/flight-records', icon: Plane },
        { name: 'Theory Tests', href: '/theory-tests', icon: CheckSquare },
        
        // Performance & Achievements
        { name: 'Performance Dashboard', href: '/performance', icon: BarChart2 },
        { name: 'Achievements', href: '/achievements', icon: Award },
        { name: 'Leaderboards', href: '/leaderboards', icon: Trophy },
        
        // Resources & Support
        { name: 'Resources', href: '/resources', icon: FileText },
        { name: 'Instructor Feedback', href: '/feedback', icon: FileCheck },
        { name: 'Messaging', href: '/messaging', icon: MessageSquare },
        
        // Knowledge Management
        { name: 'Study Materials', href: '/study', icon: BookOpen },
      ];
    }
  };

  const navigation = getNavigation();
  
  // Update document root CSS variables for theming
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          `bg-gradient-to-b ${theme.sidebar} text-white`,
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-white/10 px-6 ${theme.text}`}>
          <Link to="/" className="flex items-center space-x-2" onClick={() => setSidebarOpen(false)}>
            <div className="size-8 rounded-full bg-white/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold">{theme.logo}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2 px-4">
          <nav className="space-y-0.5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
              >
                <div
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                    location === item.href
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 shrink-0",
                      location === item.href ? "text-white" : "text-white/70"
                    )}
                  />
                  {item.name}
                  {location === item.href && (
                    <ChevronRight className="ml-auto h-4 w-4 text-white" />
                  )}
                </div>
              </Link>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="px-3 mb-2 text-xs font-semibold text-white/70">
              Quick Actions
            </div>
            <nav className="space-y-0.5">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setHelpDialogOpen(true)}
              >
                <AlertTriangle className="mr-3 h-5 w-5" />
                Help & Support
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-3 text-white/70 hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link to="/settings">
                  <Cog className="mr-3 h-5 w-5" />
                  Settings
                </Link>
              </Button>
            </nav>
          </div>
        </ScrollArea>
        
        {/* User menu at bottom of sidebar */}
        <div className="flex items-center justify-between gap-2 border-t border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-white/10 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="grid gap-0.5">
              <p className="text-sm font-medium text-white">
                {user?.firstName || ''} {user?.lastName || ''}
              </p>
              <p className="text-xs text-white/70">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Cog className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Cog className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-72">
        {/* Top navigation bar */}
        <header className={`sticky top-0 z-10 ${theme.header} text-white border-b border-white/10`}>
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="text-white">
                <ThemeToggle />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => setHelpDialogOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Help
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-9 hover:bg-white/10"
                  >
                    <span className="sr-only">User menu</span>
                    <User className="h-5 w-5 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName || ''} {user?.lastName || ''}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || ''}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Cog className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-background dark:bg-gray-900 min-h-screen">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Help dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              Get help with using the Advanced Pilot Training Platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Documentation</h3>
              <p className="text-sm text-muted-foreground">
                View comprehensive documentation for all features and functionalities of the platform.
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Clipboard className="mr-2 h-4 w-4" />
                  View Documentation
                </a>
              </Button>
            </div>
            <div>
              <h3 className="font-medium mb-1">Contact Support</h3>
              <p className="text-sm text-muted-foreground">
                Need additional assistance? Our support team is available to help.
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="mailto:support@aviation-training.example.com">
                  <User className="mr-2 h-4 w-4" />
                  Contact Support
                </a>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setHelpDialogOpen(false)}
              style={{ backgroundColor: theme.primary }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}