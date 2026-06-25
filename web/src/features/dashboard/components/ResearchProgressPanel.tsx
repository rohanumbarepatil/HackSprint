'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Circle, XCircle } from 'lucide-react';
import {
  useResearchProgressStore,
  DISPLAY_STAGES,
  STAGE_LABELS,
} from '@/store/useResearchProgressStore';

const stageIcons: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  active: Loader2,
  pending: Circle,
  failed: XCircle,
};

const stageColors: Record<string, string> = {
  completed: 'text-green-500',
  active: 'text-primary',
  pending: 'text-muted-foreground',
  failed: 'text-destructive',
};

const stageBgColors: Record<string, string> = {
  completed: 'bg-green-500/10 border-green-500/20',
  active: 'bg-primary/10 border-primary/20',
  pending: 'bg-muted/30 border-border',
  failed: 'bg-destructive/10 border-destructive/20',
};

const connectedLineColors: Record<string, string> = {
  completed: 'bg-green-500/30',
  active: 'bg-primary/20',
  pending: 'bg-border',
  failed: 'bg-destructive/30',
};

export function ResearchProgressPanel() {
  const { currentStage, progressPercent, stageStatuses, errorMessage } = useResearchProgressStore();

  const isRunning = currentStage !== 'idle'
    && currentStage !== 'completed'
    && currentStage !== 'failed';

  return (
    <Card className="shadow-sm border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Research Progress</CardTitle>
          {isRunning && (
            <span className="text-xs text-muted-foreground">{progressPercent}%</span>
          )}
        </div>
        {currentStage === 'completed' && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
            Research completed successfully
          </p>
        )}
        {currentStage === 'failed' && (
          <p className="text-xs text-destructive font-medium">
            Research failed: {errorMessage || 'Unknown error'}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {currentStage === 'idle' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Circle className="h-8 w-8 text-muted-foreground mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">
              No research is currently running.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a project generation to see live progress.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {DISPLAY_STAGES.map((stage, idx) => {
              const status = stageStatuses[stage];
              const Icon = stageIcons[status] || Circle;
              const isLast = idx === DISPLAY_STAGES.length - 1;

              return (
                <div key={stage} className="flex gap-3">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full border transition-colors',
                      stageBgColors[status],
                      status === 'active' && 'animate-pulse',
                    )}>
                      <Icon className={cn(
                        'h-3 w-3',
                        stageColors[status],
                        status === 'active' && 'animate-spin',
                      )} />
                    </div>
                    {!isLast && (
                      <div className={cn(
                        'w-0.5 h-8 transition-colors',
                        connectedLineColors[status],
                      )} />
                    )}
                  </div>

                  {/* Stage label */}
                  <div className="pb-6 flex-1">
                    <p className={cn(
                      'text-sm font-medium transition-colors',
                      status === 'completed' && 'text-green-600 dark:text-green-400 line-through opacity-70',
                      status === 'active' && 'text-foreground font-semibold',
                      status === 'pending' && 'text-muted-foreground',
                      status === 'failed' && 'text-destructive',
                    )}>
                      {STAGE_LABELS[stage]}
                    </p>
                    {status === 'active' && !isLast && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Processing...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Overall progress bar */}
            <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  currentStage === 'completed' && 'bg-green-500',
                  currentStage === 'failed' && 'bg-destructive',
                  isRunning && 'bg-primary',
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
