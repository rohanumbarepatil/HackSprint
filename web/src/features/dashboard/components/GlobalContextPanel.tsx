'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Activity, Bell, Sparkles, SlidersHorizontal, HeartPulse } from 'lucide-react';

type TabType = 'properties' | 'copilot' | 'notifications' | 'health' | 'activity';

export function GlobalContextPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('health');

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-border bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center py-4 gap-4 transition-all">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="h-8 w-8 text-muted-foreground">
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
        <div className="flex flex-col gap-2 mt-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setActiveTab('properties'); setIsCollapsed(false); }} title="Properties">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setActiveTab('copilot'); setIsCollapsed(false); }} title="AI Copilot">
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setActiveTab('notifications'); setIsCollapsed(false); }} title="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setActiveTab('health'); setIsCollapsed(false); }} title="Project Health">
            <HeartPulse className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setActiveTab('activity'); setIsCollapsed(false); }} title="Activity">
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-80 border-l border-border bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-all">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <h3 className="font-medium text-sm tracking-tight capitalize">{activeTab}</h3>
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="h-8 w-8 text-muted-foreground">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs / Mini Nav */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border bg-muted/30">
        <Button variant={activeTab === 'properties' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setActiveTab('properties')} title="Properties">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <Button variant={activeTab === 'copilot' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 text-primary" onClick={() => setActiveTab('copilot')} title="AI Copilot">
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button variant={activeTab === 'notifications' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setActiveTab('notifications')} title="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant={activeTab === 'health' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setActiveTab('health')} title="Project Health">
          <HeartPulse className="h-4 w-4" />
        </Button>
        <Button variant={activeTab === 'activity' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setActiveTab('activity')} title="Activity">
          <Activity className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background border border-border space-y-2">
              <div className="text-xs text-muted-foreground uppercase font-semibold">AI Credits</div>
              <div className="text-2xl font-semibold tracking-tight">8,450</div>
            </div>
            <div className="p-4 rounded-lg bg-background border border-border space-y-2">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Project Health</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Optimal</span>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'copilot' && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <Sparkles className="h-8 w-8 text-primary" />
            <p className="text-sm">Select a document to chat with AI.</p>
          </div>
        )}
        {/* Placeholder for other tabs */}
        {(activeTab === 'properties' || activeTab === 'notifications' || activeTab === 'activity') && (
          <div className="text-sm text-muted-foreground text-center mt-10">
            {activeTab} content will appear here.
          </div>
        )}
      </div>
    </aside>
  );
}
