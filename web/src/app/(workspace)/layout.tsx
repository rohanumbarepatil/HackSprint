import React from 'react';
import { GlobalSidebar } from '@/features/dashboard/components/GlobalSidebar';
import { GlobalContextPanel } from '@/features/dashboard/components/GlobalContextPanel';
import { CommandPalette } from '@/features/dashboard/components/CommandPalette';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Primary Global Nav (OS Level) */}
      <GlobalSidebar />

      {/* Main Workspace Area (Modules Sidebar + Editor) */}
      <main className="flex-1 flex min-w-0 overflow-hidden relative border-r border-border">
        {children}
      </main>

      {/* Right Panel - Context & AI Copilot */}
      <GlobalContextPanel />

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
