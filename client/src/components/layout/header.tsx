import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Airplay } from "lucide-react";
import SearchBar from "@/components/shared/search-bar";
import UserMenu from "@/components/shared/user-menu";
import NotificationsPopover from "@/components/shared/notifications";

interface HeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

export default function Header({ searchQuery, onSearch }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <Airplay className="h-8 w-8 text-secondary" />
                <span className="ml-2 text-xl font-semibold text-primary">AviationTMS</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative max-w-md w-80 hidden md:block">
              <SearchBar 
                placeholder="Search programs, documents..." 
                value={searchQuery}
                onChange={onSearch}
              />
            </div>
            
            <NotificationsPopover />
            
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
