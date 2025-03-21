import { useApp } from "@/contexts/app-context";
import { useQuery } from "@tanstack/react-query";
import { Book, Video, PlusCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrainingProgram } from "@shared/schema";
import SearchBar from "@/components/shared/search-bar";
import ProgramCard from "@/components/programs/program-card";

interface ProgramsListProps {
  searchQuery: string;
}

export default function ProgramsList({ searchQuery }: ProgramsListProps) {
  const { handleProgramSelect, handleCreateProgram, programs } = useApp();

  // Filter programs based on search query
  const filteredPrograms = programs
    ? programs.filter(
        (program) =>
          program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (program.description &&
            program.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Training Programs</h1>
          <p className="text-slate-500">Manage your aviation training curriculum</p>
        </div>
        <Button
          className="text-sm bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleCreateProgram}
        >
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Create Program
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <SearchBar
            placeholder="Search programs..."
            value={searchQuery}
            onChange={() => {}} // This is handled by the parent component
          />
        </div>
      </div>

      {/* Program cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <p className="text-slate-500">No programs found.</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery
                ? "Try adjusting your search query."
                : "Click 'Create Program' to add a new training program."}
            </p>
          </div>
        ) : (
          filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onSelect={() => handleProgramSelect(program.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
