import React from 'react';
import { GlobalSidebar } from '@/features/dashboard/components/GlobalSidebar';
import { GlobalContextPanel } from '@/features/dashboard/components/GlobalContextPanel';
import { CommandPalette } from '@/features/dashboard/components/CommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Left Sidebar - OS Global Navigation */}
      <GlobalSidebar />

      {/* Center Panel - Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative border-r">
        {children}
      </main>

      {/* Right Panel - Context & Health */}
      <GlobalContextPanel />

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
