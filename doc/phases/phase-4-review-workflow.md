# Phase 4: 审查与工作流

> **工期**: 2 周 | **目标**: 实现代码审查流程和工作流集成

---

## 前置依赖

- Phase 3 完成（高级面板 + 任务追踪 + 记忆管理）

---

## 里程碑

✅ 完整的代码审查工作流

---

## 任务清单

### T4.1 实现 ReviewQueue（3d）

**交付物**: 审查列表 + 状态管理

- [ ] 创建 `ReviewQueue` 列表组件
- [ ] 创建 `ReviewItem` 审查项组件
- [ ] 显示：标题、文件变更数、Agent 推理摘要、创建时间
- [ ] 状态筛选：待审查 / 已批准 / 已拒绝
- [ ] 排序：按创建时间倒序
- [ ] 未读/已读视觉区分
- [ ] 点击进入审查详情

**关键文件**:
- `packages/app/src/components/review/review-queue.tsx`
- `packages/app/src/components/review/review-item.tsx`

**核心接口**:
```typescript
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

**验收标准**: 审查列表正确显示，筛选和排序可用

---

### T4.2 实现行内评论（2d）

**交付物**: Diff 中添加评论

- [ ] 点击 diff 行号添加评论
- [ ] 创建 `InlineComment` 评论组件
- [ ] 评论输入框（textarea + 提交按钮）
- [ ] 评论列表展示（头像、内容、时间）
- [ ] 评论与 diff 行关联
- [ ] 评论持久化（保存到后端）

**关键文件**:
- `packages/app/src/components/diff/inline-comment.tsx`
- `packages/app/src/components/review/review-diff.tsx`

**验收标准**: 可在 diff 行添加评论，评论正确显示

---

### T4.3 实现批准/拒绝/修改工作流（2d）

**交付物**: 审查操作按钮

- [ ] 创建 `ReviewActions` 操作按钮组件
- [ ] **批准 (Approve)**: 提交变更到 Git，创建 commit
- [ ] **拒绝 (Reject)**: 标记为拒绝，丢弃变更
- [ ] **修改 (Revise)**: 输入反馈，继续对话迭代
- [ ] 操作确认弹窗
- [ ] 操作后状态更新

**关键文件**:
- `packages/app/src/components/review/review-actions.tsx`

**验收标准**: 三个操作按钮可用，操作后状态正确更新

---

### T4.4 新增 /review API（2d）

**交付物**: 后端审查 API

- [ ] 新增 `GET /review` — 待审查列表
- [ ] 新增 `GET /review/{id}` — 审查详情
- [ ] 新增 `POST /review/{id}/approve` — 批准变更
- [ ] 新增 `POST /review/{id}/reject` — 拒绝变更
- [ ] 新增 `POST /review/{id}/revise` — 修改请求
- [ ] 新增 `POST /review/{id}/comment` — 添加评论
- [ ] 更新 SDK 客户端类型定义

**关键文件**:
- `packages/opencode/src/server/routes/review.ts`
- `packages/sdk/openapi.json`

**验收标准**: 审查 API 可正常调用，操作正确执行

---

### T4.5 实现权限请求弹窗（1d）

**交付物**: 工具调用权限确认

- [ ] 创建 `PermissionDialog` 组件
- [ ] 显示：工具名称、操作描述、目标文件
- [ ] 操作按钮：允许一次 / 始终允许 / 拒绝
- [ ] 权限配置持久化
- [ ] 与 `permissionStore` 集成

**关键文件**:
- `packages/app/src/components/common/permission-dialog.tsx`
- `packages/app/src/stores/config-store.ts`

**验收标准**: 权限请求弹窗正确显示，操作生效

---

## 依赖关系

```
T4.4 → T4.1 → T4.2 → T4.3
T4.5 (独立)
```

## 验收测试

1. 审查队列显示待审查项，筛选可用
2. Diff 中可添加行内评论
3. 批准操作正确提交变更
4. 拒绝操作正确丢弃变更
5. 修改操作发送反馈继续对话
6. 权限请求弹窗正确显示和响应
