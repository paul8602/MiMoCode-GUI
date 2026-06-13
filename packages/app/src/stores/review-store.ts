import { createStore } from "solid-js/store"
import type { ReviewQueueItem, ReviewStatus } from "@/components/review/review-queue"

interface ReviewState {
  items: ReviewQueueItem[]
  loading: boolean
  error: string | null
}

const [state, setState] = createStore<ReviewState>({
  items: [],
  loading: false,
  error: null,
})

export const reviewStore = {
  state,

  setItems(items: ReviewQueueItem[]) {
    setState("items", items)
  },

  addItem(item: ReviewQueueItem) {
    const existing = state.items.findIndex((i) => i.sessionId === item.sessionId)
    if (existing >= 0) {
      setState("items", existing, item)
    } else {
      setState("items", [...state.items, item])
    }
  },

  updateStatus(sessionId: string, status: ReviewStatus) {
    setState("items", (i) => i.sessionId === sessionId, "status", status)
  },

  markRead(sessionId: string) {
    setState("items", (i) => i.sessionId === sessionId, "unread", false)
  },

  removeItem(sessionId: string) {
    setState("items", (items) => items.filter((i) => i.sessionId !== sessionId))
  },

  setLoading(loading: boolean) {
    setState("loading", loading)
  },

  setError(error: string | null) {
    setState("error", error)
  },

  buildFromDiffs(
    sessions: { id: string; title?: string; directory: string }[],
    diffs: Record<string, { file: string; additions: number; deletions: number }[]>,
    statuses: Record<string, ReviewStatus>,
  ) {
    const items: ReviewQueueItem[] = []
    for (const session of sessions) {
      const sessionDiffs = diffs[session.id]
      if (!sessionDiffs || sessionDiffs.length === 0) continue
      const additions = sessionDiffs.reduce((sum, d) => sum + d.additions, 0)
      const deletions = sessionDiffs.reduce((sum, d) => sum + d.deletions, 0)
      items.push({
        id: session.id,
        sessionId: session.id,
        sessionTitle: session.title ?? "Untitled",
        directory: session.directory,
        fileCount: sessionDiffs.length,
        additions,
        deletions,
        lastActivity: Date.now(),
        status: statuses[session.id] ?? "pending",
        unread: true,
      })
    }
    setState("items", items)
  },

  clear() {
    setState({ items: [], loading: false, error: null })
  },
}
