# Phase 5: Integration & Chat Interface

**Goal**: Wire the ai-core layer into the Next.js app router pages, build the multi-agent chat UI, and establish the DAG-driven workspace experience.

## Overview

Phase 4 delivered a complete ai-core architecture (14 agents, streaming, validation, Firestore persistence, DAG orchestration). Phase 5 connects this engine to the frontend and makes it interactive.

## Tasks

### 5.1 API Routes — Agent Execution Endpoints

Create Next.js API routes under `app/api/ai/` that bridge frontend requests to ai-core:

- `POST /api/ai/generate` — Accept project context, run DAGOrchestrator, stream events via SSE back to client.
- `POST /api/ai/validate` — Run ValidationPipeline on existing generation results.
- `GET /api/ai/status/:sessionId` — Poll generation progress for non-streaming clients.
- `POST /api/ai/cancel/:sessionId` — Abort a running orchestration.

**Key files**: `app/api/ai/generate/route.ts`, `app/api/ai/validate/route.ts`

### 5.2 Workspace Chat Interface

Replace or augment `app/workspace/[id]/page.tsx` with a chat-like multi-agent interface:

- Chat message list showing agent turns with agent icon/name.
- Message input bar with send button.
- Real-time streaming message rendering (append tokens as they arrive).
- Agent typing indicator during orchestration.
- Collapsible side panel showing generation artifacts (architecture diagram, user stories, etc.).

**Key components**: `components/workspace/ChatPanel.tsx`, `components/workspace/MessageBubble.tsx`, `components/workspace/StreamingText.tsx`

### 5.3 Project Dashboard Integration

Update `app/dashboard/page.tsx` and `app/projects/new/page.tsx`:

- "New Project" wizard: capture problem statement → call `/api/ai/generate` → show streaming results → save to Firestore.
- Dashboard cards show project status (generating/complete/failed), last updated, agent output summary.
- Click project → navigate to workspace with preloaded generation context.

### 5.4 Agent Output Rendering

Build structured renderers for each agent's output type:

- **ProblemAnalyzerAgent** → Problem statement card with key insights.
- **ResearchAgent** → Market research summary with sources.
- **TechnicalArchitectAgent** → Stack recommendation badges.
- **PMAgent** → Timeline Gantt chart (simple CSS grid).
- **PitchAgent** → Slide preview carousel.
- **ValidationAgent** → Pass/fail checklist.

### 5.5 State Management & Caching

- React context or Zustand store for active generation state.
- SWR or React Query for Firestore document fetching.
- Optimistic updates for chat messages.
- Debounced auto-save of workspace edits to Firestore.

### 5.6 Final Polishing

- Error boundaries around agent output components.
- Loading skeletons during generation.
- Keyboard shortcuts (Cmd+Enter to send, Escape to cancel).
- Responsive layout for mobile workspace view.
- Accessibility audit (aria labels, focus management, screen reader announcements for streaming text).

## Architecture Flow

```
User types problem statement
  → POST /api/ai/generate
    → DAGOrchestrator.run(context)
      → AgentRegistry.resolve(phases)
        → ProviderFactory.getProvider() → GeminiProvider.stream()
          → Events: STARTED → RESEARCHING → THINKING → GENERATING → ...
            → StreamingPipeline emits to SSE response
  → Client receives events and renders progressively
  → On completion, results saved to Firestore via FirestoreRepository
  → Workspace displays final output with agent breakdown
```

## Estimated Effort

| Task | Est. hours | Dependencies |
|------|-----------|--------------|
| 5.1 API Routes | 6 | Phase 4 (done) |
| 5.2 Chat Interface | 10 | 5.1 |
| 5.3 Dashboard Integration | 6 | 5.1 |
| 5.4 Agent Output Rendering | 8 | 5.2 |
| 5.5 State Management | 4 | 5.1, 5.2 |
| 5.6 Final Polishing | 4 | 5.2–5.5 |

**Total**: ~38 hours
