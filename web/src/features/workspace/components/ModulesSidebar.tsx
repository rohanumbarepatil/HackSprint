'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText, Search, Users, Lightbulb, Book, Database, 
  Layout, Code, CheckSquare, Presentation, Briefcase, FileArchive, History
} from 'lucide-react';

const MODULES = [
  { id: 'overview', label: 'Overview', icon: FileText, status: 'completed' },
  { id: 'research', label: 'Research', icon: Search, status: 'validated' },
  { id: 'competitors', label: 'Competitors', icon: Users, status: 'completed' },
  { id: 'solution', label: 'Solution', icon: Lightbulb, status: 'generating' },
  { id: 'prd', label: 'PRD', icon: Book, status: 'not-started' },
  { id: 'trd', label: 'TRD', icon: Book, status: 'not-started' },
  { id: 'architecture', label: 'Architecture', icon: Layout, status: 'not-started' },
  { id: 'database', label: 'Database', icon: Database, status: 'not-started' },
  { id: 'apis', label: 'APIs', icon: Code, status: 'not-started' },
  { id: 'ui-ux', label: 'UI/UX', icon: Layout, status: 'not-started' },
  { id: 'implementation', label: 'Implementation', icon: Code, status: 'not-started' },
  { id: 'testing', label: 'Testing', icon: CheckSquare, status: 'not-started' },
  { id: 'pitch', label: 'Pitch Deck', icon: Presentation, status: 'not-started' },
  { id: 'business', label: 'Business Model', icon: Briefcase, status: 'not-started' },
  { id: 'exports', label: 'Exports', icon: FileArchive, status: 'completed' },
  { id: 'history', label: 'History', icon: History, status: 'completed' }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'validated': return 'bg-blue-500';
    case 'generating': return 'bg-yellow-500 animate-pulse';
    case 'not-started': return 'bg-zinc-300 dark:bg-zinc-700';
    default: return 'bg-transparent';
  }
};

export function ModulesSidebar({ activeModule, setActiveModule }: { activeModule: string, setActiveModule: (m: string) => void }) {
  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col h-full">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="font-medium text-sm truncate flex-1">Project Modules</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {MODULES.map((mod) => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <mod.icon className="h-4 w-4 opacity-70" />
                <span>{mod.label}</span>
              </div>
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(mod.status))} title={mod.status} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
