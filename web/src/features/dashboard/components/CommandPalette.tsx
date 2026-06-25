'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, FolderKanban, Sparkles, BookOpen, Settings, FilePlus } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <Command 
        className="w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <div className="flex items-center border-b border-border px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input 
            autoFocus
            placeholder="Type a command or search..." 
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group heading="Suggestions" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/projects/new'))}
              className="flex items-center px-2 py-2 text-sm text-foreground rounded-md cursor-pointer aria-selected:bg-muted aria-selected:text-accent-foreground"
            >
              <FilePlus className="mr-2 h-4 w-4" />
              <span>Create New Project</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/ai/research'))}
              className="flex items-center px-2 py-2 text-sm text-foreground rounded-md cursor-pointer aria-selected:bg-muted aria-selected:text-accent-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span>Generate Research</span>
            </Command.Item>
          </Command.Group>

          <Command.Separator className="h-px bg-border my-1" />

          <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/projects'))}
              className="flex items-center px-2 py-2 text-sm text-foreground rounded-md cursor-pointer aria-selected:bg-muted aria-selected:text-accent-foreground"
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              <span>Go to Projects</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/templates'))}
              className="flex items-center px-2 py-2 text-sm text-foreground rounded-md cursor-pointer aria-selected:bg-muted aria-selected:text-accent-foreground"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Browse Templates</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/settings'))}
              className="flex items-center px-2 py-2 text-sm text-foreground rounded-md cursor-pointer aria-selected:bg-muted aria-selected:text-accent-foreground"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
      
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  );
}
