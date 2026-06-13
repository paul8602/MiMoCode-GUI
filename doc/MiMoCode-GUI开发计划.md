# MiMo Code 桌面 GUI 版本开发计划

> 参考 OpenAI Codex Desktop App 设计，基于 MiMo Code 现有架构构建

---

## 1. 项目概述

### 1.1 目标

为 MiMo Code（小米开源 AI 编程助手）设计并开发桌面 GUI 版本，采用类似 OpenAI Codex Desktop App 的三栏布局模式，提供可视化的 AI 编程体验。

### 1.2 设计参考

OpenAI Codex Desktop App 的核心设计：
- **三栏布局**：左侧边栏（项目/线程管理）、中间主工作区（对话/代码/终端）、右侧面板（Agent 计划/源文件/产物）
- **Composer 驱动**：底部输入栏支持 `@` 文件引用、`$` 技能调用、语音输入、slash commands
- **Review-centric 工作流**：Agent 输出 → Diff 审查 → Approve/Revise/Reject
- **多线程并行**：多个 Agent 任务同时执行，各自隔离

### 1.3 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **Web 框架** | SolidJS v1.9 + Vite v7.1 | 复用 MiMo Code packages/app |
| **桌面壳** | Electron v41.2 + electron-vite | 复用 MiMo Code packages/desktop |
| **UI 组件** | Kobalte v0.13 + Tailwind CSS v4.1 | 复用 packages/ui |
| **语法高亮** | Shiki | 代码块和 Diff 高亮 |
| **Markdown 渲染** | Marked | Agent 输出渲染 |
| **虚拟滚动** | Virtua | 长列表性能优化 |
| **动画** | Motion (Framer Motion) | 过渡动画 |
| **后端通信** | @mimo-ai/sdk (OpenAPI) | 与 MiMo Code 引擎通信 |
| **后端引擎** | @mimo-ai/cli (Hono server) | Agent 执行、LLM 调用、文件操作 |

---

## 2. 整体架构

### 2.1 三栏布局结构

```
┌─────────────────────────────────────────────────────────────────────┐
│  Title Bar (Electron 原生标题栏 / 自定义标题栏)                        │
├──────────┬──────────────────────────────────────┬───────────────────┤
│          │                                      │                   │
│ SIDEBAR  │         MAIN WORKSPACE               │  SUMMARY PANE     │
│ (240px)  │         (flex-1)                     │  (320px, 可折叠)  │
│          │                                      │                   │
│ ┌──────┐ │  ┌──────────────────────────────┐    │  ┌─────────────┐  │
│ │项目  │ │  │     Chat / Agent Output      │    │  │ Agent Plan  │  │
│ │列表  │ │  │     (scrollable area)        │    │  │ (当前计划)   │  │
│ ├──────┤ │  │                              │    │  ├─────────────┤  │
│ │线程  │ │  │  [Tool Call] [Diff] [Code]   │    │  │ Sources     │  │
│ │列表  │ │  │  [Terminal Output]           │    │  │ (读取的文件) │  │
│ ├──────┤ │  │                              │    │  ├─────────────┤  │
│ │自动  │ │  └──────────────────────────────┘    │  │ Artifacts   │  │
│ │化    │ │  ┌──────────────────────────────┐    │  │ (修改的文件) │  │
│ ├──────┤ │  │     Composer (输入栏)         │    │  └─────────────┘  │
│ │审查  │ │  │  [@文件] [$技能] [🎤] [发送]  │    │                   │
│ │队列  │ │  └──────────────────────────────┘    │                   │
│ └──────┘ │                                      │                   │
├──────────┴──────────────────────────────────────┴───────────────────┤
│  Status Bar (模型信息 / Token 用量 / 连接状态)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 包结构扩展

在 MiMo Code 现有 monorepo 基础上扩展：

```
packages/
├── app/                    # [扩展] Web 应用主入口
│   ├── src/
│   │   ├── routes/         # SolidJS Router 路由
│   │   ├── layouts/        # 三栏布局组件
│   │   ├── components/     # 页面级组件
│   │   └── stores/         # 全局状态管理
│   └── ...
├── desktop/                # [扩展] Electron 桌面端
│   ├── src/
│   │   ├── main/           # Electron 主进程
│   │   ├── preload/        # 预加载脚本
│   │   └── renderer/       # 渲染进程（复用 packages/app）
│   └── ...
├── ui/                     # [扩展] 共享 UI 组件库
│   ├── src/
│   │   ├── components/     # 新增 GUI 组件
│   │   ├── hooks/          # 新增 hooks
│   │   └── context/        # 新增 context providers
│   └── ...
└── sdk/                    # [复用] 后端通信 SDK
```

---

## 3. 页面与组件详细设计

### 3.1 左侧边栏 (Sidebar)

#### 3.1.1 组件结构

```
<Sidebar>
  <SidebarHeader>           // Logo + 项目切换 + 折叠按钮
  <SidebarTabs>             // Tab: 项目 | 线程 | 自动化 | 审查
  <SidebarContent>          // 根据 Tab 切换内容
    <ProjectList />         // 项目列表 Tab
    <ThreadList />          // 线程列表 Tab
    <AutomationList />      // 自动化任务 Tab
    <ReviewQueue />         // 审查队列 Tab
  </SidebarContent>
</Sidebar>
```

#### 3.1.2 项目列表 (ProjectList)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 项目唯一 ID |
| `name` | `string` | 项目名称 |
| `path` | `string` | 本地路径 |
| `lastActive` | `Date` | 最后活跃时间 |
| `threadCount` | `number` | 关联线程数 |

**功能：**
- 项目列表按最后活跃时间排序
- 支持搜索过滤
- 点击项目切换当前工作区
- 右键菜单：打开文件夹、删除项目、项目设置
- `Cmd+P` 快速切换项目

#### 3.1.3 线程列表 (ThreadList)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 线程 ID |
| `projectId` | `string` | 所属项目 ID |
| `title` | `string` | 线程标题（自动生成） |
| `status` | `'idle' \| 'running' \| 'completed' \| 'failed'` | 线程状态 |
| `executionMode` | `'local' \| 'worktree' \| 'cloud'` | 执行模式 |
| `createdAt` | `Date` | 创建时间 |
| `messageCount` | `number` | 消息数 |
| `hasUnreadChanges` | `boolean` | 是否有未读变更 |

**功能：**
- 线程按创建时间倒序排列
- 状态指示器（运行中显示动画）
- 未读变更标记（蓝色圆点）
- 支持搜索和过滤
- `Cmd+Shift+[/]` 切换线程
- 新建线程按钮（选择执行模式）

#### 3.1.4 自动化列表 (AutomationList)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 自动化 ID |
| `name` | `string` | 任务名称 |
| `trigger` | `'manual' \| 'cron' \| 'webhook'` | 触发方式 |
| `schedule` | `string?` | Cron 表达式（可选） |
| `lastRun` | `Date?` | 最后运行时间 |
| `status` | `'idle' \| 'running' \| 'error'` | 状态 |

#### 3.1.5 审查队列 (ReviewQueue)

**功能：**
- 显示所有待审查的 Agent 输出
- 按时间倒序排列
- 状态过滤：全部 / 待审查 / 已批准 / 已拒绝
- 点击进入 Diff 审查视图

---

### 3.2 中间主工作区 (Main Workspace)

#### 3.2.1 组件结构

```
<MainWorkspace>
  <WorkspaceHeader>         // 线程标题 + 执行模式 + 操作按钮
  <WorkspaceContent>        // 主内容区
    <ChatView />            // 对话视图（默认）
    <DiffView />            // Diff 审查视图（切换）
    <TerminalTabs />        // 终端标签页（底部可折叠）
  </WorkspaceContent>
  <Composer />              // 底部输入栏
</MainWorkspace>
```

#### 3.2.2 ChatView — 对话视图

消息类型与渲染：

| 消息类型 | 组件 | 说明 |
|---------|------|------|
| `user` | `<UserMessage>` | 用户输入，右对齐气泡 |
| `assistant` | `<AssistantMessage>` | Agent 输出，左对齐，Markdown 渲染 |
| `tool_call` | `<ToolCallCard>` | 工具调用卡片（文件读写、Shell 命令等） |
| `tool_result` | `<ToolResultCard>` | 工具执行结果 |
| `diff` | `<InlineDiff>` | 内联代码差异显示 |
| `code_block` | `<CodeBlock>` | 语法高亮代码块（Shiki） |
| `thinking` | `<ThinkingBlock>` | Agent 思考过程（可折叠） |
| `error` | `<ErrorMessage>` | 错误信息 |

**ToolCallCard 详细设计：**

```
┌─────────────────────────────────────────────┐
│ 🔧 read_file                    [展开 ▼]    │
├─────────────────────────────────────────────┤
│ 文件: src/components/App.tsx                │
│ 行数: 1-50                                  │
│ [查看文件内容]                               │
└─────────────────────────────────────────────┘
```

工具类型图标映射：
- 📄 `read_file` / `write_file` — 文件操作
- 🖥️ `shell` / `bash` — 命令执行
- 🔍 `grep` / `glob` — 搜索操作
- 🌐 `webfetch` / `websearch` — 网络操作
- 🤖 `actor` — 子 Agent 调用

#### 3.2.3 DiffView — 代码差异审查

**核心组件：`<DiffViewer>`**

```
┌─────────────────────────────────────────────┐
│ 变更文件: src/App.tsx    [+12] [-3]         │
├─────────────────────────────────────────────┤
│  1   │ import { Component } from 'solid-js' │
│  2   │                                      │
│ -3   │- const App = () => {                 │
│ +3   │+ const App: Component = () => {      │
│  4   │   return (                           │
│ +5   │+   <div class="app">                 │
│  6   │     <h1>Hello</h1>                   │
│ +7   │+   </div>                            │
│  8   │   )                                  │
│  9   │ }                                    │
├─────────────────────────────────────────────┤
│ [✅ Approve]  [🔄 Revise]  [❌ Reject]      │
│ [💬 评论]     [📋 复制]    [↩️ 撤销]        │
└─────────────────────────────────────────────┘
```

**功能：**
- 统一 Diff 视图（unified diff）
- 语法高亮（Shiki）
- 行内评论（点击行号添加）
- 文件级折叠/展开
- 批量操作：全部 Approve / 全部 Reject
- 快捷键：`Cmd+Enter` Approve, `Cmd+Shift+Enter` Reject

#### 3.2.4 TerminalTabs — 终端标签页

**功能：**
- 多终端标签页支持
- 命令输出实时流式显示
- 支持交互式命令（PTY）
- 终端输出搜索
- `Cmd+J` 切换显示/隐藏
- 标签页可拖拽排序

**终端组件架构：**
```
<TerminalTabs>
  <TabList>
    <Tab>终端 1</Tab>
    <Tab>测试输出</Tab>
    <Tab>构建日志</Tab>
    <TabButton>+</TabButton>  // 新建终端
  </TabList>
  <TabPanel>
    <Terminal emulator="xterm" />
  </TabPanel>
</TerminalTabs>
```

#### 3.2.5 Composer — 输入栏

**核心功能：**

```
┌─────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 输入任务描述...                                        │   │
│ │                                                       │   │
│ │ [@] 文件引用  [$] 技能  [🎤] 语音  [/] 命令            │   │
│ └───────────────────────────────────────────────────────┘   │
│ [Agent: build ▼]  [模式: Local ▼]  [发送 ➤]                │
└─────────────────────────────────────────────────────────────┘
```

**交互特性：**
- `@` 触发文件模糊搜索（搜索工作区文件）
- `$` 触发技能列表（已注册的 skills）
- `/` 触发 slash commands（`/review`, `/plan`, `/goal` 等）
- `🎤` 语音输入（MiMo ASR，按住说话）
- `Tab` Agent 运行时排队下一条提示
- `Enter` Agent 运行时注入中途指令
- `Cmd+Enter` 发送消息
- 支持多行输入（Shift+Enter 换行）
- 输入历史（上/下箭头）

**Agent 选择器：**
- `build` — 默认，完整工具权限
- `plan` — 只读分析模式
- `compose` — 规范驱动开发模式

**执行模式选择器：**
- `Local` — 直接在项目目录工作
- `Worktree` — Git worktree 隔离
- `Cloud` — 远程沙箱执行

---

### 3.3 右侧面板 (Summary Pane)

#### 3.3.1 组件结构

```
<SummaryPane>
  <SummaryPaneHeader>       // 标题 + 折叠按钮
  <SummaryPaneTabs>         // Tab: 计划 | 源文件 | 产物
  <SummaryPaneContent>
    <AgentPlanView />       // Agent 计划 Tab
    <SourcesView />         // 源文件 Tab
    <ArtifactsView />       // 产物 Tab
  </SummaryPaneContent>
</SummaryPane>
```

#### 3.3.2 AgentPlanView — Agent 计划

**功能：**
- 显示 Agent 当前执行计划
- 任务树可视化（T1, T1.1, T1.2...）
- 实时更新任务状态（🔵 open / 🔄 running / ✅ done / ❌ failed）
- 点击任务跳转到对应对话位置
- 支持手动添加/修改计划步骤

#### 3.3.3 SourcesView — 源文件

**功能：**
- 列出 Agent 本次对话中读取的所有文件
- 文件预览（点击展开内容）
- 文件搜索
- 标记重要文件

#### 3.3.4 ArtifactsView — 产物

**功能：**
- 列出 Agent 创建/修改的所有文件
- 变更统计（+行数 / -行数）
- 点击查看 Diff
- 快速跳转到 Diff 审查

---

### 3.4 标题栏与状态栏

#### 3.4.1 TitleBar

```
┌─────────────────────────────────────────────────────────────┐
│ [●●●]  MiMo Code — my-project — thread-001                 │
└─────────────────────────────────────────────────────────────┘
```

- macOS 风格交通灯按钮（红黄绿）
- 当前项目名和线程名
- `Cmd+B` 切换侧边栏
- `Cmd+Shift+P` 命令面板

#### 3.4.2 StatusBar

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 MiMo-Auto  |  📊 12.5K tokens  |  🟢 Connected  | v0.1 │
└─────────────────────────────────────────────────────────────┘
```

- 当前使用的模型
- Token 用量统计
- 连接状态
- 版本号

---

## 4. 数据流设计

### 4.1 前后端通信架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Renderer                         │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐                 │
│  │ SolidJS │──▶│  Stores  │──▶│ SDK Client│                 │
│  │   UI    │◀──│ (state)  │◀──│ (fetch)  │                 │
│  └─────────┘   └──────────┘   └────┬─────┘                 │
└────────────────────────────────────┼────────────────────────┘
                                     │ HTTP / WebSocket
┌────────────────────────────────────┼────────────────────────┐
│                    Electron Main    │                        │
│  ┌─────────────────────────────────┼──────────────────────┐ │
│  │              Hono Server (@mimo-ai/cli)                │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │ Agent   │ │ Provider │ │  Tool    │ │ Session  │  │ │
│  │  │ Engine  │ │ Layer    │ │ Executor │ │ Manager  │  │ │
│  │  └─────────┘ └──────────┘ └──────────┘ └──────────┘  │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │ Memory  │ │ Storage  │ │   MCP    │ │   Git    │  │ │
│  │  │ System  │ │ (SQLite) │ │ Client   │ │ Manager  │  │ │
│  │  └─────────┘ └──────────┘ └──────────┘ └──────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 4.2 关键数据流

#### 4.2.1 发送消息流程

```
用户输入 → Composer 组件
  → 解析 @文件引用、$技能、/命令
  → 构造消息 payload
  → SDK: POST /api/sessions/{id}/messages
  → Hono Server 接收
  → Agent Engine 处理
  → 流式返回 (SSE / WebSocket)
  → 前端实时渲染 ChatView
```

#### 4.2.2 Agent 工具调用流程

```
Agent 决策调用工具
  → Tool Executor 执行
  → 返回结果给 Agent
  → Agent 继续推理
  → 前端显示 ToolCallCard + ToolResultCard
  → 如果是文件操作，更新 ArtifactsView
```

#### 4.2.3 Diff 审查流程

```
Agent 完成文件修改
  → 生成 Git Diff
  → 前端显示 DiffView
  → 用户 Review:
    → Approve: SDK POST /api/sessions/{id}/approve → Git commit
    → Revise: 发送追加消息，Agent 继续修改
    → Reject: SDK POST /api/sessions/{id}/reject → Git checkout
```

### 4.3 状态管理

使用 SolidJS 的信号（Signals）和存储（Stores）进行状态管理：

```typescript
// 全局状态结构
interface AppState {
  // 项目状态
  projects: Project[]
  currentProjectId: string | null

  // 线程状态
  threads: Thread[]
  currentThreadId: string | null

  // 会话状态
  messages: Message[]
  isAgentRunning: boolean
  agentPlan: TaskNode[]

  // UI 状态
  sidebarTab: 'projects' | 'threads' | 'automations' | 'reviews'
  sidebarCollapsed: boolean
  summaryPaneCollapsed: boolean
  activeTerminalTab: number

  // 配置
  currentAgent: 'build' | 'plan' | 'compose'
  executionMode: 'local' | 'worktree' | 'cloud'
  currentModel: string
}
```

---

## 5. API 接口定义

### 5.1 项目管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects` | 获取项目列表 |
| `POST` | `/api/projects` | 创建/导入项目 |
| `GET` | `/api/projects/{id}` | 获取项目详情 |
| `DELETE` | `/api/projects/{id}` | 删除项目 |
| `PATCH` | `/api/projects/{id}` | 更新项目配置 |

### 5.2 线程管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects/{pid}/threads` | 获取项目线程列表 |
| `POST` | `/api/projects/{pid}/threads` | 创建新线程 |
| `GET` | `/api/threads/{tid}` | 获取线程详情 |
| `DELETE` | `/api/threads/{tid}` | 删除线程 |
| `POST` | `/api/threads/{tid}/messages` | 发送消息 |
| `GET` | `/api/threads/{tid}/messages` | 获取消息历史 |
| `POST` | `/api/threads/{tid}/approve` | 批准变更 |
| `POST` | `/api/threads/{tid}/reject` | 拒绝变更 |

### 5.3 Agent 控制 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/threads/{tid}/stop` | 停止 Agent |
| `GET` | `/api/threads/{tid}/plan` | 获取 Agent 计划 |
| `GET` | `/api/threads/{tid}/sources` | 获取读取的源文件 |
| `GET` | `/api/threads/{tid}/artifacts` | 获取修改的产物 |
| `GET` | `/api/threads/{tid}/diff` | 获取代码差异 |

### 5.4 终端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/terminals` | 创建终端实例 |
| `DELETE` | `/api/terminals/{id}` | 关闭终端 |
| `WS` | `/api/terminals/{id}/stream` | 终端输出 WebSocket 流 |

### 5.5 配置 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/config` | 获取当前配置 |
| `PATCH` | `/api/config` | 更新配置 |
| `GET` | `/api/config/models` | 获取可用模型列表 |
| `GET` | `/api/config/agents` | 获取可用 Agent 列表 |

### 5.6 流式通信

- **消息流**：`GET /api/threads/{tid}/stream` (SSE) — Agent 输出实时流
- **终端流**：`WS /api/terminals/{id}/stream` (WebSocket) — 终端 PTY 输出
- **事件总线**：`WS /api/events` (WebSocket) — 全局事件通知（任务状态变更、文件变更等）

---

## 6. 数据库 Schema 变更

基于 MiMo Code 现有的 Drizzle ORM + SQLite schema 扩展：

### 6.1 新增表

```sql
-- 项目表
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  settings TEXT  -- JSON: 项目级配置
);

-- 线程表
CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',  -- idle | running | completed | failed
  execution_mode TEXT NOT NULL DEFAULT 'local',  -- local | worktree | cloud
  agent_type TEXT NOT NULL DEFAULT 'build',  -- build | plan | compose
  worktree_ref TEXT,  -- Git worktree 引用（worktree 模式）
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata TEXT  -- JSON: 扩展元数据
);

-- 自动化任务表
CREATE TABLE automations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual',  -- manual | cron | webhook
  schedule TEXT,  -- Cron 表达式
  agent_type TEXT NOT NULL DEFAULT 'build',
  last_run_at INTEGER,
  status TEXT NOT NULL DEFAULT 'idle',  -- idle | running | error
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 审查记录表
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id),
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  diff_summary TEXT,  -- JSON: 变更摘要
  reviewer_notes TEXT,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);
```

### 6.2 扩展现有表

```sql
-- 在现有 sessions 表上增加字段
ALTER TABLE sessions ADD COLUMN thread_id TEXT REFERENCES threads(id);
ALTER TABLE sessions ADD COLUMN execution_mode TEXT DEFAULT 'local';
```

---

## 7. 组件库扩展 (packages/ui)

### 7.1 新增组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| `<Sidebar>` | `components/sidebar/` | 侧边栏容器 |
| `<SidebarTabs>` | `components/sidebar/` | 侧边栏 Tab 切换 |
| `<ProjectCard>` | `components/project/` | 项目卡片 |
| `<ThreadCard>` | `components/thread/` | 线程卡片 |
| `<ChatView>` | `components/chat/` | 对话视图容器 |
| `<MessageBubble>` | `components/chat/` | 消息气泡 |
| `<ToolCallCard>` | `components/chat/` | 工具调用卡片 |
| `<ThinkingBlock>` | `components/chat/` | 思考过程折叠块 |
| `<Composer>` | `components/composer/` | 输入栏 |
| `<FileSearch>` | `components/composer/` | @文件搜索弹出层 |
| `<SkillPicker>` | `components/composer/` | $技能选择器 |
| `<DiffViewer>` | `components/diff/` | 代码差异查看器 |
| `<DiffLine>` | `components/diff/` | Diff 行组件 |
| `<InlineComment>` | `components/diff/` | 行内评论 |
| `<TerminalTabs>` | `components/terminal/` | 终端标签页 |
| `<Terminal>` | `components/terminal/` | 终端模拟器 |
| `<SummaryPane>` | `components/summary/` | 右侧面板 |
| `<AgentPlan>` | `components/summary/` | Agent 计划树 |
| `<TaskNode>` | `components/summary/` | 任务节点 |
| `<SourcesList>` | `components/summary/` | 源文件列表 |
| `<ArtifactsList>` | `components/summary/` | 产物列表 |
| `<StatusBar>` | `components/status/` | 状态栏 |
| `<CommandPalette>` | `components/palette/` | 命令面板 (Cmd+Shift+P) |
| `<ReviewActions>` | `components/review/` | 审查操作按钮组 |

### 7.2 新增 Hooks

| Hook | 路径 | 说明 |
|------|------|------|
| `useProject` | `hooks/` | 项目状态管理 |
| `useThread` | `hooks/` | 线程状态管理 |
| `useChat` | `hooks/` | 对话消息管理 |
| `useComposer` | `hooks/` | 输入栏状态 |
| `useDiff` | `hooks/` | Diff 数据处理 |
| `useTerminal` | `hooks/` | 终端实例管理 |
| `useAgentPlan` | `hooks/` | Agent 计划状态 |
| `useReview` | `hooks/` | 审查流程管理 |
| `useStream` | `hooks/` | SSE/WebSocket 流管理 |
| `useKeyboard` | `hooks/` | 全局快捷键 |

---

## 8. Electron 主进程扩展

### 8.1 新增功能

| 功能 | 模块 | 说明 |
|------|------|------|
| 窗口管理 | `main/window.ts` | 多窗口支持、窗口状态持久化 |
| 菜单栏 | `main/menu.ts` | 原生菜单（文件/编辑/视图/窗口/帮助） |
| 快捷键 | `main/shortcuts.ts` | 全局快捷键注册 |
| 系统托盘 | `main/tray.ts` | 托盘图标 + 快捷操作 |
| 自动更新 | `main/updater.ts` | electron-updater 集成 |
| IPC 通信 | `main/ipc.ts` | 主进程 ↔ 渲染进程通信 |
| 文件关联 | `main/fileAssociation.ts` | .mimocode 文件关联 |
| 通知 | `main/notifications.ts` | 系统通知（Agent 完成等） |

### 8.2 Preload 脚本

```typescript
// preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // 文件操作
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFile: (path: string) => ipcRenderer.invoke('file:open', path),
  showInFinder: (path: string) => ipcRenderer.invoke('file:showInFinder', path),

  // 系统集成
  copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:copy', text),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // 事件监听
  onUpdateAvailable: (callback: Function) => ipcRenderer.on('update:available', callback),
  onNotification: (callback: Function) => ipcRenderer.on('notification', callback),
})
```

---

## 9. 快捷键设计

| 快捷键 | 功能 |
|--------|------|
| `Cmd+N` | 新建线程 |
| `Cmd+Shift+N` | 新建项目 |
| `Cmd+B` | 切换侧边栏 |
| `Cmd+Shift+B` | 切换右侧面板 |
| `Cmd+J` | 切换终端面板 |
| `Cmd+Enter` | 发送消息 |
| `Cmd+Shift+Enter` | 拒绝变更 |
| `Cmd+Shift+P` | 命令面板 |
| `Cmd+P` | 快速切换项目 |
| `Cmd+Shift+[/]` | 切换线程 |
| `Cmd+K` | 清空对话 |
| `Cmd+S` | 保存当前状态 |
| `Cmd+,` | 打开设置 |
| `Cmd+/` | 快捷键帮助 |
| `Escape` | 关闭弹出层 / 取消操作 |

---

## 10. 主题设计

### 10.1 色彩方案

```typescript
// Dark Theme (默认)
const darkTheme = {
  // 背景色
  bg: {
    primary: '#0d1117',      // 主背景
    secondary: '#161b22',    // 侧边栏背景
    tertiary: '#1c2128',     // 卡片背景
    hover: '#21262d',        // 悬停背景
    active: '#282e36',       // 激活背景
  },
  // 文字色
  text: {
    primary: '#e6edf3',      // 主文字
    secondary: '#8b949e',    // 次要文字
    muted: '#484f58',        // 弱化文字
    link: '#58a6ff',         // 链接
  },
  // 边框色
  border: {
    default: '#30363d',
    muted: '#21262d',
    active: '#58a6ff',
  },
  // 状态色
  status: {
    success: '#3fb950',      // 成功/添加
    error: '#f85149',        // 错误/删除
    warning: '#d29922',      // 警告
    info: '#58a6ff',         // 信息
    running: '#58a6ff',      // 运行中
  },
  // Diff 色
  diff: {
    addBg: '#12261e',
    addText: '#3fb950',
    removeBg: '#2d1316',
    removeText: '#f85149',
    header: '#1c2128',
  },
}

// Light Theme
const lightTheme = {
  bg: {
    primary: '#ffffff',
    secondary: '#f6f8fa',
    tertiary: '#ffffff',
    hover: '#f3f4f6',
    active: '#e5e7eb',
  },
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    muted: '#9ca3af',
    link: '#2563eb',
  },
  // ... 类似结构
}
```

### 10.2 字体

```css
/* 代码字体 */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

/* UI 字体 */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 字号 */
--text-xs: 0.75rem;    /* 12px - 次要信息 */
--text-sm: 0.875rem;   /* 14px - 正文 */
--text-base: 1rem;     /* 16px - 标题 */
--text-lg: 1.125rem;   /* 18px - 大标题 */
```

---

## 11. 开发阶段与里程碑

### Phase 1: 基础框架 (2 周)

**目标：** 搭建三栏布局骨架，实现基础导航

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| 搭建 SolidJS + Vite + Electron 项目结构 | P0 | 2d |
| 实现三栏布局组件（Sidebar + Main + Summary） | P0 | 3d |
| 实现 Sidebar 基础框架（Tabs + 折叠） | P0 | 2d |
| 实现窗口管理（Electron 主进程） | P0 | 2d |
| 实现全局快捷键 | P1 | 1d |
| 实现深色/浅色主题切换 | P1 | 1d |
| 基础路由配置 | P0 | 1d |

**交付物：** 可运行的桌面应用骨架，三栏布局可折叠/调整大小

### Phase 2: 对话与输入 (2 周)

**目标：** 实现核心对话功能和 Composer 输入

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| 实现 ChatView 消息列表 | P0 | 3d |
| 实现各类消息组件（User/Assistant/ToolCall/Error） | P0 | 3d |
| 实现 Composer 输入栏 | P0 | 2d |
| 实现 @ 文件搜索功能 | P0 | 2d |
| 实现 $ 技能选择器 | P1 | 1d |
| 实现 Slash Commands | P1 | 1d |
| 集成 SDK 连接后端 | P0 | 2d |
| 实现 SSE 流式消息渲染 | P0 | 2d |

**交付物：** 可与 Agent 对话，流式显示输出，工具调用卡片

### Phase 3: 代码审查 (2 周)

**目标：** 实现 Diff 查看器和审查工作流

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| 实现 DiffViewer 组件 | P0 | 4d |
| 实现行内评论功能 | P1 | 2d |
| 实现 Approve/Revise/Reject 工作流 | P0 | 2d |
| 实现 TerminalTabs 组件 | P0 | 3d |
| 集成 PTY 终端模拟 | P0 | 2d |
| 实现 CodeBlock 语法高亮 | P1 | 1d |

**交付物：** 完整的代码审查流程，终端标签页

### Phase 4: 项目与线程管理 (1.5 周)

**目标：** 实现项目和线程的 CRUD 及管理

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| 实现 ProjectList 组件 | P0 | 2d |
| 实现 ThreadList 组件 | P0 | 2d |
| 实现项目导入/创建流程 | P0 | 2d |
| 实现线程创建（含执行模式选择） | P0 | 2d |
| 数据库 schema 迁移 | P0 | 1d |
| 实现数据持久化 | P0 | 2d |

**交付物：** 多项目多线程管理，数据持久化

### Phase 5: 右侧面板与高级功能 (1.5 周)

**目标：** 实现 Summary Pane 和高级交互

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| 实现 AgentPlanView 组件 | P0 | 3d |
| 实现 SourcesView 组件 | P1 | 1d |
| 实现 ArtifactsView 组件 | P1 | 1d |
| 实现 CommandPalette (Cmd+Shift+P) | P1 | 2d |
| 实现 ReviewQueue 审查队列 | P1 | 2d |
| 实现 AutomationList 自动化列表 | P2 | 2d |

**交付物：** 完整的右侧面板，命令面板，审查队列

### Phase 6: 打磨与发布 (1 周)

**目标：** UI 打磨、性能优化、打包发布

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| UI 细节打磨（动画、过渡、响应式） | P1 | 2d |
| 性能优化（虚拟滚动、懒加载） | P1 | 1d |
| Electron 打包配置（macOS/Windows/Linux） | P0 | 2d |
| 自动更新集成 | P1 | 1d |
| E2E 测试 | P1 | 2d |
| 文档编写 | P2 | 1d |

**交付物：** 可发布的桌面应用安装包

---

## 12. 验证方案

### 12.1 单元测试

- 使用 `@solidjs/testing-library` 测试组件
- 使用 `vitest` 运行测试
- 覆盖率目标：核心组件 > 80%

### 12.2 E2E 测试

- 使用 Playwright 进行端到端测试
- 测试场景：
  - 三栏布局响应式
  - 项目创建/切换
  - 线程创建/对话
  - Diff 审查流程
  - 终端操作
  - 快捷键

### 12.3 手动验证清单

- [ ] 三栏布局正确显示，可折叠/调整大小
- [ ] 项目列表加载和切换正常
- [ ] 线程创建和对话功能正常
- [ ] Agent 输出流式渲染
- [ ] Diff 查看器正确显示差异
- [ ] Approve/Reject 工作流正常
- [ ] 终端标签页可正常操作
- [ ] 深色/浅色主题切换正常
- [ ] 快捷键响应正确
- [ ] Electron 打包后可正常运行

---

## 13. 风险与注意事项

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| MiMo Code SDK API 不完整 | 前端功能受限 | 优先梳理 SDK 接口，与后端同步 |
| SolidJS 生态组件较少 | 开发效率低 | 复用 packages/ui 已有组件，必要时封装 |
| Electron 包体积过大 | 用户体验差 | 优化打包配置，使用 asar 压缩 |
| 大文件 Diff 渲染性能 | 卡顿 | 虚拟滚动 + 分页加载 |
| 多线程并行资源竞争 | 稳定性 | 合理的并发控制和错误隔离 |

---

*文档版本：v0.1*
*创建日期：2026-06-12*
*基于 MiMo Code v0.1.0 源码分析*
