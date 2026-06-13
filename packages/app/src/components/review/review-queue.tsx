import { createMemo, createSignal, For, Show } from "solid-js"
import { IconButton } from "@mimo-ai/ui/icon-button"
import { Tooltip } from "@mimo-ai/ui/tooltip"
import { useLanguage } from "@/context/language"

export type ReviewStatus = "pending" | "approved" | "rejected"

export interface ReviewQueueItem {
  id: string
  sessionId: string
  sessionTitle: string
  directory: string
  fileCount: number
  additions: number
  deletions: number
  lastActivity: number
  status: ReviewStatus
  unread: boolean
}

export interface ReviewQueueProps {
  items: ReviewQueueItem[]
  loading?: boolean
  onItemClick: (item: ReviewQueueItem) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

const statusColors: Record<ReviewStatus, string> = {
  pending: "bg-accent-yellow",
  approved: "bg-accent-green",
  rejected: "bg-accent-red",
}

const statusLabels: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

function ReviewQueueItemComponent(props: {
  item: ReviewQueueItem
  onClick: () => void
  onApprove?: () => void
  onReject?: () => void
}) {
  const timeAgo = createMemo(() => {
    const diff = Date.now() - props.item.lastActivity
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  })

  return (
    <button
      type="button"
      class="flex items-start gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-surface-raised-base-hover transition-colors text-left group"
      classList={{ "border-l-2 border-accent-blue": props.item.unread }}
      onClick={props.onClick}
    >
      <span class={`shrink-0 w-2 h-2 mt-2 rounded-full ${statusColors[props.item.status]}`} />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-13-medium text-text-strong truncate">{props.item.sessionTitle}</span>
          <Show when={props.item.unread}>
            <span class="shrink-0 w-1.5 h-1.5 rounded-full bg-accent-blue" />
          </Show>
        </div>
        <div class="flex items-center gap-3 mt-1">
          <span class="text-11-regular text-text-weak">
            {props.item.fileCount} file{props.item.fileCount !== 1 ? "s" : ""}
          </span>
          <span class="text-11-regular text-accent-green">+{props.item.additions}</span>
          <span class="text-11-regular text-accent-red">-{props.item.deletions}</span>
          <span class="text-11-regular text-text-weak">{timeAgo()}</span>
        </div>
      </div>
      <div class="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Show when={props.onApprove && props.item.status === "pending"}>
          <Tooltip value="Approve" placement="top">
            <IconButton
              icon="circle-check"
              size="small"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                props.onApprove?.()
              }}
            />
          </Tooltip>
        </Show>
        <Show when={props.onReject && props.item.status === "pending"}>
          <Tooltip value="Reject" placement="top">
            <IconButton
              icon="circle-x"
              size="small"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                props.onReject?.()
              }}
            />
          </Tooltip>
        </Show>
      </div>
    </button>
  )
}

export function ReviewQueue(props: ReviewQueueProps) {
  const language = useLanguage()
  const [filter, setFilter] = createSignal<ReviewStatus | "all">("all")

  const filteredItems = createMemo(() => {
    const f = filter()
    const items = f === "all" ? props.items : props.items.filter((i) => i.status === f)
    return [...items].sort((a, b) => b.lastActivity - a.lastActivity)
  })

  const pendingCount = createMemo(() => props.items.filter((i) => i.status === "pending").length)
  const unreadCount = createMemo(() => props.items.filter((i) => i.unread).length)

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-3 py-2 border-b border-border-base">
        <div class="flex items-center gap-2">
          <span class="text-13-medium text-text-strong">Reviews</span>
          <Show when={pendingCount() > 0}>
            <span class="px-1.5 py-0.5 text-10-medium bg-accent-yellow/20 text-accent-yellow rounded-full">
              {pendingCount()}
            </span>
          </Show>
        </div>
        <div class="flex items-center gap-1">
          <For each={(["all", "pending", "approved", "rejected"] as const)}>
            {(status) => (
              <button
                type="button"
                class="px-2 py-1 text-11-regular rounded-md transition-colors"
                classList={{
                  "bg-surface-raised-base text-text-strong": filter() === status,
                  "text-text-weak hover:text-text-base": filter() !== status,
                }}
                onClick={() => setFilter(status)}
              >
                {status === "all" ? "All" : statusLabels[status]}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto">
        <Show
          when={filteredItems().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center h-32 text-text-weak">
              <span class="text-14-regular">
                {props.loading ? "Loading..." : "No reviews"}
              </span>
            </div>
          }
        >
          <div class="p-1.5 flex flex-col gap-0.5">
            <For each={filteredItems()}>
              {(item) => (
                <ReviewQueueItemComponent
                  item={item}
                  onClick={() => props.onItemClick(item)}
                  onApprove={props.onApprove ? () => props.onApprove!(item.id) : undefined}
                  onReject={props.onReject ? () => props.onReject!(item.id) : undefined}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
