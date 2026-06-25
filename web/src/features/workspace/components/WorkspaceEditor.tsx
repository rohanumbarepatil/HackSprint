'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, History, Eye, Edit3 } from 'lucide-react';

type EditorTab = 'preview' | 'edit' | 'history' | 'ai';

interface WorkspaceEditorProps {
  moduleId: string;
}

export function WorkspaceEditor({ moduleId }: WorkspaceEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('edit');

  const editor = useEditor({
    extensions: [StarterKit],
    content: `
      <h2>${moduleId.toUpperCase()} Module</h2>
      <p>This is the generated content for the <strong>${moduleId}</strong> module.</p>
      <p>TipTap allows for rich markdown-like editing. The AI Orchestrator will stream its generation directly into this editor.</p>
      <ul>
        <li>Supports headings</li>
        <li>Lists</li>
        <li>And more...</li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none max-w-full min-h-[500px]',
      },
    },
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Editor Header & Tabs */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-muted/10">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
          <Button 
            variant={activeTab === 'preview' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="mr-2 h-3 w-3" /> Preview
          </Button>
          <Button 
            variant={activeTab === 'edit' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setActiveTab('edit')}
          >
            <Edit3 className="mr-2 h-3 w-3" /> Edit
          </Button>
          <Button 
            variant={activeTab === 'history' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setActiveTab('history')}
          >
            <History className="mr-2 h-3 w-3" /> History
          </Button>
          <Button 
            variant={activeTab === 'ai' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 text-xs text-primary"
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles className="mr-2 h-3 w-3" /> AI Validation
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs font-medium">
             <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
             Generating...
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Download className="h-3 w-3" /> Export
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'edit' && (
            <EditorContent editor={editor} />
          )}
          {activeTab === 'preview' && (
            <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-full">
              <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <History className="h-10 w-10 mb-4 opacity-50" />
              <p>Version history will appear here once the document is generated.</p>
            </div>
          )}
          {activeTab === 'ai' && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-4 opacity-50 text-primary" />
              <p>AI Copilot is analyzing this document for inconsistencies...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
