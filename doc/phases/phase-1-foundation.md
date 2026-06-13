# Phase 1: 基础骨架

> **工期**: 2-3 周 | **目标**: 搭建三栏布局框架，实现基本会话功能

---

## 里程碑

✅ 可以在桌面应用中进行基本的 AI 对话

---

## 任务清单

### T1.1 搭建 monorepo 开发环境（2d）

**交付物**: 可运行的 dev 环境

- [ ] 克隆 MiMo-Code 仓库并安装依赖（`bun install`）
- [ ] 确认 `packages/app` 和 `packages/desktop` 可独立运行
- [ ] 配置 `packages/app` 的 Vite 开发代理，指向 opencode server
- [ ] 验证 Electron 开发模式热重载正常
- [ ] 配置环境变量（API base URL、开发端口）

**关键文件**:
- `packages/app/vite.config.ts`
- `packages/desktop/electron.vite.config.ts`
- `packages/app/.env.development`

**验收标准**: `bun run dev` 在 app 和 desktop 包均可启动，浏览器/Electron 窗口可访问

---

### T1.2 实现 DesktopLayout 三栏容器（2d）

**交付物**: 可拖拽调整宽度的三栏布局

- [ ] 创建 `DesktopLayout` 组件（CSS Grid 三栏）
- [ ] 实现 `LayoutResizer` 拖拽调整侧边栏/右侧面板宽度
- [ ] 实现侧边栏折叠/展开动画
- [ ] 实现右侧面板折叠/展开动画
- [ ] 响应式断点：窄屏自动折叠为图标模式
- [ ] 集成 `@solidjs/router` 的 `<Outlet>` 嵌套路由

**关键文件**:
- `packages/app/src/components/layout/desktop-layout.tsx`
- `packages/app/src/components/layout/layout-resizer.tsx`
- `packages/app/src/components/layout/layout.module.css`

**核心接口**:
```typescript
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

**验收标准**: 三栏布局正确显示，拖拽调整宽度流畅，折叠/展开动画平滑

---

### T1.3 实现 SidebarContainer + SidebarNav（2d）

**交付物**: 可切换 Tab 的侧边栏

- [ ] 创建 `SidebarContainer` 容器组件
- [ ] 实现 `SidebarHeader`（项目名称 + 设置入口）
- [ ] 实现 `SidebarNav` Tab 导航（Threads / Tasks / Memory）
- [ ] 实现 `SidebarFooter`（版本信息 + 快捷操作）
- [ ] Tab 切换内容区域

**关键文件**:
- `packages/app/src/components/sidebar/sidebar-container.tsx`
- `packages/app/src/components/sidebar/sidebar-header.tsx`
- `packages/app/src/components/sidebar/sidebar-nav.tsx`
- `packages/app/src/components/sidebar/sidebar-footer.tsx`

**验收标准**: 侧边栏显示正确，Tab 切换流畅

---

### T1.4 实现 ThreadList + ThreadItem（2d）

**交付物**: 会话列表（静态数据 → 动态数据）

- [ ] 创建 `ThreadList` 组件（虚拟滚动）
- [ ] 创建 `ThreadItem` 组件（标题、预览、时间、状态）
- [ ] 实现按日期分组（今天/昨天/本周/更早）
- [ ] 实现 `ThreadSearchBar` 搜索过滤
- [ ] 右键菜单（重命名、删除）
- [ ] 活跃会话高亮指示

**关键文件**:
- `packages/app/src/components/sidebar/thread-list.tsx`
- `packages/app/src/components/sidebar/thread-item.tsx`
- `packages/app/src/components/sidebar/thread-search.tsx`
- `packages/app/src/components/sidebar/thread-group.tsx`

**核心接口**:
```typescript
interface Thread {
  id: string
  title: string
  updatedAt: number
  messageCount: number
  agentType: 'build' | 'plan' | 'compose'
  status: 'active' | 'completed' | 'error'
}
```

**验收标准**: 会话列表正确渲染，搜索过滤可用，点击切换会话

---

### T1.5 实现 Composer 基础版（3d）

**交付物**: 多行输入 + 发送按钮

- [ ] 创建 `Composer` 组件（textarea + 发送按钮）
- [ ] 多行输入支持（Shift+Enter 换行，Enter 发送）
- [ ] 历史命令上下箭头浏览
- [ ] `AgentSwitcher` Tab 键切换 build/plan/compose
- [ ] 空输入禁用发送按钮
- [ ] 发送中显示 loading 状态

**关键文件**:
- `packages/app/src/components/composer/composer.tsx`
- `packages/app/src/components/composer/agent-switcher.tsx`

**核心接口**:
```typescript
interface ComposerProps {
  onSubmit: (message: string, attachments: Attachment[]) => void
  onAbort: () => void
  disabled?: boolean
  placeholder?: string
  agentType: Accessor<'build' | 'plan' | 'compose'>
  onAgentSwitch: (type: 'build' | 'plan' | 'compose') => void
}
```

**验收标准**: 输入消息可发送，Agent 切换正常

---

### T1.6 实现 ChatView 基础版（3d）

**交付物**: Markdown 渲染 + 流式输出

- [ ] 创建 `ChatView` 容器组件
- [ ] 创建 `MessageList`（虚拟滚动）
- [ ] 创建 `UserMessage` 气泡组件
- [ ] 创建 `AssistantMessage` 组件
- [ ] 集成 `marked` 渲染 Markdown
- [ ] 集成 `shiki` 代码语法高亮
- [ ] 创建 `StreamingIndicator` 打字动画
- [ ] 实现自动滚动到底部

**关键文件**:
- `packages/app/src/components/chat/chat-view.tsx`
- `packages/app/src/components/chat/message-list.tsx`
- `packages/app/src/components/chat/user-message.tsx`
- `packages/app/src/components/chat/assistant-message.tsx`
- `packages/app/src/components/chat/markdown-renderer.tsx`
- `packages/app/src/components/chat/streaming-indicator.tsx`

**核心接口**:
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  toolCalls?: ToolCall[]
  timestamp: number
  status: 'pending' | 'streaming' | 'complete' | 'error'
}
```

**验收标准**: 消息正确渲染，Markdown 格式正确，代码高亮可用

---

### T1.7 集成 SDK Client（2d）

**交付物**: 连接后端 API

- [ ] 创建 `api-client.ts` 封装 SDK 客户端
- [ ] 实现会话 CRUD（list/get/create/delete）
- [ ] 实现消息 list 接口
- [ ] 实现配置 get/update 接口
- [ ] 错误处理和重试机制
- [ ] 创建 `sessionStore` 状态管理

**关键文件**:
- `packages/app/src/services/api-client.ts`
- `packages/app/src/stores/session-store.ts`
- `packages/app/src/stores/chat-store.ts`

**验收标准**: 可通过 SDK 调用后端 API，会话列表正确加载

---

### T1.8 实现 SSE 流式消息（2d）

**交付物**: 实时流式对话

- [ ] 创建 `stream-client.ts` SSE 流式客户端
- [ ] 实现 `AsyncGenerator<StreamEvent>` 流式迭代
- [ ] 处理事件类型：message.delta / reasoning.delta / tool.call / tool.result / done
- [ ] 实现 AbortController 中止机制
- [ ] 集成到 `chatStore.sendMessage` 流程
- [ ] 流式消息增量渲染

**关键文件**:
- `packages/app/src/services/stream-client.ts`
- `packages/app/src/stores/chat-store.ts`

**核心接口**:
```typescript
interface StreamEvent {
  type: 'message.delta' | 'tool.call' | 'tool.result' | 'reasoning.delta' | 'error' | 'done'
  data: unknown
}
```

**验收标准**: 发送消息后实时流式显示 AI 回复，可中止生成

---

### T1.9 Electron 窗口基础配置（1d）

**交付物**: 可启动的桌面窗口

- [ ] 配置 Electron 主窗口尺寸和标题
- [ ] 配置 preload 脚本暴露 IPC 接口
- [ ] 实现窗口最小化/最大化/关闭
- [ ] 配置应用菜单（File/Edit/View/Window/Help）
- [ ] 开发模式加载 Vite dev server

**关键文件**:
- `packages/desktop/src/main/index.ts`
- `packages/desktop/src/main/window.ts`
- `packages/desktop/src/preload/index.ts`

**验收标准**: Electron 窗口正常启动，加载 web app 内容

---

## 依赖关系

```
T1.1 → T1.2 → T1.3 → T1.4
                ↘ T1.5 → T1.6
T1.7 → T1.8
T1.9 (可并行)
```

## 验收测试

1. 启动 Electron 应用，三栏布局正确显示
2. 左侧边栏显示会话列表，可搜索和切换
3. Composer 输入消息，Enter 发送
4. AI 回复实时流式渲染，Markdown 格式正确
5. 会话可创建、切换、删除
6. 侧边栏和右侧面板可折叠/展开、拖拽调整宽度
