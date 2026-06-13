import { createStore } from "solid-js/store"
import type { TaskNode, SourceItem, ArtifactItem } from "@/components/summary/summary-pane"

interface SummaryState {
  tasks: TaskNode[]
  sources: SourceItem[]
  artifacts: ArtifactItem[]
  loading: boolean
  error: string | null
}

const [state, setState] = createStore<SummaryState>({
  tasks: [],
  sources: [],
  artifacts: [],
  loading: false,
  error: null,
})

export const summaryStore = {
  state,

  setTasks(tasks: TaskNode[]) {
    setState("tasks", tasks)
  },

  updateTask(taskId: string, updates: Partial<TaskNode>) {
    const updateNode = (nodes: TaskNode[]): TaskNode[] =>
      nodes.map((node) => {
        if (node.id === taskId) return { ...node, ...updates }
        if (node.children.length > 0) return { ...node, children: updateNode(node.children) }
        return node
      })
    setState("tasks", updateNode(state.tasks))
  },

  setSources(sources: SourceItem[]) {
    setState("sources", sources)
  },

  addSource(source: SourceItem) {
    const existing = state.sources.find((s) => s.path === source.path)
    if (existing) {
      setState("sources", (s) => s.path === source.path, "references", (r) => r + 1)
    } else {
      setState("sources", [...state.sources, source])
    }
  },

  setArtifacts(artifacts: ArtifactItem[]) {
    setState("artifacts", artifacts)
  },

  addArtifact(artifact: ArtifactItem) {
    setState("artifacts", [...state.artifacts, artifact])
  },

  setLoading(loading: boolean) {
    setState("loading", loading)
  },

  setError(error: string | null) {
    setState("error", error)
  },

  clear() {
    setState({ tasks: [], sources: [], artifacts: [], loading: false, error: null })
  },
}
