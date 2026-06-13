# MiMo Code Desktop GUI 实施方案

> 参考 OpenAI Codex Desktop App 三栏布局，为 MiMo Code 构建专业级桌面 GUI

---

## 目录

1. [总体架构设计](#1-总体架构设计)
2. [模块架构与包结构](#2-模块架构与包结构)
3. [组件拆解](#3-组件拆解)
4. [数据流设计](#4-数据流设计)
5. [API 集成](#5-api-集成)
6. [状态管理](#6-状态管理)
7. [路由设计](#7-路由设计)
8. [分阶段实施计划](#8-分阶段实施计划)
9. [文件结构](#9-文件结构)
10. [技术决策与风险](#10-技术决策与风险)

---

## 1. 总体架构设计

### 1.1 三栏布局概览

```
+-------------------+----------------------------+------------------+
|    SIDEBAR        |     MAIN WORKSPACE         |  SUMMARY PANE    |
|    (左侧边栏)     |     (主工作区)              |  (右侧摘要面板)  |
|    240px 固定     |     flex-1 自适应           |  320px 可折叠    |
|                   |                            |                  |
|  ┌─────────────┐  |  ┌──────────────────────┐  |  ┌────────────┐  |
|  │ Project Nav │  |  │    Composer          │  |  │ Agent Plan │  |
|  │ - 项目列表  │  |  │    (Prompt Input)    │  |  │ 任务树     │  |
|  │ - 最近项目  │  |  ├──────────────────────┤  |  ├────────────┤  |
|  ├─────────────┤  |  │    Chat Output       │  |  │ Sources    │  |
|  │ Thread List │  |  │    (Streaming)       │  |  │ 引用文件   │  |
|  │ - 会话列表  │  |  │    - 推理过程        │  |  ├────────────┤  |
|  │ - 搜索过滤  │  |  │    - 工具调用        │  |  │ Artifacts  │  |
|  ├─────────────┤  |  │    - 文件编辑        │  |  │ 产物列表   │  |
|  │ Navigation  │  |  ├──────────────────────┤  |  │ - diff     │  |
|  │ - Tasks     │  |  │    Code Diff Viewer  │  |  │ - files    │  |
|  │ - Memory    │  |  │    (Unified Diff)    │  |  │ - terminal │  |
|  │ - Settings  │  |  ├──────────────────────┤  |  └────────────┘  |
|  └─────────────┘  |  │    Terminal Tabs     │  |                  |
|                   |  │    (Multi PTY)       │  |                  |
+-------------------+----------------------------+------------------+
```

### 1.2 架构分层

```
┌─────────────────────────────────────────────────────┐
│                 Electron Shell                       │
│  packages/desktop                                    │
│  ┌───────────────────────────────────────────────┐  │
│  │              Web App (packages/app)            │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │           UI Layer (packages/ui)         │  │  │
│  │  │  SolidJS Components + Tailwind + Kobalte │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │         State Layer (stores/)            │  │  │
│  │  │  SolidJS Signals + createEffect          │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │        Service Layer (services/)         │  │  │
│  │  │  SDK Client + WebSocket + IPC            │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                        ↕ HTTP/WS/IPC                 │
│  ┌───────────────────────────────────────────────┐  │
│  │        Core Engine (packages/opencode)         │  │
│  │  Hono HTTP Server + OpenAPI + Event Bus        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 1.3 通信协议

| 通信方式 | 用途 | 实现 |
|---------|------|------|
| HTTP REST | CRUD 操作（会话、消息、配置） | SDK 自动生成客户端 |
| SSE (Server-Sent Events) | 流式消息、推理过程、工具调用 | `EventSource` / fetch stream |
| WebSocket | 实时事件（状态变更、通知） | `ws` 库 + 事件总线桥接 |
| Electron IPC | 桌面特有功能（菜单、通知、文件对话） | `ipcMain` / `ipcRenderer` |

---

## 2. 模块架构与包结构

### 2.1 现有包依赖关系

```
packages/desktop  →  packages/app  →  packages/ui
                      packages/app  →  packages/sdk (API 客户端)
                      packages/app  →  packages/shared (工具函数)
packages/opencode (独立运行，提供 HTTP Server)
```

### 2.2 扩展策略

**核心原则：扩展现有包，而非创建新包。**

- **packages/app/src/** — 新增页面级组件和布局组件
- **packages/ui/src/components/** — 新增可复用 UI 组件
- **packages/app/src/stores/** — 新增全局状态管理（SolidJS signals）
- **packages/app/src/services/** — 新增 SDK 封装和 WebSocket 客户端
- **packages/desktop/src/** — 扩展 Electron 主进程能力

### 2.3 新增模块清单

| 模块 | 路径 | 职责 |
|------|------|------|
| Layout Shell | `packages/app/src/components/layout/` | 三栏布局容器 |
| Sidebar | `packages/app/src/components/sidebar/` | 左侧导航 |
| Workspace | `packages/app/src/components/workspace/` | 主工作区 |
| Summary Pane | `packages/app/src/components/summary/` | 右侧摘要 |
| Composer | `packages/app/src/components/composer/` | 提示输入框 |
| Chat View | `packages/app/src/components/chat/` | 对话/输出流 |
| Diff Viewer | `packages/app/src/components/diff/` | 代码差异查看 |
| Terminal | `packages/app/src/components/terminal/` | 终端实例 |
| Task Tree | `packages/app/src/components/task/` | 任务树可视化 |
| Memory Panel | `packages/app/src/components/memory/` | 记忆面板 |
| Review Queue | `packages/app/src/components/review/` | 审查队列 |
| Stores | `packages/app/src/stores/` | 全局状态 |
| Services | `packages/app/src/services/` | API 服务层 |

---

## 3. 组件拆解

### 3.1 布局组件 (Layout Shell)

```typescript
// packages/app/src/components/layout/desktop-layout.tsx

interface DesktopLayoutProps {
  sidebar?: Component<{}>
  summary?: Component<{}>
  children: JSX.Element
  sidebarWidth?: number      // 默认 240
  summaryWidth?: number      // 默认 320
  sidebarCollapsed?: boolean
  summaryCollapsed?: boolean
}
```

**实现要点：**
- 使用 CSS Grid 实现三栏布局：`grid-template-columns: auto 1fr auto`
- 侧边栏支持拖拽调整宽度（`resize` handle）
- 右侧面板可折叠，折叠后仅显示图标栏
- 响应式断点：窄屏时侧边栏自动折叠为图标模式
- 使用 `@solidjs/router` 的 `<Outlet>` 嵌套路由

```typescript
// 布局骨架
export function DesktopLayout(props: DesktopLayoutProps) {
  return (
    <div class="h-screen w-screen grid grid-cols-[auto_1fr_auto] overflow-hidden bg-surface-primary">
      <Sidebar width={props.sidebarWidth} collapsed={props.sidebarCollapsed} />
      <main class="flex flex-col overflow-hidden">
        {props.children}
      </main>
      <SummaryPane width={props.summaryWidth} collapsed={props.summaryCollapsed} />
    </div>
  )
}
```

### 3.2 左侧边栏 (Sidebar)

#### 3.2.1 SidebarContainer

```typescript
interface SidebarProps {
  width?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
}
```

**子组件结构：**

```
SidebarContainer
├── SidebarHeader          // 项目名称 + 设置入口
├── SidebarNav             // Tab 导航（Threads / Tasks / Memory）
├── SidebarContent         // 根据选中 Tab 切换
│   ├── ThreadList         // 会话列表
│   │   ├── ThreadSearchBar
│   │   ├── ThreadItem
│   │   └── ThreadGroup    // 按日期分组
│   ├── TaskListView       // 任务列表
│   └── MemoryNav          // 记忆导航
└── SidebarFooter          // 版本信息 + 快捷操作
```

#### 3.2.2 ThreadList 组件

```typescript
interface ThreadListProps {
  threads: Accessor<Thread[]>
  activeThreadId: Accessor<string | null>
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onSearch: (query: string) => void
}

interface Thread {
  id: string
  title: string
  updatedAt: number
  messageCount: number
  agentType: 'build' | 'plan' | 'compose'
  status: 'active' | 'completed' | 'error'
}
```

**实现要点：**
- 使用 `virtua` 虚拟滚动处理大量会话
- 支持按日期分组（今天 / 昨天 / 本周 / 更早）
- 右键菜单：重命名、删除、置顶、导出
- 拖拽排序（`@thisbeyond/solid-dnd` 或原生 Drag API）
- 搜索使用 `fuzzysort` 进行模糊匹配

#### 3.2.3 ThreadItem 组件

```typescript
interface ThreadItemProps {
  thread: Thread
  active: boolean
  onSelect: () => void
  onDelete: () => void
}
```

- 显示：标题、最后消息预览、时间、agent 类型标签、状态指示器
- 悬停显示操作按钮（删除、更多）
- 活跃会话左侧有高亮条

### 3.3 主工作区 (Workspace)

#### 3.3.1 WorkspaceContainer

主工作区是核心交互区域，包含多个可切换的视图：

```
WorkspaceContainer
├── WorkspaceHeader        // 面包屑 + Agent 切换 + 操作按钮
├── ComposerPanel          // 提示输入区（顶部固定）
├── ChatView               // 主要内容区（可滚动）
│   ├── MessageList
│   │   ├── UserMessage
│   │   ├── AssistantMessage
│   │   │   ├── ReasoningBlock    // 推理过程（可折叠）
│   │   │   ├── TextContent       // Markdown 渲染
│   │   │   ├── ToolCallBlock     // 工具调用展示
│   │   │   │   ├── FileReadTool
│   │   │   │   ├── FileEditTool  // 内联 diff
│   │   │   │   ├── ShellTool     // 命令 + 输出
│   │   │   │   └── SearchTool    // 搜索结果
│   │   │   └── CodeBlock         // 代码块（带语法高亮）
│   │   └── SystemMessage
│   └── StreamingIndicator        // 打字动画
├── DiffViewTab            // 可切换：Diff 视图
└── TerminalTab            // 可切换：终端视图
```

#### 3.3.2 Composer 组件

```typescript
interface ComposerProps {
  onSubmit: (message: string, attachments: Attachment[]) => void
  onAbort: () => void
  disabled?: boolean
  placeholder?: string
  agentType: Accessor<'build' | 'plan' | 'compose'>
  onAgentSwitch: (type: 'build' | 'plan' | 'compose') => void
}

interface Attachment {
  type: 'file' | 'image' | 'selection'
  path?: string
  content?: string
  range?: { startLine: number; endLine: number }
}
```

**功能特性：**
- **@文件搜索**：输入 `@` 触发文件搜索下拉，使用 fuzzysort 匹配
- **斜杠命令**：输入 `/` 触发命令列表（/goal, /voice, /dream, /distill 等）
- **语音输入**：集成 TenVAD + MiMo ASR 语音识别
- **附件支持**：拖拽文件、粘贴图片、选中代码段
- **Agent 切换**：Tab 键在 build/plan/compose 间切换
- **多行输入**：Shift+Enter 换行，Enter 发送
- **历史命令**：上下箭头浏览历史

**实现架构：**

```typescript
export function Composer(props: ComposerProps) {
  const [input, setInput] = createSignal('')
  const [attachments, setAttachments] = createSignal<Attachment[]>([])
  const [mentionOpen, setMentionOpen] = createSignal(false)
  const [commandOpen, setCommandOpen] = createSignal(false)

  // 使用 contenteditable div 而非 textarea，支持富文本
  // 或使用 textarea + overlay 实现 @mention 高亮
  return (
    <div class="border-t border-border-subtle bg-surface-secondary">
      <MentionDropdown open={mentionOpen()} onSelect={handleMentionSelect} />
      <CommandDropdown open={commandOpen()} onSelect={handleCommandSelect} />
      <AttachmentList attachments={attachments()} onRemove={removeAttachment} />
      <div class="flex items-end gap-2 p-3">
        <textarea
          class="flex-1 resize-none bg-transparent ..."
          value={input()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (@ 文件, / 命令)"
        />
        <AgentSwitcher type={props.agentType} onSwitch={props.onAgentSwitch} />
        <SendButton onClick={handleSubmit} disabled={props.disabled} />
      </div>
    </div>
  )
}
```

#### 3.3.3 ChatView 组件

```typescript
interface ChatViewProps {
  messages: Accessor<Message[]>
  isStreaming: Accessor<boolean>
  onRetry: (messageId: string) => void
  onEdit: (messageId: string, content: string) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  toolCalls?: ToolCall[]
  timestamp: number
  status: 'pending' | 'streaming' | 'complete' | 'error'
}

interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string
  status: 'pending' | 'running' | 'complete' | 'error'
}
```

**消息渲染策略：**
- 使用 `marked` + `shiki` 渲染 Markdown 和代码高亮
- 使用 `@pierre/diffs` 渲染文件编辑内联 diff
- 工具调用默认折叠，点击展开详情
- 推理过程默认折叠，可全局设置展开
- 使用 `virtua` 虚拟滚动处理长会话
- 流式消息使用增量渲染，避免全量重绘

#### 3.3.4 ToolCallBlock 组件

```typescript
interface ToolCallBlockProps {
  toolCall: ToolCall
  expanded?: boolean
}

// 根据工具类型渲染不同内容
function ToolCallRenderer(props: ToolCallBlockProps) {
  switch (props.toolCall.name) {
    case 'file_read':
      return <FileReadView content={props.toolCall.result} />
    case 'file_edit':
      return <InlineDiffView diff={props.toolCall.result} />
    case 'shell':
      return <ShellOutputView command={props.toolCall.args.command} output={props.toolCall.result} />
    case 'glob':
    case 'grep':
      return <SearchResultsView results={props.toolCall.result} />
    default:
      return <GenericToolView toolCall={props.toolCall} />
  }
}
```

### 3.4 Diff Viewer

```typescript
interface DiffViewerProps {
  files: Accessor<DiffFile[]>
  onApprove: (fileId: string) => void
  onReject: (fileId: string) => void
  onComment: (fileId: string, line: number, comment: string) => void
}

interface DiffFile {
  id: string
  path: string
  oldContent: string
  newContent: string
  hunks: DiffHunk[]
  status: 'added' | 'modified' | 'deleted' | 'renamed'
}
```

**实现要点：**
- 使用 `@pierre/diffs` 库计算 unified diff
- 支持行内评论（点击行号添加）
- 语法高亮使用 `shiki`
- 支持 side-by-side 和 unified 两种视图模式
- 底部显示变更统计（+N / -N）

### 3.5 Terminal 组件

```typescript
interface TerminalTabsProps {
  sessions: Accessor<TerminalSession[]>
  activeSessionId: Accessor<string>
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onNew: () => void
}

interface TerminalSession {
  id: string
  title: string
  cwd: string
  status: 'running' | 'exited'
}
```

**实现要点：**
- 使用 `xterm.js` + `xterm-addon-fit` 渲染终端
- 通过 WebSocket 或 Electron IPC 连接到后端 PTY
- 支持多标签页，每个标签独立 PTY 实例
- 支持分屏（水平/垂直）
- 终端输出支持搜索（Ctrl+F）

### 3.6 右侧摘要面板 (Summary Pane)

```typescript
interface SummaryPaneProps {
  width?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
}
```

**子组件结构：**

```
SummaryPane
├── SummaryHeader          // 标题 + 折叠按钮
├── SummaryTabs            // Tab 切换
│   ├── AgentPlanTab       // Agent 计划
│   │   └── TaskTreeView   // 任务树
│   ├── SourcesTab         // 引用来源
│   │   └── SourceList     // 文件/URL 列表
│   └── ArtifactsTab       // 产物
│       ├── ArtifactList   // 产物列表
│       └── ArtifactPreview // 预览
└── SummaryFooter          // 统计信息
```

### 3.7 TaskTreeView 组件

```typescript
interface TaskTreeViewProps {
  tasks: Accessor<TaskNode[]>
  onExpand: (taskId: string) => void
  onSelect: (taskId: string) => void
}

interface TaskNode {
  id: string           // T1, T1.1, T1.2
  summary: string
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'abandoned'
  parent?: string
  children: TaskNode[]
  eventSummary?: string
  depth: number
}
```

**实现要点：**
- 树形结构渲染，支持展开/折叠
- 状态用颜色标识：绿色(done)、蓝色(in_progress)、红色(blocked)、灰色(open)
- 活跃任务有脉冲动画
- 支持拖拽重新排序

### 3.8 MemoryPanel 组件

```typescript
interface MemoryPanelProps {
  memory: Accessor<MemoryContent>
  onEdit: (section: string, content: string) => void
}

interface MemoryContent {
  projectMemory: string     // MEMORY.md
  sessionCheckpoint: string // checkpoint.md
  notes: string            // notes.md
  taskProgress: Record<string, string>  // tasks/<id>/progress.md
}
```

**功能：**
- 分 Tab 展示：Project Memory / Session / Notes / Tasks
- Markdown 渲染 + 编辑模式切换
- 搜索功能（跨所有记忆文件）
- 编辑使用 Monaco Editor 或 CodeMirror

### 3.9 ReviewQueue 组件

```typescript
interface ReviewQueueProps {
  reviews: Accessor<ReviewItem[]>
  onApprove: (id: string) => void
  onRevise: (id: string, feedback: string) => void
  onReject: (id: string, reason: string) => void
}

interface ReviewItem {
  id: string
  sessionId: string
  title: string
  files: DiffFile[]
  agentReasoning: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
}
```

---

## 4. 数据流设计

### 4.1 整体数据流

```
用户输入 (Composer)
    ↓
SDK Client (HTTP POST /session/:id/message)
    ↓
Core Engine (packages/opencode)
    ├── Agent 处理 → 流式响应 (SSE)
    ├── 工具调用 → 结果回传
    ├── 文件编辑 → Diff 生成
    └── 事件广播 (Event Bus → WebSocket)
    ↓
GUI 更新
    ├── ChatView 实时渲染流式消息
    ├── DiffViewer 显示文件变更
    ├── TaskTree 更新任务状态
    └── SummaryPane 更新摘要
```

### 4.2 SDK 客户端封装

```typescript
// packages/app/src/services/api-client.ts

import { createClient } from '@mimo-ai/sdk'

export function createApiClient(baseUrl: string) {
  const client = createClient({ baseUrl })

  return {
    // 会话管理
    session: {
      list: () => client.GET('/session'),
      get: (id: string) => client.GET('/session/{id}', { params: { id } }),
      create: (data: CreateSessionRequest) => client.POST('/session', { body: data }),
      delete: (id: string) => client.DELETE('/session/{id}', { params: { id } }),
      abort: (id: string) => client.POST('/session/{id}/abort', { params: { id } }),
    },
    // 消息
    message: {
      list: (sessionId: string) => client.GET('/session/{id}/message', { params: { id: sessionId } }),
      send: (sessionId: string, content: string, attachments?: Attachment[]) =>
        client.POST('/session/{id}/message', {
          params: { id: sessionId },
          body: { content, attachments },
        }),
    },
    // 任务
    task: {
      list: () => client.GET('/task'),
      get: (id: string) => client.GET('/task/{id}', { params: { id } }),
    },
    // 记忆
    memory: {
      get: () => client.GET('/memory'),
      search: (query: string) => client.GET('/memory/search', { params: { q: query } }),
    },
    // 配置
    config: {
      get: () => client.GET('/config'),
      update: (data: ConfigUpdate) => client.PATCH('/config', { body: data }),
    },
    // 提供者
    provider: {
      list: () => client.GET('/provider'),
    },
    // 文件
    file: {
      search: (query: string) => client.GET('/file/search', { params: { q: query } }),
      read: (path: string) => client.GET('/file/{path}', { params: { path } }),
    },
  }
}
```

### 4.3 SSE 流式消息处理

```typescript
// packages/app/src/services/stream-client.ts

export interface StreamEvent {
  type: 'message.delta' | 'tool.call' | 'tool.result' | 'reasoning.delta' | 'error' | 'done'
  data: unknown
}

export async function* streamMessage(
  sessionId: string,
  content: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`/api/session/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
    signal,
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6)) as StreamEvent
        yield event
      }
    }
  }
}
```

### 4.4 WebSocket 事件桥接

```typescript
// packages/app/src/services/event-bridge.ts

export function createEventBridge(baseUrl: string) {
  const [events, setEvents] = createSignal<StreamEvent[]>([])
  let ws: WebSocket | null = null

  function connect() {
    ws = new WebSocket(`${baseUrl.replace('http', 'ws')}/events`)

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data) as StreamEvent
      setEvents(prev => [...prev, event])

      // 分发到具体 store
      switch (event.type) {
        case 'session.updated':
          sessionStore.updateSession(event.data)
          break
        case 'task.updated':
          taskStore.updateTask(event.data)
          break
        case 'agent.status':
          agentStore.updateStatus(event.data)
          break
      }
    }

    ws.onclose = () => setTimeout(connect, 1000) // 自动重连
  }

  connect()
  return { events, disconnect: () => ws?.close() }
}
```

### 4.5 完整消息发送流程

```
1. 用户在 Composer 输入消息，按 Enter
2. Composer.onSubmit(message, attachments)
3. sessionStore.addUserMessage(message)
4. chatStore.setStreaming(true)
5. 调用 streamMessage(sessionId, message)
6. 流式处理：
   a. 'message.delta' → 增量追加到 assistantMessage
   b. 'reasoning.delta' → 更新推理块
   c. 'tool.call' → 添加工具调用卡片（pending 状态）
   d. 'tool.result' → 更新工具调用结果
   e. 'done' → chatStore.setStreaming(false)
7. 同时通过 WebSocket 接收：
   a. 'task.updated' → 更新右侧任务树
   b. 'file.changed' → 触发 DiffViewer 更新
```

---

## 5. API 集成

### 5.1 现有 HTTP API（基于 OpenAPI Spec）

MiMo Code 的 `packages/opencode/src/server/` 提供了 Hono HTTP Server，SDK 基于 `openapi.json` 自动生成客户端。

| API 端点 | 方法 | 用途 | GUI 使用场景 |
|---------|------|------|-------------|
| `/session` | GET | 列出所有会话 | 侧边栏会话列表 |
| `/session` | POST | 创建新会话 | 新建对话 |
| `/session/{id}` | GET | 获取会话详情 | 加载会话 |
| `/session/{id}` | DELETE | 删除会话 | 删除对话 |
| `/session/{id}/message` | GET | 获取消息列表 | 加载历史消息 |
| `/session/{id}/message` | POST | 发送消息（SSE） | Composer 发送 |
| `/session/{id}/abort` | POST | 中止当前操作 | 停止按钮 |
| `/task` | GET | 列出所有任务 | 任务面板 |
| `/task/{id}` | GET | 获取任务详情 | 任务详情 |
| `/memory` | GET | 获取记忆内容 | 记忆面板 |
| `/memory/search` | GET | 搜索记忆 | 记忆搜索 |
| `/config` | GET | 获取配置 | 设置页面 |
| `/config` | PATCH | 更新配置 | 保存设置 |
| `/provider` | GET | 列出 LLM 提供者 | 设置页面 |
| `/file/search` | GET | 搜索文件 | @mention 搜索 |

### 5.2 需要新增的 API

以下 API 可能需要在 `packages/opencode/src/server/` 中新增：

| API 端点 | 方法 | 用途 | 优先级 |
|---------|------|------|--------|
| `/events` | WebSocket | 实时事件流 | P0 |
| `/session/{id}/summary` | GET | 会话摘要（标题、统计） | P1 |
| `/session/{id}/diff` | GET | 会话产生的所有 diff | P0 |
| `/session/{id}/artifacts` | GET | 会话产物列表 | P1 |
| `/session/{id}/sources` | GET | 引用的文件/URL | P1 |
| `/review` | GET | 待审查列表 | P2 |
| `/review/{id}/approve` | POST | 批准变更 | P2 |
| `/review/{id}/reject` | POST | 拒绝变更 | P2 |
| `/pty` | WebSocket | 终端 PTY 连接 | P1 |
| `/skill` | GET | 可用技能列表 | P2 |

### 5.3 Electron IPC 协议

```typescript
// packages/desktop/src/ipc/channels.ts

export const IPC_CHANNELS = {
  // 窗口管理
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // 文件对话
  DIALOG_OPEN_FILE: 'dialog:open-file',
  DIALOG_SAVE_FILE: 'dialog:save-file',
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory',

  // 通知
  NOTIFICATION_SHOW: 'notification:show',

  // 菜单
  MENU_ACTION: 'menu:action',

  // 服务管理
  SERVER_START: 'server:start',
  SERVER_STOP: 'server:stop',
  SERVER_STATUS: 'server:status',
  SERVER_URL: 'server:url',

  // 自动更新
  UPDATE_CHECK: 'update:check',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_INSTALL: 'update:install',

  // 深度链接
  DEEP_LINK: 'deep-link',

  // 剪贴板
  CLIPBOARD_READ: 'clipboard:read',
  CLIPBOARD_WRITE: 'clipboard:write',
} as const
```

---

## 6. 状态管理

### 6.1 Store 架构

使用 SolidJS 的 `createStore` 和 `createSignal` 进行状态管理，按领域拆分多个 store：

```typescript
// packages/app/src/stores/index.ts

export { sessionStore } from './session-store'
export { chatStore } from './chat-store'
export { taskStore } from './task-store'
export { memoryStore } from './memory-store'
export { configStore } from './config-store'
export { uiStore } from './ui-store'
export { agentStore } from './agent-store'
```

### 6.2 Session Store

```typescript
// packages/app/src/stores/session-store.ts

import { createStore } from 'solid-js/store'

interface SessionState {
  sessions: Session[]
  activeSessionId: string | null
  loading: boolean
  error: string | null
}

const [state, setState] = createStore<SessionState>({
  sessions: [],
  activeSessionId: null,
  loading: false,
  error: null,
})

export const sessionStore = {
  state,

  async loadSessions() {
    setState('loading', true)
    try {
      const sessions = await api.session.list()
      setState('sessions', sessions)
    } catch (e) {
      setState('error', String(e))
    } finally {
      setState('loading', false)
    }
  },

  async createSession(projectPath?: string) {
    const session = await api.session.create({ projectPath })
    setState('sessions', prev => [session, ...prev])
    setState('activeSessionId', session.id)
    return session
  },

  setActiveSession(id: string) {
    setState('activeSessionId', id)
  },

  async deleteSession(id: string) {
    await api.session.delete(id)
    setState('sessions', prev => prev.filter(s => s.id !== id))
    if (state.activeSessionId === id) {
      setState('activeSessionId', state.sessions[0]?.id ?? null)
    }
  },

  get activeSession() {
    return state.sessions.find(s => s.id === state.activeSessionId)
  },
}
```

### 6.3 Chat Store

```typescript
// packages/app/src/stores/chat-store.ts

interface ChatState {
  messages: Map<string, Message[]>  // sessionId → messages
  streaming: boolean
  streamingMessageId: string | null
  abortController: AbortController | null
}

const [state, setState] = createStore<ChatState>({
  messages: new Map(),
  streaming: false,
  streamingMessageId: null,
  abortController: null,
})

export const chatStore = {
  state,

  getMessages(sessionId: string): Message[] {
    return state.messages.get(sessionId) || []
  },

  async loadMessages(sessionId: string) {
    const messages = await api.message.list(sessionId)
    setState('messages', sessionId, messages)
  },

  addUserMessage(sessionId: string, content: string) {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
      status: 'complete',
    }
    setState('messages', sessionId, prev => [...(prev || []), msg])
  },

  async sendMessage(sessionId: string, content: string) {
    this.addUserMessage(sessionId, content)

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
    }
    setState('messages', sessionId, prev => [...(prev || []), assistantMsg])
    setState('streaming', true)
    setState('streamingMessageId', assistantMsg.id)

    const abortController = new AbortController()
    setState('abortController', abortController)

    try {
      for await (const event of streamMessage(sessionId, content, abortController.signal)) {
        switch (event.type) {
          case 'message.delta':
            setState('messages', sessionId,
              m => m.id === assistantMsg.id,
              'content',
              prev => prev + event.data.text
            )
            break
          case 'reasoning.delta':
            setState('messages', sessionId,
              m => m.id === assistantMsg.id,
              'reasoning',
              prev => (prev || '') + event.data.text
            )
            break
          case 'tool.call':
            setState('messages', sessionId,
              m => m.id === assistantMsg.id,
              'toolCalls',
              prev => [...(prev || []), event.data]
            )
            break
          case 'done':
            setState('messages', sessionId,
              m => m.id === assistantMsg.id,
              'status',
              'complete'
            )
            break
        }
      }
    } finally {
      setState('streaming', false)
      setState('streamingMessageId', null)
      setState('abortController', null)
    }
  },

  abort() {
    state.abortController?.abort()
  },
}
```

### 6.4 UI Store

```typescript
// packages/app/src/stores/ui-store.ts

interface UIState {
  sidebarCollapsed: boolean
  summaryCollapsed: boolean
  sidebarWidth: number
  summaryWidth: number
  activeView: 'chat' | 'diff' | 'terminal'
  summaryTab: 'plan' | 'sources' | 'artifacts'
  sidebarTab: 'threads' | 'tasks' | 'memory'
  theme: 'light' | 'dark' | 'system'
}

const [state, setState] = createStore<UIState>({
  sidebarCollapsed: false,
  summaryCollapsed: false,
  sidebarWidth: 240,
  summaryWidth: 320,
  activeView: 'chat',
  summaryTab: 'plan',
  sidebarTab: 'threads',
  theme: 'system',
})

export const uiStore = {
  state,
  toggleSidebar: () => setState('sidebarCollapsed', v => !v),
  toggleSummary: () => setState('summaryCollapsed', v => !v),
  setActiveView: (view: UIState['activeView']) => setState('activeView', view),
  setSummaryTab: (tab: UIState['summaryTab']) => setState('summaryTab', tab),
  setSidebarTab: (tab: UIState['sidebarTab']) => setState('sidebarTab', tab),
  setTheme: (theme: UIState['theme']) => setState('theme', theme),
}
```

### 6.5 Store 间协作

```
sessionStore.activeSessionId 变更
    → chatStore.loadMessages(sessionId)
    → taskStore.loadTasks(sessionId)
    → memoryStore.loadMemory(sessionId)

eventBridge 收到 'task.updated'
    → taskStore.updateTask(data)
    → uiStore.summaryTab === 'plan' 时自动刷新

eventBridge 收到 'file.changed'
    → diffStore.addChange(data)
    → uiStore.activeView !== 'diff' 时显示通知 badge
```

---

## 7. 路由设计

### 7.1 路由结构

使用 `@solidjs/router` 进行路由管理：

```typescript
// packages/app/src/app.tsx

import { Route, Router } from '@solidjs/router'

export function App() {
  return (
    <Router>
      <Route path="/" component={DesktopLayout}>
        <Route path="/" component={HomeView} />
        <Route path="/session/:id" component={SessionView} />
        <Route path="/settings" component={SettingsView} />
        <Route path="/review" component={ReviewView} />
      </Route>
    </Router>
  )
}
```

### 7.2 页面组件

| 路由 | 组件 | 描述 |
|------|------|------|
| `/` | `HomeView` | 欢迎页 + 最近会话 + 快速操作 |
| `/session/:id` | `SessionView` | 主会话视图（三栏布局） |
| `/settings` | `SettingsView` | 设置页面（LLM、快捷键、主题） |
| `/review` | `ReviewView` | 审查队列 |

### 7.3 SessionView 内部导航

```typescript
// packages/app/src/pages/session-view.tsx

export function SessionView() {
  const params = useParams()
  const sessionId = () => params.id

  // 加载会话数据
  onMount(() => {
    sessionStore.setActiveSession(sessionId())
    chatStore.loadMessages(sessionId())
    taskStore.loadTasks()
    memoryStore.loadMemory()
  })

  return (
    <DesktopLayout
      sidebar={<SidebarContainer />}
      summary={<SummaryPane />}
    >
      <Switch>
        <Match when={uiStore.state.activeView === 'chat'}>
          <ComposerPanel />
          <ChatView />
        </Match>
        <Match when={uiStore.state.activeView === 'diff'}>
          <DiffViewer />
        </Match>
        <Match when={uiStore.state.activeView === 'terminal'}>
          <TerminalTabs />
        </Match>
      </Switch>
    </DesktopLayout>
  )
}
```

---

## 8. 分阶段实施计划

### Phase 1: 基础骨架（2-3 周）

**目标：** 搭建三栏布局框架，实现基本会话功能

| 任务 | 估时 | 交付物 |
|------|------|--------|
| 搭建 monorepo 开发环境 | 2d | 可运行的 dev 环境 |
| 实现 DesktopLayout 三栏容器 | 2d | 可拖拽调整宽度的三栏布局 |
| 实现 SidebarContainer + SidebarNav | 2d | 可切换 Tab 的侧边栏 |
| 实现 ThreadList + ThreadItem | 2d | 会话列表（静态数据） |
| 实现 Composer 基础版 | 3d | 多行输入 + 发送按钮 |
| 实现 ChatView 基础版 | 3d | Markdown 渲染 + 流式输出 |
| 集成 SDK Client | 2d | 连接后端 API |
| 实现 SSE 流式消息 | 2d | 实时流式对话 |
| Electron 窗口基础配置 | 1d | 可启动的桌面窗口 |

**里程碑：** 可以在桌面应用中进行基本的 AI 对话

---

### Phase 2: 核心功能（3-4 周）

**目标：** 完善对话体验，添加 Diff 查看和终端

| 任务 | 估时 | 交付物 |
|------|------|--------|
| 实现 ToolCallBlock 各类型 | 3d | 文件读取、编辑、Shell 调用展示 |
| 实现 InlineDiffView | 3d | 内联 diff 渲染 |
| 实现独立 DiffViewer | 3d | 统一 diff 视图 + 语法高亮 |
| 实现 TerminalTabs + xterm.js | 3d | 多标签终端 |
| 实现 @mention 文件搜索 | 2d | Composer 中的文件搜索 |
| 实现斜杠命令 | 2d | Composer 中的命令列表 |
| Agent 切换（build/plan/compose） | 1d | Tab 键切换 agent |
| 实现 WebSocket 事件桥接 | 2d | 实时状态同步 |
| 消息操作（重试、编辑、复制） | 2d | 右键菜单 + 操作按钮 |

**里程碑：** 完整的对话 + 代码编辑 + 终端体验

---

### Phase 3: 高级面板（2-3 周）

**目标：** 实现右侧摘要面板和任务追踪

| 任务 | 估时 | 交付物 |
|------|------|--------|
| 实现 SummaryPane 容器 | 1d | 可折叠右侧面板 |
| 实现 TaskTreeView | 3d | 树形任务可视化 |
| 实现 SourcesTab | 2d | 引用文件列表 |
| 实现 ArtifactsTab | 2d | 产物列表 + 预览 |
| 实现 AgentPlanTab | 2d | Agent 计划展示 |
| 实现 MemoryPanel | 3d | 记忆查看/编辑 |
| 新增 /diff, /artifacts, /sources API | 2d | 后端 API 支持 |

**里程碑：** 完整的三栏布局 + 任务追踪 + 记忆管理

---

### Phase 4: 审查与工作流（2 周）

**目标：** 实现代码审查流程和工作流集成

| 任务 | 估时 | 交付物 |
|------|------|--------|
| 实现 ReviewQueue | 3d | 审查列表 + 状态管理 |
| 实现行内评论 | 2d | Diff 中添加评论 |
| 实现批准/拒绝/修改工作流 | 2d | 审查操作按钮 |
| 新增 /review API | 2d | 后端审查 API |
| 实现权限请求弹窗 | 1d | 工具调用权限确认 |

**里程碑：** 完整的代码审查工作流

---

### Phase 5: 桌面体验优化（2 周）

**目标：** 完善 Electron 桌面体验

| 任务 | 估时 | 交付物 |
|------|------|--------|
| 系统托盘 + 快捷键 | 2d | 全局快捷键、托盘菜单 |
| 自动更新机制 | 2d | electron-updater 集成 |
| 深度链接处理 | 1d | mimocode:// 协议 |
| 系统通知集成 | 1d | 任务完成通知 |
| 本地服务管理 | 2d | 自动启动/停止 opencode server |
| 多窗口支持 | 2d | 多项目多窗口 |
| 性能优化 | 2d | 虚拟滚动、懒加载、内存优化 |

**里程碑：** 生产级桌面应用体验

---

### Phase 6: 打磨与发布（1-2 周）

**目标：** 最终打磨和发布准备

| 任务 | 估时 | 交付物 |
|------|------|--------|
| 主题系统（亮色/暗色） | 2d | 完整的主题切换 |
| 国际化 (i18n) | 2d | 中英文支持 |
| 错误边界 + 降级处理 | 1d | 优雅的错误处理 |
| E2E 测试 | 3d | Playwright 测试覆盖 |
| 打包与分发 | 2d | macOS/Windows/Linux 安装包 |
| 文档与 README | 1d | 用户文档 |

**里程碑：** 可发布的 v1.0

---

## 9. 文件结构

### 9.1 packages/app/src 新增文件

```
packages/app/src/
├── components/
│   ├── layout/
│   │   ├── desktop-layout.tsx         # 三栏布局容器
│   │   ├── layout-resizer.tsx         # 拖拽调整宽度
│   │   └── layout.module.css
│   ├── sidebar/
│   │   ├── sidebar-container.tsx      # 侧边栏容器
│   │   ├── sidebar-header.tsx         # 项目标题 + 设置
│   │   ├── sidebar-nav.tsx            # Tab 导航
│   │   ├── sidebar-footer.tsx         # 底部信息
│   │   ├── thread-list.tsx            # 会话列表
│   │   ├── thread-item.tsx            # 会话项
│   │   ├── thread-search.tsx          # 搜索框
│   │   └── thread-group.tsx           # 日期分组
│   ├── workspace/
│   │   ├── workspace-container.tsx    # 主工作区容器
│   │   ├── workspace-header.tsx       # 面包屑 + 操作
│   │   └── workspace-tabs.tsx         # Chat/Diff/Terminal 切换
│   ├── composer/
│   │   ├── composer.tsx               # 输入框主体
│   │   ├── mention-dropdown.tsx        # @文件搜索下拉
│   │   ├── command-dropdown.tsx        # /命令下拉
│   │   ├── attachment-list.tsx         # 附件列表
│   │   ├── agent-switcher.tsx          # Agent 切换器
│   │   └── voice-button.tsx            # 语音输入按钮
│   ├── chat/
│   │   ├── chat-view.tsx              # 对话视图容器
│   │   ├── message-list.tsx           # 消息列表（虚拟滚动）
│   │   ├── user-message.tsx           # 用户消息气泡
│   │   ├── assistant-message.tsx      # 助手消息
│   │   ├── reasoning-block.tsx        # 推理过程块
│   │   ├── tool-call-block.tsx        # 工具调用块
│   │   ├── tool-call-renderer.tsx     # 工具调用渲染器
│   │   ├── code-block.tsx             # 代码块
│   │   ├── markdown-renderer.tsx      # Markdown 渲染
│   │   └── streaming-indicator.tsx    # 流式指示器
│   ├── diff/
│   │   ├── diff-viewer.tsx            # Diff 查看器
│   │   ├── diff-file-list.tsx         # 变更文件列表
│   │   ├── diff-hunk.tsx              # Diff Hunk
│   │   ├── diff-line.tsx              # Diff 行
│   │   ├── inline-comment.tsx         # 行内评论
│   │   └── diff-stats.tsx             # 变更统计
│   ├── terminal/
│   │   ├── terminal-tabs.tsx          # 终端标签页
│   │   ├── terminal-instance.tsx      # xterm.js 实例
│   │   └── terminal-toolbar.tsx       # 终端工具栏
│   ├── summary/
│   │   ├── summary-pane.tsx           # 右侧面板容器
│   │   ├── summary-header.tsx         # 标题 + 折叠
│   │   ├── summary-tabs.tsx           # Tab 切换
│   │   ├── agent-plan-tab.tsx         # Agent 计划
│   │   ├── sources-tab.tsx            # 引用来源
│   │   └── artifacts-tab.tsx          # 产物列表
│   ├── task/
│   │   ├── task-tree-view.tsx         # 任务树
│   │   ├── task-node.tsx              # 任务节点
│   │   └── task-status-badge.tsx      # 状态徽章
│   ├── memory/
│   │   ├── memory-panel.tsx           # 记忆面板
│   │   ├── memory-editor.tsx          # 记忆编辑器
│   │   └── memory-search.tsx          # 记忆搜索
│   ├── review/
│   │   ├── review-queue.tsx           # 审查队列
│   │   ├── review-item.tsx            # 审查项
│   │   ├── review-actions.tsx         # 操作按钮
│   │   └── review-diff.tsx            # 审查 diff
│   └── common/
│       ├── status-indicator.tsx       # 状态指示器
│       ├── loading-spinner.tsx         # 加载动画
│       ├── empty-state.tsx            # 空状态
│       ├── error-boundary.tsx         # 错误边界
│       └── confirm-dialog.tsx         # 确认对话框
├── stores/
│   ├── index.ts                       # Store 导出
│   ├── session-store.ts               # 会话状态
│   ├── chat-store.ts                  # 对话状态
│   ├── task-store.ts                  # 任务状态
│   ├── memory-store.ts                # 记忆状态
│   ├── config-store.ts                # 配置状态
│   ├── ui-store.ts                    # UI 状态
│   ├── agent-store.ts                 # Agent 状态
│   └── diff-store.ts                  # Diff 状态
├── services/
│   ├── api-client.ts                  # SDK 客户端封装
│   ├── stream-client.ts               # SSE 流式客户端
│   ├── event-bridge.ts                # WebSocket 事件桥
│   ├── pty-client.ts                  # PTY 终端客户端
│   └── ipc-client.ts                  # Electron IPC 客户端
├── hooks/
│   ├── use-session.ts                 # 会话相关 hook
│   ├── use-chat.ts                    # 对话相关 hook
│   ├── use-keyboard.ts                # 键盘快捷键
│   ├── use-resize.ts                  # 拖拽调整大小
│   └── use-auto-scroll.ts             # 自动滚动
├── pages/
│   ├── home-view.tsx                  # 首页
│   ├── session-view.tsx               # 会话页
│   ├── settings-view.tsx              # 设置页
│   └── review-view.tsx                # 审查页
└── app.tsx                            # 路由配置（更新）
```

### 9.2 packages/ui/src 新增组件

```
packages/ui/src/components/
├── code-editor/
│   └── code-editor.tsx                # 通用代码编辑器
├── tree-view/
│   └── tree-view.tsx                  # 通用树形组件
├── tabs/
│   └── tab-group.tsx                  # 通用标签组
├── badge/
│   └── status-badge.tsx               # 状态徽章
├── tooltip/
│   └── info-tooltip.tsx               # 信息提示
└── context-menu/
    └── context-menu.tsx               # 右键菜单
```

### 9.3 packages/desktop/src 扩展

```
packages/desktop/src/
├── main/
│   ├── index.ts                       # 主进程入口（更新）
│   ├── window.ts                      # 窗口管理（更新）
│   ├── ipc.ts                         # IPC 处理（更新）
│   ├── menu.ts                        # 应用菜单（新增）
│   ├── tray.ts                        # 系统托盘（新增）
│   ├── updater.ts                     # 自动更新（新增）
│   ├── deep-link.ts                   # 深度链接（新增）
│   └── server-manager.ts              # 服务管理（新增）
├── preload/
│   └── index.ts                       # 预加载脚本（更新）
└── renderer/
    └── (由 packages/app 提供)
```

### 9.4 packages/opencode/src/server 扩展

```
packages/opencode/src/server/
├── routes/
│   ├── session.ts                     # 更新：添加 diff/artifacts API
│   ├── review.ts                      # 新增：审查 API
│   ├── events.ts                      # 新增：WebSocket 事件
│   └── pty.ts                         # 新增：PTY WebSocket
```

---

## 10. 技术决策与风险

### 10.1 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 终端方案 | xterm.js | 行业标准，Electron 生态成熟 |
| 代码编辑器 | Monaco Editor（可选） | 如果需要内联编辑能力 |
| Diff 渲染 | @pierre/diffs + 自定义渲染 | 项目已有此依赖 |
| Markdown | marked + shiki | 项目已有此依赖 |
| 虚拟滚动 | virtua | 项目已有此依赖 |
| 拖拽排序 | @thisbeyond/solid-dnd | SolidJS 生态最成熟的拖拽库 |
| 图标 | Lucide Solid | 与现有 UI 一致 |
| 动画 | @motionone/solid | 项目已有 Motion 依赖 |

### 10.2 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| SDK API 不完整 | 部分 GUI 功能无法实现 | 优先补齐 P0 API，Phase 1 用 mock 数据 |
| 大量消息性能问题 | 滚动卡顿 | 虚拟滚动 + 消息分页加载 |
| SSE 连接不稳定 | 流式中断 | 自动重连 + 断点续传 |
| Electron 内存占用 | 长时间使用内存增长 | 定期清理、虚拟滚动、懒加载 |
| SolidJS 生态组件少 | 需要自建大量组件 | 优先扩展现有 packages/ui |
| 跨平台差异 | macOS/Windows/Linux 表现不一致 | 每阶段进行跨平台测试 |

### 10.3 依赖新增清单

```json
{
  "dependencies": {
    "xterm": "^5.5.0",
    "xterm-addon-fit": "^0.10.0",
    "xterm-addon-search": "^0.15.0",
    "@thisbeyond/solid-dnd": "^0.7.0",
    "@codemirror/view": "^6.35.0",
    "@codemirror/state": "^6.5.0",
    "monaco-editor": "^0.52.0"
  }
}
```

---

## 附录 A: 快捷键设计

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl+N` | 新建会话 |
| `Cmd/Ctrl+K` | 快速搜索（会话/文件/命令） |
| `Cmd/Ctrl+B` | 切换侧边栏 |
| `Cmd/Ctrl+Shift+B` | 切换右侧面板 |
| `Cmd/Ctrl+1/2/3` | 切换 Chat/Diff/Terminal 视图 |
| `Cmd/Ctrl+Enter` | 发送消息 |
| `Cmd/Ctrl+Shift+Enter` | 新行（在 Composer 中） |
| `Tab` | 切换 Agent (build→plan→compose) |
| `Escape` | 中止当前操作 / 关闭弹窗 |
| `Cmd/Ctrl+,` | 打开设置 |
| `Cmd/Ctrl+Shift+P` | 命令面板 |

## 附录 B: 主题色彩方案

```css
/* 暗色主题（默认） */
--surface-primary: #0d1117;
--surface-secondary: #161b22;
--surface-tertiary: #21262d;
--border-subtle: #30363d;
--border-default: #484f58;
--text-primary: #e6edf3;
--text-secondary: #8b949e;
--accent-blue: #58a6ff;
--accent-green: #3fb950;
--accent-red: #f85149;
--accent-yellow: #d29922;

/* 亮色主题 */
--surface-primary: #ffffff;
--surface-secondary: #f6f8fa;
--surface-tertiary: #eaeef2;
--border-subtle: #d0d7de;
--border-default: #afb8c1;
--text-primary: #1f2328;
--text-secondary: #656d76;
```

---

> **文档版本**: v1.0
> **创建日期**: 2026-06-12
> **预计总工期**: 12-16 周（6 个阶段）
> **团队规模建议**: 2-3 名前端工程师 + 1 名后端工程师
