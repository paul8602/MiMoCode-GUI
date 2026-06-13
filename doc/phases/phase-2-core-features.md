# Phase 2: 核心功能

> **工期**: 3-4 周 | **目标**: 完善对话体验，添加 Diff 查看和终端

---

## 前置依赖

- Phase 1 完成（三栏布局 + 基本对话功能）

---

## 里程碑

✅ 完整的对话 + 代码编辑 + 终端体验

---

## 任务清单

### T2.1 实现 ToolCallBlock 各类型（3d）

**交付物**: 文件读取、编辑、Shell 调用展示

- [ ] 创建 `ToolCallBlock` 容器组件（可折叠）
- [ ] 创建 `ToolCallRenderer` 按类型分发渲染
- [ ] 实现 `FileReadTool` 视图（文件路径 + 内容预览）
- [ ] 实现 `ShellTool` 视图（命令 + 输出，终端样式）
- [ ] 实现 `SearchTool` 视图（glob/grep 结果列表）
- [ ] 实现 `GenericToolView` 通用兜底视图
- [ ] 工具调用状态指示（pending → running → complete/error）

**关键文件**:
- `packages/app/src/components/chat/tool-call-block.tsx`
- `packages/app/src/components/chat/tool-call-renderer.tsx`
- `packages/app/src/components/chat/tool-views/file-read-view.tsx`
- `packages/app/src/components/chat/tool-views/shell-output-view.tsx`
- `packages/app/src/components/chat/tool-views/search-results-view.tsx`
- `packages/app/src/components/chat/tool-views/generic-tool-view.tsx`

**验收标准**: 不同工具调用正确渲染，状态指示清晰

---

### T2.2 实现 InlineDiffView（3d）

**交付物**: 内联 diff 渲染

- [ ] 创建 `InlineDiffView` 组件（在 ChatView 中内联显示）
- [ ] 集成 `@pierre/diffs` 计算 unified diff
- [ ] 语法高亮使用 `shiki`
- [ ] 添加/删除行颜色标识（绿色/红色）
- [ ] 支持展开/折叠完整 diff
- [ ] 显示变更统计（+N / -N）

**关键文件**:
- `packages/app/src/components/chat/tool-views/inline-diff-view.tsx`
- `packages/app/src/components/diff/diff-line.tsx`

**验收标准**: 文件编辑工具调用显示内联 diff，语法高亮正确

---

### T2.3 实现独立 DiffViewer（3d）

**交付物**: 统一 diff 视图 + 语法高亮

- [ ] 创建 `DiffViewer` 独立视图组件
- [ ] 创建 `DiffFileList` 变更文件侧边列表
- [ ] 创建 `DiffHunk` 组件渲染 diff hunk
- [ ] 支持 unified 和 side-by-side 两种模式切换
- [ ] 文件选择跳转
- [ ] 底部变更统计汇总

**关键文件**:
- `packages/app/src/components/diff/diff-viewer.tsx`
- `packages/app/src/components/diff/diff-file-list.tsx`
- `packages/app/src/components/diff/diff-hunk.tsx`
- `packages/app/src/components/diff/diff-stats.tsx`

**核心接口**:
```typescript
interface DiffFile {
  id: string
  path: string
  oldContent: string
  newContent: string
  hunks: DiffHunk[]
  status: 'added' | 'modified' | 'deleted' | 'renamed'
}

interface DiffViewerProps {
  files: Accessor<DiffFile[]>
  mode: 'unified' | 'side-by-side'
}
```

**验收标准**: Diff 视图正确显示文件差异，两种模式可切换

---

### T2.4 实现 TerminalTabs + xterm.js（3d）

**交付物**: 多标签终端

- [ ] 创建 `TerminalTabs` 标签页容器
- [ ] 创建 `TerminalInstance` 集成 xterm.js
- [ ] 配置 `xterm-addon-fit` 自适应尺寸
- [ ] 配置 `xterm-addon-search` 终端搜索
- [ ] 通过 WebSocket 或 IPC 连接后端 PTY
- [ ] 新建/关闭终端标签
- [ ] 终端工具栏（清除、搜索、分屏）

**关键文件**:
- `packages/app/src/components/terminal/terminal-tabs.tsx`
- `packages/app/src/components/terminal/terminal-instance.tsx`
- `packages/app/src/components/terminal/terminal-toolbar.tsx`
- `packages/app/src/services/pty-client.ts`

**新增依赖**:
```json
{
  "xterm": "^5.5.0",
  "xterm-addon-fit": "^0.10.0",
  "xterm-addon-search": "^0.15.0"
}
```

**验收标准**: 终端可正常输入输出，多标签切换正常，自适应窗口尺寸

---

### T2.5 实现 @mention 文件搜索（2d）

**交付物**: Composer 中的文件搜索

- [ ] 检测输入中的 `@` 触发词
- [ ] 创建 `MentionDropdown` 下拉搜索框
- [ ] 调用 `/file/search` API 模糊搜索
- [ ] 使用 `fuzzysort` 排序结果
- [ ] 键盘导航（上下箭头选择，Enter 确认）
- [ ] 选中文件作为附件添加

**关键文件**:
- `packages/app/src/components/composer/mention-dropdown.tsx`
- `packages/app/src/components/composer/attachment-list.tsx`

**验收标准**: 输入 `@` 触发文件搜索，选中文件正确附加

---

### T2.6 实现斜杠命令（2d）

**交付物**: Composer 中的命令列表

- [ ] 检测输入中的 `/` 触发词
- [ ] 创建 `CommandDropdown` 命令列表
- [ ] 注册内置命令：/goal, /voice, /dream, /distill, /review, /plan-mode
- [ ] 键盘导航和选择
- [ ] 命令参数提示

**关键文件**:
- `packages/app/src/components/composer/command-dropdown.tsx`

**验收标准**: 输入 `/` 显示命令列表，选择命令正确执行

---

### T2.7 Agent 切换（1d）

**交付物**: Tab 键切换 agent

- [ ] Tab 键在 build/plan/compose 间循环切换
- [ ] 切换时更新 Composer placeholder 提示
- [ ] 视觉指示当前 agent 类型（标签/图标）
- [ ] 切换时通知后端

**关键文件**:
- `packages/app/src/components/composer/agent-switcher.tsx`
- `packages/app/src/stores/agent-store.ts`

**验收标准**: Tab 切换 agent 类型，UI 正确反映当前 agent

---

### T2.8 实现 WebSocket 事件桥接（2d）

**交付物**: 实时状态同步

- [ ] 创建 `event-bridge.ts` WebSocket 客户端
- [ ] 自动连接和重连机制
- [ ] 事件分发到各 store（session/task/agent）
- [ ] 创建 `agentStore` 状态管理
- [ ] 创建 `taskStore` 基础版

**关键文件**:
- `packages/app/src/services/event-bridge.ts`
- `packages/app/src/stores/agent-store.ts`
- `packages/app/src/stores/task-store.ts`

**验收标准**: WebSocket 连接正常，事件正确分发到 store

---

### T2.9 消息操作（2d）

**交付物**: 右键菜单 + 操作按钮

- [ ] 用户消息：编辑、复制、删除
- [ ] 助手消息：重试、复制、分支
- [ ] 消息编辑：点击编辑进入编辑模式，保存后重新发送
- [ ] 消息重试：从该消息重新生成
- [ ] 创建 `ConfirmDialog` 删除确认

**关键文件**:
- `packages/app/src/components/chat/message-actions.tsx`
- `packages/app/src/components/common/confirm-dialog.tsx`

**验收标准**: 消息操作菜单可用，编辑/重试功能正常

---

## 依赖关系

```
T2.1 → T2.2
T2.3 (可与 T2.1/T2.2 并行)
T2.4 (独立)
T2.5 → T2.6
T2.7 (独立)
T2.8 (独立)
T2.9 (依赖 T2.1)
```

## 验收测试

1. AI 回复中的文件读取/编辑/Shell 调用正确渲染
2. 文件编辑显示内联 diff，语法高亮正确
3. 独立 Diff 视图可查看所有文件变更
4. 终端可正常输入输出，支持多标签
5. Composer 中 `@` 触发文件搜索，`/` 触发命令列表
6. Tab 键切换 agent 类型
7. 消息可编辑、重试、复制
