'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjectCreationStore } from '@/store/useProjectCreationStore';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewProjectPage() {
  const router = useRouter();
  const { step, data, nextStep, prevStep, updateData, reset } = useProjectCreationStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Clear store on unmount if incomplete
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Connect to ProjectRepository
      await new Promise((res) => setTimeout(res, 1500)); // Simulate API call
      toast.success('Project created successfully!');
      
      // Simulate navigation to the new workspace shell
      router.push('/workspace/mock-project-id-123');
    } catch {
      toast.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold">1. Basic Information</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" value={data.name} onChange={(e) => updateData({ name: e.target.value })} placeholder="e.g. EcoTracker AI" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme / Domain</Label>
              <Input id="theme" value={data.theme} onChange={(e) => updateData({ theme: e.target.value })} placeholder="e.g. Climate Tech" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold">2. Problem Statement</h2>
            <p className="text-sm text-muted-foreground">Describe the exact problem your project aims to solve.</p>
            <div className="space-y-2">
              <textarea 
                className="w-full min-h-[150px] p-3 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={data.problemStatement}
                onChange={(e) => updateData({ problemStatement: e.target.value })}
                placeholder="Carbon tracking for small businesses is too complex and expensive..."
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold">3. Constraints</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Estimate</Label>
                <Input id="budget" value={data.budget} onChange={(e) => updateData({ budget: e.target.value })} placeholder="$0 (Hackathon)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" value={data.deadline} onChange={(e) => updateData({ deadline: e.target.value })} />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold">4. Preferred Technologies</h2>
            <div className="space-y-2">
              <Label>Tech Stack (Comma separated)</Label>
              <Input 
                value={data.technologyPreferences.join(', ')} 
                onChange={(e) => updateData({ technologyPreferences: e.target.value.split(',').map(s => s.trim()) })} 
                placeholder="React, Node.js, Firebase..." 
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold">5. AI Configuration</h2>
            <p className="text-sm text-muted-foreground">What is your primary goal for the AI Copilot?</p>
            <div className="space-y-2">
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-transparent text-sm shadow-sm"
                value={data.aiGoal}
                onChange={(e) => updateData({ aiGoal: e.target.value })}
                placeholder="Generate a rigorous PRD and recommend a graph database schema..."
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold">6. Review & Submit</h2>
            <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-3 text-sm">
              <div className="grid grid-cols-3 border-b border-border pb-2">
                <span className="text-muted-foreground">Name:</span>
                <span className="col-span-2 font-medium">{data.name || 'Untitled'}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-border pb-2">
                <span className="text-muted-foreground">Theme:</span>
                <span className="col-span-2 font-medium">{data.theme || 'Unspecified'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground">Goal:</span>
                <span className="col-span-2 font-medium line-clamp-2">{data.problemStatement || 'None'}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              By clicking &quot;Create Workspace&quot;, the AI Orchestrator will initialize your environment. No generation will happen until you explicitly request it inside the workspace.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="w-full max-w-2xl bg-background border border-border rounded-xl shadow-sm overflow-hidden">
        
        {/* Header & Progress Bar */}
        <div className="border-b border-border p-6 bg-muted/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">Create New Project</h1>
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 6</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out" 
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Content */}
        <div className="p-8 min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/10">
          <Button 
            variant="outline" 
            onClick={step === 1 ? () => router.back() : prevStep}
            disabled={isSubmitting}
            className="w-28"
          >
            {step === 1 ? 'Cancel' : <><ArrowLeft className="mr-2 h-4 w-4" /> Back</>}
          </Button>
          
          {step < 6 ? (
            <Button onClick={nextStep} className="w-28">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !data.name} className="w-40 gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isSubmitting ? 'Initializing...' : 'Create Workspace'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
