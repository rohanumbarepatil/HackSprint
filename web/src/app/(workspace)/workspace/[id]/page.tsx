'use client';

import React, { useState } from 'react';
import { ModulesSidebar } from '@/features/workspace/components/ModulesSidebar';
import { WorkspaceEditor } from '@/features/workspace/components/WorkspaceEditor';

// In Next.js 15, route params might need to be resolved via use or awaited if server-side, 
// but since this is a client component relying on standard params matching, we can type it.
export default function WorkspacePage() {
  const [activeModule, setActiveModule] = useState('overview');

  return (
    <div className="flex w-full h-full">
      {/* Secondary Sidebar (Modules) */}
      <ModulesSidebar activeModule={activeModule} setActiveModule={setActiveModule} />

      {/* Main Editor Surface */}
      <WorkspaceEditor moduleId={activeModule} />
    </div>
  );
}
