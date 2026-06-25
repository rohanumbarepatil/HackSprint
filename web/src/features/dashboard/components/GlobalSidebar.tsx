'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, FolderKanban, Star, Clock, 
  Search, BookOpen, Layers, Target, Code, Database, 
  Settings, BarChart2, ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const WORKSPACE_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Favorites', href: '/dashboard/favorites', icon: Star },
  { name: 'Recent', href: '/dashboard/recent', icon: Clock },
];

const AI_NAV: NavItem[] = [
  { name: 'Research', href: '/dashboard/ai/research', icon: Search },
  { name: 'Solution Generator', href: '/dashboard/ai/solution', icon: Target },
  { name: 'PRD', href: '/dashboard/ai/prd', icon: BookOpen },
  { name: 'TRD', href: '/dashboard/ai/trd', icon: BookOpen },
  { name: 'App Flow', href: '/dashboard/ai/flow', icon: Layers },
  { name: 'UI/UX', href: '/dashboard/ai/ui-ux', icon: Layers },
  { name: 'Backend Schema', href: '/dashboard/ai/schema', icon: Database },
  { name: 'Implementation Plan', href: '/dashboard/ai/plan', icon: Code },
];

const RESOURCES_NAV: NavItem[] = [
  { name: 'Templates', href: '/dashboard/templates', icon: Layers },
  { name: 'Prompt Library', href: '/dashboard/prompts', icon: BookOpen },
  { name: 'AI Library', href: '/dashboard/ai-library', icon: Database },
];

const MANAGEMENT_NAV: NavItem[] = [
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
];

export function GlobalSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      {!isCollapsed && (
        <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </h4>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md mx-2 transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "mr-3 h-4 w-4")} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside 
      className={cn(
        "flex flex-col bg-zinc-50 dark:bg-zinc-950 border-r border-border transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2 font-semibold tracking-tight truncate">
          <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 bg-background rounded-sm" />
          </div>
          {!isCollapsed && <span>HackSprint AI</span>}
        </div>
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {renderNavGroup('Workspace', WORKSPACE_NAV)}
        {renderNavGroup('AI Copilot', AI_NAV)}
        {renderNavGroup('Resources', RESOURCES_NAV)}
        {renderNavGroup('Management', MANAGEMENT_NAV)}
      </div>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border flex justify-end">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
