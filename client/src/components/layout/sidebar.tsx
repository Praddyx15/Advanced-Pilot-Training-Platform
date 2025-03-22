import { useApp } from "@/contexts/app-context";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Book,
  Monitor,
  FileText,
  Users,
  Airplay,
  Settings,
  LogOut,
  Wand2,
  Network,
  LineChart,
  ActivitySquare
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function Sidebar() {
  const { activeTab, setActiveTab } = useApp();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const MenuItem = ({ id, icon, label }: { id: string; icon: React.ReactNode; label: string }) => (
    <button
      className={cn(
        "sidebar-item flex items-center gap-x-3 py-2 px-3 rounded-md text-sm font-medium transition-colors",
        activeTab === id 
          ? "bg-blue-100 text-blue-800" 
          : "text-slate-600 hover:bg-slate-100"
      )}
      onClick={() => setActiveTab(id)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="w-64 hidden md:block bg-white border-r border-slate-200 py-4 px-2 overflow-y-auto">
      <div className="space-y-1 px-2">
        <MenuItem id="dashboard" icon={<BarChart className="h-5 w-5" />} label="Dashboard" />
        <MenuItem id="programs" icon={<Book className="h-5 w-5" />} label="Training Programs" />
        <MenuItem id="sessions" icon={<Monitor className="h-5 w-5" />} label="Sessions" />
        <MenuItem id="assessments" icon={<FileText className="h-5 w-5" />} label="Assessments" />
        <MenuItem id="trainees" icon={<Users className="h-5 w-5" />} label="Trainees" />
        <MenuItem id="resources" icon={<Airplay className="h-5 w-5" />} label="Resources" />
        <MenuItem id="documents" icon={<FileText className="h-5 w-5" />} label="Documents" />
      </div>
      
      <div className="border-t border-slate-200 my-4"></div>
      
      <div className="space-y-1 px-2">
        {/* Tools Section */}
        <Link href="/syllabus-generator">
          <a className="sidebar-item flex items-center gap-x-3 py-2 px-3 rounded-md text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors">
            <Wand2 className="h-5 w-5" />
            <span>AI Syllabus Generator</span>
          </a>
        </Link>
        
        <Link href="/knowledge-graph">
          <a className="sidebar-item flex items-center gap-x-3 py-2 px-3 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            <Network className="h-5 w-5" />
            <span>Knowledge Graph</span>
          </a>
        </Link>
        
        <Link href="/analytics">
          <a className="sidebar-item flex items-center gap-x-3 py-2 px-3 rounded-md text-sm font-medium text-green-600 hover:bg-green-50 transition-colors">
            <ActivitySquare className="h-5 w-5" />
            <span>Analytics Dashboard</span>
          </a>
        </Link>
        
        <MenuItem id="settings" icon={<Settings className="h-5 w-5" />} label="Settings" />
        
        <button
          className="sidebar-item text-red-600 hover:bg-red-50 flex items-center gap-x-3 py-2 px-3 rounded-md text-sm font-medium transition-colors w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
