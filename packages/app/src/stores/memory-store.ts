import { createStore } from "solid-js/store"
import type { MemoryContent, MemoryTab } from "@/components/memory/memory-panel"

interface MemoryState {
  content: MemoryContent
  loading: boolean
  error: string | null
  searchResults: { section: MemoryTab; matches: string[] }[]
}

const [state, setState] = createStore<MemoryState>({
  content: {
    projectMemory: "",
    sessionCheckpoint: "",
    notes: "",
    taskProgress: {},
  },
  loading: false,
  error: null,
  searchResults: [],
})

export const memoryStore = {
  state,

  setContent(content: Partial<MemoryContent>) {
    setState("content", (prev) => ({ ...prev, ...content }))
  },

  setProjectMemory(content: string) {
    setState("content", "projectMemory", content)
  },

  setSessionCheckpoint(content: string) {
    setState("content", "sessionCheckpoint", content)
  },

  setNotes(content: string) {
    setState("content", "notes", content)
  },

  setTaskProgress(taskId: string, content: string) {
    setState("content", "taskProgress", taskId, content)
  },

  setLoading(loading: boolean) {
    setState("loading", loading)
  },

  setError(error: string | null) {
    setState("error", error)
  },

  search(query: string) {
    if (!query.trim()) {
      setState("searchResults", [])
      return
    }

    const q = query.toLowerCase()
    const results: MemoryState["searchResults"] = []

    const searchSection = (section: MemoryTab, content: string) => {
      const lines = content.split("\n")
      const matches = lines.filter((line) => line.toLowerCase().includes(q))
      if (matches.length > 0) results.push({ section, matches })
    }

    searchSection("project", state.content.projectMemory)
    searchSection("session", state.content.sessionCheckpoint)
    searchSection("notes", state.content.notes)

    for (const [taskId, content] of Object.entries(state.content.taskProgress)) {
      searchSection("tasks", `## ${taskId}\n${content}`)
    }

    setState("searchResults", results)
  },

  clear() {
    setState({
      content: { projectMemory: "", sessionCheckpoint: "", notes: "", taskProgress: {} },
      loading: false,
      error: null,
      searchResults: [],
    })
  },
}
