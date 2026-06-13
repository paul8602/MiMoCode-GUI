import { createMemo, createSignal, For, Show, type JSX } from "solid-js"
import { IconButton } from "@mimo-ai/ui/icon-button"
import { TooltipKeybind } from "@mimo-ai/ui/tooltip"
import { Tabs } from "@mimo-ai/ui/tabs"
import { useLanguage } from "@/context/language"

export type SummaryTab = "plan" | "sources" | "artifacts"

export interface TaskNode {
  id: string
  summary: string
  status: "open" | "in_progress" | "blocked" | "done" | "abandoned"
  parent?: string
  children: TaskNode[]
  eventSummary?: string
  depth: number
}

export interface SourceItem {
  path: string
  lineStart?: number
  lineEnd?: number
  references: number
}

export interface ArtifactItem {
  id: string
  type: "file_created" | "file_modified" | "diff" | "terminal"
  path: string
  description: string
  timestamp: number
}

export interface SummaryPaneProps {
  width?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
  tasks?: TaskNode[]
  sources?: SourceItem[]
  artifacts?: ArtifactItem[]
  onTaskSelect?: (taskId: string) => void
  onSourceClick?: (path: string) => void
  onArtifactClick?: (id: string) => void
}

const statusColors: Record<TaskNode["status"], string> = {
  open: "bg-text-weak",
  in_progress: "bg-accent-blue animate-pulse",
  blocked: "bg-accent-red",
  done: "bg-accent-green",
  abandoned: "bg-text-weak opacity-50",
}

function TaskTreeNode(props: {
  node: TaskNode
  onSelect?: (id: string) => void
}) {
  const [expanded, setExpanded] = createSignal(true)
  const hasChildren = createMemo(() => props.node.children.length > 0)

  return (
    <div class="flex flex-col">
      <button
        type="button"
        class="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-surface-raised-base-hover transition-colors text-left group"
        style={{ "padding-left": `${props.node.depth * 12 + 8}px` }}
        onClick={() => {
          if (hasChildren()) setExpanded(!expanded())
          props.onSelect?.(props.node.id)
        }}
      >
        <span class={`shrink-0 w-2 h-2 mt-1.5 rounded-full ${statusColors[props.node.status]}`} />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-12-medium text-text-weak font-mono">{props.node.id}</span>
            <span class="text-12-regular text-text-base truncate">{props.node.summary}</span>
          </div>
          <Show when={props.node.eventSummary}>
            <p class="text-11-regular text-text-weak mt-0.5 truncate">{props.node.eventSummary}</p>
          </Show>
        </div>
        <Show when={hasChildren()}>
          <span class="shrink-0 text-text-weak text-10 transition-transform" classList={{ "rotate-90": expanded() }}>
            ▶
          </span>
        </Show>
      </button>
      <Show when={expanded() && hasChildren()}>
        <For each={props.node.children}>
          {(child) => <TaskTreeNode node={child} onSelect={props.onSelect} />}
        </For>
      </Show>
    </div>
  )
}

function AgentPlanTab(props: { tasks?: TaskNode[]; onSelect?: (id: string) => void }) {
  return (
    <div class="flex-1 min-h-0 overflow-y-auto p-2">
      <Show
        when={props.tasks && props.tasks.length > 0}
        fallback={
          <div class="flex flex-col items-center justify-center h-32 text-text-weak">
            <span class="text-14-regular">No active tasks</span>
          </div>
        }
      >
        <For each={props.tasks}>{(task) => <TaskTreeNode node={task} onSelect={props.onSelect} />}</For>
      </Show>
    </div>
  )
}

function SourcesTabContent(props: { sources?: SourceItem[]; onClick?: (path: string) => void }) {
  return (
    <div class="flex-1 min-h-0 overflow-y-auto p-2">
      <Show
        when={props.sources && props.sources.length > 0}
        fallback={
          <div class="flex flex-col items-center justify-center h-32 text-text-weak">
            <span class="text-14-regular">No sources referenced</span>
          </div>
        }
      >
        <For each={props.sources}>
          {(source) => (
            <button
              type="button"
              class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-surface-raised-base-hover transition-colors text-left"
              onClick={() => props.onClick?.(source.path)}
            >
              <span class="shrink-0 text-icon-base" data-icon="open-file" />
              <div class="flex-1 min-w-0">
                <span class="text-12-regular text-text-base truncate block">{source.path}</span>
                <Show when={source.lineStart}>
                  <span class="text-11-regular text-text-weak">
                    L{source.lineStart}{source.lineEnd ? `-L${source.lineEnd}` : ""}
                  </span>
                </Show>
              </div>
              <span class="shrink-0 text-11-regular text-text-weak">{source.references}x</span>
            </button>
          )}
        </For>
      </Show>
    </div>
  )
}

function ArtifactsTabContent(props: { artifacts?: ArtifactItem[]; onClick?: (id: string) => void }) {
  return (
    <div class="flex-1 min-h-0 overflow-y-auto p-2">
      <Show
        when={props.artifacts && props.artifacts.length > 0}
        fallback={
          <div class="flex flex-col items-center justify-center h-32 text-text-weak">
            <span class="text-14-regular">No artifacts produced</span>
          </div>
        }
      >
        <For each={props.artifacts}>
          {(artifact) => (
            <button
              type="button"
              class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-surface-raised-base-hover transition-colors text-left"
              onClick={() => props.onClick?.(artifact.id)}
            >
              <span class="shrink-0 text-icon-base" data-icon="code-lines" />
              <div class="flex-1 min-w-0">
                <span class="text-12-regular text-text-base truncate block">{artifact.path}</span>
                <span class="text-11-regular text-text-weak truncate block">{artifact.description}</span>
              </div>
            </button>
          )}
        </For>
      </Show>
    </div>
  )
}

export function SummaryPane(props: SummaryPaneProps) {
  const language = useLanguage()
  const [activeTab, setActiveTab] = createSignal<SummaryTab>("plan")

  return (
    <Show when={!props.collapsed}>
      <div
        class="flex flex-col h-full bg-background-stronger border-l border-border-base"
        style={{ width: `${props.width ?? 320}px` }}
      >
        <Tabs value={activeTab()} onChange={(v) => setActiveTab(v as SummaryTab)} variant="normal">
          <div class="flex items-center justify-between px-3 py-1 border-b border-border-base">
            <Tabs.List class="gap-0">
              <Tabs.Trigger value="plan" class="text-12-regular px-2 py-1.5">
                Plan
              </Tabs.Trigger>
              <Tabs.Trigger value="sources" class="text-12-regular px-2 py-1.5">
                Sources
              </Tabs.Trigger>
              <Tabs.Trigger value="artifacts" class="text-12-regular px-2 py-1.5">
                Artifacts
              </Tabs.Trigger>
            </Tabs.List>
            <TooltipKeybind title="Close panel" keybind="mod+shift+b">
              <IconButton
                icon="sidebar"
                variant="ghost"
                size="small"
                onClick={props.onToggleCollapse}
              />
            </TooltipKeybind>
          </div>

          <Tabs.Content value="plan" class="flex-1 min-h-0 overflow-hidden">
            <AgentPlanTab tasks={props.tasks} onSelect={props.onTaskSelect} />
          </Tabs.Content>
          <Tabs.Content value="sources" class="flex-1 min-h-0 overflow-hidden">
            <SourcesTabContent sources={props.sources} onClick={props.onSourceClick} />
          </Tabs.Content>
          <Tabs.Content value="artifacts" class="flex-1 min-h-0 overflow-hidden">
            <ArtifactsTabContent artifacts={props.artifacts} onClick={props.onArtifactClick} />
          </Tabs.Content>
        </Tabs>
      </div>
    </Show>
  )
}
