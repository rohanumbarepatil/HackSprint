import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background font-sans">
      {/* Left Pane - Branding/Marketing */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-zinc-950 text-white">
        <div>
          <div className="flex items-center space-x-2">
            {/* Minimalist Logo Placeholder */}
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-zinc-950 rounded-sm" />
            </div>
            <span className="text-xl font-semibold tracking-tight">HackSprint AI</span>
          </div>
        </div>
        <div className="space-y-6 max-w-sm">
          <h1 className="text-4xl font-medium tracking-tight">
            The ultimate copilot for your next big idea.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Transform abstract hackathon problems into production-ready software blueprints in seconds.
          </p>
        </div>
        <div className="text-sm text-zinc-500 font-medium">
          © {new Date().getFullYear()} HackSprint AI Inc.
        </div>
      </div>

      {/* Right Pane - Auth Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
