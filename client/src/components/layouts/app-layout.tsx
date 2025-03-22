import { ReactNode, useState } from 'react';
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
import {
  Home,
  BookOpen,
  Network,
  BarChart3,
  FileText,
  Layers,
  Calendar,
  CheckSquare,
  Medal,
  Cog,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
  AlertTriangle,
  Clipboard,
  FileCheck,
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

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Programs', href: '/programs', icon: Layers },
    { name: 'Syllabus Generator', href: '/syllabus-generator', icon: BookOpen },
    { name: 'Knowledge Graph', href: '/knowledge-graph', icon: Network },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Sessions', href: '/sessions', icon: Calendar },
    { name: 'Assessments', href: '/assessments', icon: CheckSquare },
    { name: 'Achievements', href: '/achievements', icon: Medal },
    { name: 'Compliance', href: '/compliance', icon: FileCheck },
  ];

  const userIsAdmin = user && user.role === 'admin';
  const userIsInstructor = user && (user.role === 'instructor' || user.role === 'admin');

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
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg dark:bg-gray-950 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Link to="/" className="flex items-center space-x-2" onClick={() => setSidebarOpen(false)}>
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">Aviation Training</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2 px-4">
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              // Skip items based on user role
              if (item.href === '/assessments' && !userIsInstructor) return null;
              if (item.href === '/analytics' && !userIsInstructor) return null;
              if (item.href === '/compliance' && !userIsAdmin) return null;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                      location === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 shrink-0",
                        location === item.href ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    {item.name}
                    {location === item.href && (
                      <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t">
            <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground">
              Quick Actions
            </div>
            <nav className="space-y-0.5">
              <Button
                variant="ghost"
                className="w-full justify-start px-3"
                onClick={() => setHelpDialogOpen(true)}
              >
                <AlertTriangle className="mr-3 h-5 w-5 text-muted-foreground" />
                Help & Support
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-3"
                asChild
              >
                <Link to="/settings">
                  <Cog className="mr-3 h-5 w-5 text-muted-foreground" />
                  Settings
                </Link>
              </Button>
            </nav>
          </div>
        </ScrollArea>
        
        {/* User menu at bottom of sidebar */}
        <div className="flex items-center justify-between gap-2 border-t p-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="grid gap-0.5">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
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
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHelpDialogOpen(true)}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Help
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get help and support</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full size-9"
                  >
                    <span className="sr-only">User menu</span>
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
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
        <main className="flex-1">
          {children}
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
            <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}