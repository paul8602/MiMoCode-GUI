import { createMemo, createSignal, Show } from "solid-js"
import { Tabs } from "@mimo-ai/ui/tabs"
import { IconButton } from "@mimo-ai/ui/icon-button"
import { useLanguage } from "@/context/language"

export type MemoryTab = "project" | "session" | "notes" | "tasks"

export interface MemoryContent {
  projectMemory: string
  sessionCheckpoint: string
  notes: string
  taskProgress: Record<string, string>
}

export interface MemoryPanelProps {
  memory?: MemoryContent
  loading?: boolean
  onEdit?: (section: MemoryTab, content: string) => void
  onSearch?: (query: string) => void
}

function MemoryViewer(props: { content: string; editable?: boolean; onSave?: (content: string) => void }) {
  const [editing, setEditing] = createSignal(false)
  const [draft, setDraft] = createSignal(props.content)

  const handleSave = () => {
    props.onSave?.(draft())
    setEditing(false)
  }

  return (
    <div class="flex flex-col flex-1 min-h-0">
      <Show
        when={editing()}
        fallback={
          <div class="flex-1 min-h-0 overflow-y-auto p-3">
            <pre class="text-12-regular text-text-base whitespace-pre-wrap font-mono leading-relaxed">
              {props.content || "Empty"}
            </pre>
          </div>
        }
      >
        <textarea
          class="flex-1 min-h-0 p-3 bg-transparent text-12-regular text-text-base font-mono resize-none focus:outline-none"
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
        />
        <div class="flex items-center gap-2 px-3 py-2 border-t border-border-base">
          <button
            type="button"
            class="px-3 py-1 text-12-medium bg-accent-blue text-white rounded-md hover:opacity-90"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            type="button"
            class="px-3 py-1 text-12-medium text-text-base rounded-md hover:bg-surface-raised-base-hover"
            onClick={() => {
              setDraft(props.content)
              setEditing(false)
            }}
          >
            Cancel
          </button>
        </div>
      </Show>
      <Show when={!editing() && props.editable}>
        <div class="flex items-center px-3 py-2 border-t border-border-base">
          <IconButton
            icon="pencil-line"
            variant="ghost"
            size="small"
            onClick={() => {
              setDraft(props.content)
              setEditing(true)
            }}
          />
        </div>
      </Show>
    </div>
  )
}

export function MemoryPanel(props: MemoryPanelProps) {
  const language = useLanguage()
  const [activeTab, setActiveTab] = createSignal<MemoryTab>("project")
  const [searchQuery, setSearchQuery] = createSignal("")

  const currentContent = createMemo(() => {
    if (!props.memory) return ""
    switch (activeTab()) {
      case "project":
        return props.memory.projectMemory
      case "session":
        return props.memory.sessionCheckpoint
      case "notes":
        return props.memory.notes
      case "tasks":
        return Object.entries(props.memory.taskProgress)
          .map(([id, content]) => `## ${id}\n${content}`)
          .join("\n\n")
      default:
        return ""
    }
  })

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center gap-2 px-3 py-2 border-b border-border-base">
        <div class="flex-1 min-w-0">
          <input
            type="text"
            class="w-full px-2 py-1 text-12-regular bg-surface-raised-base text-text-base rounded-md border border-border-base focus:outline-none focus:border-accent-blue"
            placeholder="Search memory..."
            value={searchQuery()}
            onInput={(e) => {
              setSearchQuery(e.currentTarget.value)
              props.onSearch?.(e.currentTarget.value)
            }}
          />
        </div>
      </div>

      <Tabs value={activeTab()} onChange={(v) => setActiveTab(v as MemoryTab)} variant="normal">
        <div class="px-3 py-1 border-b border-border-base">
          <Tabs.List class="gap-0">
            <Tabs.Trigger value="project" class="text-12-regular px-2 py-1.5">
              Project
            </Tabs.Trigger>
            <Tabs.Trigger value="session" class="text-12-regular px-2 py-1.5">
              Session
            </Tabs.Trigger>
            <Tabs.Trigger value="notes" class="text-12-regular px-2 py-1.5">
              Notes
            </Tabs.Trigger>
            <Tabs.Trigger value="tasks" class="text-12-regular px-2 py-1.5">
              Tasks
            </Tabs.Trigger>
          </Tabs.List>
        </div>

        <Tabs.Content value="project" class="flex-1 min-h-0 overflow-hidden">
          <Show
            when={!props.loading}
            fallback={<div class="flex-1 flex items-center justify-center"><span class="text-12-regular text-text-weak">Loading...</span></div>}
          >
            <MemoryViewer
              content={currentContent()}
              editable
              onSave={(content) => props.onEdit?.("project", content)}
            />
          </Show>
        </Tabs.Content>
        <Tabs.Content value="session" class="flex-1 min-h-0 overflow-hidden">
          <Show
            when={!props.loading}
            fallback={<div class="flex-1 flex items-center justify-center"><span class="text-12-regular text-text-weak">Loading...</span></div>}
          >
            <MemoryViewer content={currentContent()} />
          </Show>
        </Tabs.Content>
        <Tabs.Content value="notes" class="flex-1 min-h-0 overflow-hidden">
          <Show
            when={!props.loading}
            fallback={<div class="flex-1 flex items-center justify-center"><span class="text-12-regular text-text-weak">Loading...</span></div>}
          >
            <MemoryViewer
              content={currentContent()}
              editable
              onSave={(content) => props.onEdit?.("notes", content)}
            />
          </Show>
        </Tabs.Content>
        <Tabs.Content value="tasks" class="flex-1 min-h-0 overflow-hidden">
          <Show
            when={!props.loading}
            fallback={<div class="flex-1 flex items-center justify-center"><span class="text-12-regular text-text-weak">Loading...</span></div>}
          >
            <MemoryViewer content={currentContent()} />
          </Show>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}
