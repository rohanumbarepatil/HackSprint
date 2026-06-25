'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, ArrowRight, Sparkles, FolderKanban } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHomePage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Good afternoon, Rohan</h1>
          <p className="text-muted-foreground mt-1">Here is what&apos;s happening with your projects today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Suggestions
          </Button>
          <Link href="/dashboard/projects/new" passHref>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Widgets Grid (Future: Draggable with dnd-kit) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Continue Working Widget */}
        <Card className="md:col-span-2 shadow-sm border-border bg-card hover:border-border/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Continue Working</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 h-8">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
              <FolderKanban className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-medium">No active projects</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
                Get started by creating a new project or generating an AI blueprint from a template.
              </p>
              <Link href="/dashboard/projects/new" passHref>
                <Button>Create Project</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats / Credits Widget */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">AI Credits</span>
                <span className="font-semibold text-primary">8,450 left</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[35%]" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium leading-none">Welcome to HackSprint AI</p>
                    <p className="text-xs text-muted-foreground mt-1">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Widget */}
        <Card className="md:col-span-3 shadow-sm border-border bg-card">
          <CardHeader className="pb-4 border-b border-border mb-4">
            <CardTitle className="text-lg font-medium">Popular Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Healthcare SaaS', 'EdTech Platform', 'FinTech App', 'Smart City IoT'].map((template) => (
                <div key={template} className="group relative rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted transition-colors cursor-pointer">
                  <div className="h-24 rounded-lg bg-background border border-border mb-3 flex items-center justify-center overflow-hidden">
                     <Layers className="h-8 w-8 text-muted-foreground opacity-30 group-hover:opacity-50 transition-opacity" />
                  </div>
                  <h4 className="font-medium text-sm">{template}</h4>
                  <p className="text-xs text-muted-foreground mt-1">View architecture →</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// Temporary icon component for templates
function Layers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 12 12 17 22 12" />
      <polyline points="2 17 12 22 22 17" />
    </svg>
  );
}
