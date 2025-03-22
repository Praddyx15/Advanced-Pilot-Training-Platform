import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, SlidersHorizontal, BarChart3, Play, AlertTriangle } from "lucide-react";

// Generate mock session data
const generateSessionData = () => {
  const sessionTypes = ["Flight", "Simulator", "Groundschool"];
  const instructors = ["Capt. Johnson", "Capt. Williams", "F/O Barnes", "F/O Rodriguez"];
  const programs = ["B737 Type Rating", "A320 Recurrent", "CRJ Transition", "Citation Refresher"];
  const modules = [
    "Normal Operations", "Abnormal Procedures", "Emergency Procedures", 
    "Maneuvers", "Instrument Approaches", "LOFT"
  ];
  const statuses = [
    { text: "Completed", color: "green" },
    { text: "In Progress", color: "blue" },
    { text: "Scheduled", color: "gray" }
  ];
  
  // Generate 15 sessions over the past 3 months
  return Array.from({ length: 15 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Random date in past 90 days
    
    // Generate random duration between 1-6 hours
    const durationHours = Math.floor(Math.random() * 5) + 1;
    const durationMinutes = Math.floor(Math.random() * 60);
    
    // Random scores between 2.0-4.0
    const score = (Math.random() * 2 + 2).toFixed(1);
    
    // Flags
    const hasFlags = Math.random() > 0.7;
    const flagCount = hasFlags ? Math.floor(Math.random() * 3) + 1 : 0;
    
    // Determine status - older sessions more likely to be completed
    const daysAgo = (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24);
    let statusIndex;
    if (daysAgo > 30) {
      statusIndex = 0; // Completed
    } else if (daysAgo > 7) {
      statusIndex = Math.random() > 0.2 ? 0 : 1; // 80% completed, 20% in progress
    } else {
      statusIndex = Math.floor(Math.random() * 3); // Random status
    }
    
    return {
      id: i + 1,
      date: date,
      type: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
      instructor: instructors[Math.floor(Math.random() * instructors.length)],
      program: programs[Math.floor(Math.random() * programs.length)],
      module: modules[Math.floor(Math.random() * modules.length)],
      duration: `${durationHours}h ${durationMinutes}m`,
      score: score,
      status: statuses[statusIndex],
      flagCount: flagCount,
      replay: Math.random() > 0.3, // 70% have replay available
      insights: [
        "Demonstrated excellent systems knowledge",
        "Needs improvement on crosswind landings",
        "Strong CRM skills observed",
        "Difficulty with non-precision approaches",
        "Excellent handling of system failures",
        "Needs work on checklist discipline"
      ].slice(0, Math.floor(Math.random() * 3) + 1) // 1-3 random insights
    };
  }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first
};

export default function SessionAnalysisTable() {
  const [sessions] = useState(generateSessionData());
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  
  // Handle sort change
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Sort and filter sessions
  const filteredSessions = sessions
    .filter(session => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        session.instructor.toLowerCase().includes(query) ||
        session.program.toLowerCase().includes(query) ||
        session.module.toLowerCase().includes(query) ||
        session.type.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "date":
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case "score":
          comparison = parseFloat(a.score) - parseFloat(b.score);
          break;
        case "instructor":
          comparison = a.instructor.localeCompare(b.instructor);
          break;
        case "program":
          comparison = a.program.localeCompare(b.program);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "status":
          comparison = a.status.text.localeCompare(b.status.text);
          break;
        case "flagCount":
          comparison = a.flagCount - b.flagCount;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  
  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[250px]"
          />
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Date {renderSortIndicator("date")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center gap-1">
                  Type {renderSortIndicator("type")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("program")}
              >
                <div className="flex items-center gap-1">
                  Program/Module {renderSortIndicator("program")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("instructor")}
              >
                <div className="flex items-center gap-1">
                  Instructor {renderSortIndicator("instructor")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort("score")}
              >
                <div className="flex items-center justify-center gap-1">
                  Score {renderSortIndicator("score")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status {renderSortIndicator("status")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("flagCount")}
              >
                <div className="flex items-center gap-1">
                  Flags {renderSortIndicator("flagCount")}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.map((session) => (
              <TableRow key={session.id} onClick={() => setSelectedSession(session)} className="cursor-pointer hover:bg-muted/30">
                <TableCell className="font-medium whitespace-nowrap">
                  {format(session.date, "MMM d, yyyy")}
                </TableCell>
                <TableCell>{session.type}</TableCell>
                <TableCell>
                  <div className="font-medium">{session.program}</div>
                  <div className="text-sm text-muted-foreground">{session.module}</div>
                </TableCell>
                <TableCell>{session.instructor}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-medium ${
                    parseFloat(session.score) >= 3.5 ? "text-emerald-600" : 
                    parseFloat(session.score) >= 2.5 ? "text-blue-600" :
                    "text-amber-600"
                  }`}>
                    {session.score}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`bg-${session.status.color}-50 text-${session.status.color}-700 border-${session.status.color}-200`}
                  >
                    {session.status.text}
                  </Badge>
                </TableCell>
                <TableCell>
                  {session.flagCount > 0 && (
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                      <span>{session.flagCount}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" disabled={!session.replay}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Session details dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              {selectedSession?.program} - {selectedSession?.module}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(selectedSession.date, "MMMM d, yyyy")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedSession.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedSession.duration}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-medium">{selectedSession.instructor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className={`font-medium ${
                    parseFloat(selectedSession.score) >= 3.5 ? "text-emerald-600" : 
                    parseFloat(selectedSession.score) >= 2.5 ? "text-blue-600" :
                    "text-amber-600"
                  }`}>
                    {selectedSession.score} / 4.0
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={`bg-${selectedSession.status.color}-50 text-${selectedSession.status.color}-700 border-${selectedSession.status.color}-200`}
                  >
                    {selectedSession.status.text}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">AI Insights</h3>
                <ul className="space-y-1 ml-5 list-disc">
                  {selectedSession.insights.map((insight: string, index: number) => (
                    <li key={index} className="text-sm">{insight}</li>
                  ))}
                </ul>
              </div>
              
              {selectedSession.flagCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <h3 className="font-medium flex items-center text-amber-800">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {selectedSession.flagCount} Performance Flag{selectedSession.flagCount > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    This session contained performance deviations that require instructor review.
                  </p>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button variant="outline">Download Report</Button>
                
                <div className="space-x-2">
                  {selectedSession.replay && (
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      View Session Replay
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}