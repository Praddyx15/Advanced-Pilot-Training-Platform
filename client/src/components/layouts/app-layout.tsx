import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Layers, X, Menu, LogOut, HelpCircle, User, Settings } from 'lucide-react';
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Get user role for theming
  const userRole = user?.role || 'trainee';
  const userOrgType = user?.organizationType || 'personal';
  
  // Define theme colors based on user role & organization
  const getThemeColors = () => {
    if (userRole === 'admin') {
      return {
        primary: '#0e7490', // Teal 600
        secondary: '#0891b2', // Teal 500
        sidebar: 'from-slate-800 to-slate-900',
        header: 'bg-slate-800',
        text: 'text-white',
        logo: 'Admin Portal'
      };
    } else if (userRole === 'instructor') {
      return {
        primary: '#0f766e', // Teal 700
        secondary: '#14b8a6', // Teal 400
        sidebar: 'from-teal-800 to-teal-900',
        header: 'bg-teal-800',
        text: 'text-white',
        logo: 'Instructor Portal'
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
  
  // Define basic navigation
  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'home' },
    { name: 'Training Programs', href: '/training-programs', icon: 'book' },
    { name: 'Documents', href: '/documents', icon: 'file' },
    { name: 'Knowledge Graph', href: '/knowledge-graph', icon: 'network' }
  ];

  // Update document root CSS variables for theming
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
  }, [theme]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:translate-x-0 lg:relative lg:z-auto",
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
        <ScrollArea className="flex-1 py-2 px-4 h-[calc(100vh-4rem)]">
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = location === item.href;
              // Map the icon names to Lucide React components
              const getIcon = (iconName: string) => {
                switch(iconName) {
                  case 'home': return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 flex-shrink-0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
                  case 'book': return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 flex-shrink-0"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
                  case 'file': return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 flex-shrink-0"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
                  case 'network': return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 flex-shrink-0"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="18" cy="13" r="3"/><line x1="15.5" y1="11.5" x2="16.5" y2="10.5"/><circle cx="6" cy="13" r="3"/><line x1="8.5" y1="11.5" x2="7.5" y2="10.5"/><line x1="9" y1="13" x2="15" y2="13"/><path d="M12 16v5"/></svg>;
                  default: return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 flex-shrink-0"><circle cx="12" cy="12" r="10"/></svg>;
                }
              };
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-gray-200 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {getIcon(item.icon)}
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header for mobile and desktop with user menu */}
        <header className={`flex h-16 items-center justify-between border-b px-6 ${theme.header}`}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-white" />
              <span className="font-semibold text-white">{theme.logo}</span>
            </div>
          </div>
          
          {/* User menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <User className="h-5 w-5" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/help')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  logoutMutation.mutate();
                  setLocation('/auth');
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
