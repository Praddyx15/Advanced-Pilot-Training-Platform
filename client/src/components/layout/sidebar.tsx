import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Book, 
  Calendar, 
  FileText, 
  Airplay, 
  FileArchive, 
  Settings, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const links = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/programs", icon: Book, label: "Programs" },
    { href: "/sessions", icon: Calendar, label: "Sessions" },
    { href: "/assessments", icon: FileText, label: "Assessments" },
    { href: "/resources", icon: Airplay, label: "Resources" },
    { href: "/documents", icon: FileArchive, label: "Documents" },
  ];
  
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };
  
  return (
    <aside className="flex flex-col bg-slate-950 text-white h-full">
      <div className="flex items-center justify-center h-16 border-b border-slate-800">
        <span className="text-2xl font-bold text-primary-400 font-heading">AviationTrain</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        {/* User info */}
        <div className="px-4 py-2 mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-primary-400">
              <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            <div>
              <div className="font-medium">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="px-2 space-y-1">
          {links.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            
            return (
              <Link key={link.href} href={link.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-md group",
                    isActive 
                      ? "bg-primary-500 text-white" 
                      : "text-white hover:bg-slate-800"
                  )}
                  onClick={handleLinkClick}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {link.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="flex w-full items-center justify-start px-4 py-2 text-sm rounded-md text-white hover:bg-slate-800"
          onClick={() => {}}
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </Button>
        
        <Button
          variant="ghost"
          className="flex w-full items-center justify-start px-4 py-2 text-sm rounded-md text-white hover:bg-slate-800 mt-2"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
