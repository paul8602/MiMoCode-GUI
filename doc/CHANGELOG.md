# Changelog

## [Unreleased] - Desktop GUI Edition

### Added

#### Three-Column Layout (Codex Mode)
- **SummaryPane**: Right-side panel with Plan/Sources/Artifacts tabs
  - Task tree visualization with status indicators (open/in_progress/blocked/done)
  - Source file list extracted from message parts
  - Artifact list derived from session diffs
  - Collapsible panel with keyboard shortcut (`Cmd+Shift+B`)
- **MemoryPanel**: Memory management panel with Project/Session/Notes/Tasks tabs
  - View and edit project memory (MEMORY.md)
  - View session checkpoint and notes
  - Search across all memory files
- **ReviewQueue**: Cross-session review aggregation
  - Status filtering (pending/approved/rejected)
  - File change statistics
  - Unread indicators
  - Quick approve/reject actions

#### Review Workflow
- Approve/Reject buttons in session review panel
- Review status tracking per session
- Fork action on user messages (creates new session from message point)

#### Desktop Experience
- **System Tray**: Tray icon with context menu (show/hide, new session, quit)
- **Global Shortcuts**: `Cmd+Shift+M` (show/hide), `Cmd+Shift+N` (new session)
- **Window Registry**: Multi-window tracking with project association

#### Data Integration
- Task event handling (`task.created`/`task.updated`) in event reducer
- Source file extraction from message parts (`extractSourcesFromParts`)
- Artifact extraction from session diffs (`extractArtifactsFromDiffs`)
- Real-time task synchronization via SSE

#### Internationalization
- 30+ new i18n keys for SummaryPane, MemoryPanel, ReviewQueue
- Chinese (zh) and English (en) translations

#### Testing
- E2E test suite with Playwright (layout, session, summary pane, theme, error handling)

### Changed
- Session page integrates SummaryPane with data sources
- Event reducer handles task lifecycle events
- Child store initializes task field
- Session cache supports task cleanup

### Files Added
- `packages/app/src/components/summary/summary-pane.tsx`
- `packages/app/src/components/memory/memory-panel.tsx`
- `packages/app/src/components/review/review-queue.tsx`
- `packages/app/src/stores/summary-store.ts`
- `packages/app/src/stores/memory-store.ts`
- `packages/app/src/stores/review-store.ts`
- `packages/app/src/utils/summary-helpers.ts`
- `packages/desktop/src/main/tray.ts`
- `packages/desktop/src/main/shortcuts.ts`
- `packages/desktop/src/main/window-registry.ts`
- `packages/app/e2e/layout.spec.ts`

### Files Modified
- `packages/app/src/pages/session.tsx`
- `packages/app/src/context/global-sync/types.ts`
- `packages/app/src/context/global-sync/event-reducer.ts`
- `packages/app/src/context/global-sync/child-store.ts`
- `packages/app/src/context/global-sync/session-cache.ts`
- `packages/desktop/src/main/index.ts`
- `packages/ui/src/components/message-part.tsx`
- `packages/app/src/i18n/en.ts`
- `packages/app/src/i18n/zh.ts`
