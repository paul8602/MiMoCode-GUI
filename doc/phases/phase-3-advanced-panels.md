# Phase 3: 高级面板

> **工期**: 2-3 周 | **目标**: 实现右侧摘要面板和任务追踪

---

## 前置依赖

- Phase 2 完成（核心对话 + Diff + 终端功能）

---

## 里程碑

✅ 完整的三栏布局 + 任务追踪 + 记忆管理

---

## 任务清单

### T3.1 实现 SummaryPane 容器（1d）

**交付物**: 可折叠右侧面板

- [ ] 创建 `SummaryPane` 容器组件
- [ ] 实现 `SummaryHeader`（标题 + 折叠按钮）
- [ ] 实现 `SummaryTabs` Tab 切换（Plan / Sources / Artifacts）
- [ ] 折叠/展开动画
- [ ] 宽度拖拽调整
- [ ] 集成到 `DesktopLayout`

**关键文件**:
- `packages/app/src/components/summary/summary-pane.tsx`
- `packages/app/src/components/summary/summary-header.tsx`
- `packages/app/src/components/summary/summary-tabs.tsx`

**验收标准**: 右侧面板正确显示，Tab 切换流畅，折叠/展开正常

---

### T3.2 实现 TaskTreeView（3d）

**交付物**: 树形任务可视化

- [ ] 创建 `TaskTreeView` 树形组件
- [ ] 创建 `TaskNode` 节点组件（ID、摘要、状态）
- [ ] 树形展开/折叠
- [ ] 状态颜色标识：绿色(done)、蓝色(in_progress)、红色(blocked)、灰色(open)
- [ ] 活跃任务脉冲动画
- [ ] 点击节点显示详情
- [ ] 集成 `taskStore` 实时更新

**关键文件**:
- `packages/app/src/components/task/task-tree-view.tsx`
- `packages/app/src/components/task/task-node.tsx`
- `packages/app/src/components/task/task-status-badge.tsx`

**核心接口**:
```typescript
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

**验收标准**: 任务树正确渲染，状态颜色标识清晰，实时更新

---

### T3.3 实现 SourcesTab（2d）

**交付物**: 引用文件列表

- [ ] 创建 `SourcesTab` 组件
- [ ] 显示当前会话引用的文件列表
- [ ] 文件路径、行号范围、引用次数
- [ ] 点击文件跳转到 Diff 视图或编辑器
- [ ] 按引用频率排序

**关键文件**:
- `packages/app/src/components/summary/sources-tab.tsx`

**验收标准**: 引用文件列表正确显示，点击可跳转

---

### T3.4 实现 ArtifactsTab（2d）

**交付物**: 产物列表 + 预览

- [ ] 创建 `ArtifactList` 组件
- [ ] 显示会话产生的产物（创建/修改的文件、diff、terminal 输出）
- [ ] 产物类型图标标识
- [ ] 点击产物显示预览
- [ ] 创建 `ArtifactPreview` 预览面板

**关键文件**:
- `packages/app/src/components/summary/artifacts-tab.tsx`

**验收标准**: 产物列表正确显示，预览功能可用

---

### T3.5 实现 AgentPlanTab（2d）

**交付物**: Agent 计划展示

- [ ] 创建 `AgentPlanTab` 组件
- [ ] 显示当前 agent 的执行计划
- [ ] 计划步骤列表（已完成/进行中/待执行）
- [ ] 每步显示：步骤描述、工具调用、耗时
- [ ] 实时更新（WebSocket 事件驱动）

**关键文件**:
- `packages/app/src/components/summary/agent-plan-tab.tsx`

**验收标准**: Agent 计划正确显示，步骤状态实时更新

---

### T3.6 实现 MemoryPanel（3d）

**交付物**: 记忆查看/编辑

- [ ] 创建 `MemoryPanel` 组件
- [ ] 分 Tab 展示：Project Memory / Session / Notes / Tasks
- [ ] Markdown 渲染展示
- [ ] 编辑模式切换（使用 CodeMirror 或 Monaco Editor）
- [ ] 记忆搜索功能（跨所有记忆文件）
- [ ] 创建 `memoryStore` 状态管理

**关键文件**:
- `packages/app/src/components/memory/memory-panel.tsx`
- `packages/app/src/components/memory/memory-editor.tsx`
- `packages/app/src/components/memory/memory-search.tsx`
- `packages/app/src/stores/memory-store.ts`

**核心接口**:
```typescript
interface MemoryContent {
  projectMemory: string     // MEMORY.md
  sessionCheckpoint: string // checkpoint.md
  notes: string            // notes.md
  taskProgress: Record<string, string>  // tasks/<id>/progress.md
}
```

**验收标准**: 记忆文件正确显示，编辑可保存，搜索可用

---

### T3.7 新增后端 API（2d）

**交付物**: 后端 API 支持

- [ ] 新增 `GET /session/{id}/diff` — 会话产生的所有 diff
- [ ] 新增 `GET /session/{id}/artifacts` — 会话产物列表
- [ ] 新增 `GET /session/{id}/sources` — 引用的文件/URL
- [ ] 更新 SDK 客户端类型定义

**关键文件**:
- `packages/opencode/src/server/routes/session.ts`
- `packages/sdk/openapi.json`

**验收标准**: 新 API 可正常调用，返回正确数据

---

## 依赖关系

```
T3.1 → T3.2, T3.3, T3.4, T3.5
T3.6 (独立)
T3.7 (前置，供 T3.2-T3.5 使用)
```

## 验收测试

1. 右侧摘要面板正确显示，Tab 切换正常
2. 任务树渲染正确，状态颜色标识清晰
3. Sources 列表显示引用文件，点击可跳转
4. Artifacts 列表显示产物，预览可用
5. Agent Plan 步骤实时更新
6. Memory Panel 可查看和编辑记忆文件
7. 后端 API 返回正确数据
