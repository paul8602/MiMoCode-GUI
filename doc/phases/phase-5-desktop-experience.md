# Phase 5: 桌面体验优化

> **工期**: 2 周 | **目标**: 完善 Electron 桌面体验

---

## 前置依赖

- Phase 4 完成（审查与工作流）

---

## 里程碑

✅ 生产级桌面应用体验

---

## 任务清单

### T5.1 系统托盘 + 全局快捷键（2d）

**交付物**: 全局快捷键、托盘菜单

- [ ] 创建系统托盘图标（macOS/Windows/Linux 适配）
- [ ] 托盘右键菜单：显示窗口 / 新建会话 / 退出
- [ ] 托盘点击显示/隐藏窗口
- [ ] 全局快捷键注册：
  - `Cmd/Ctrl+Shift+M` — 显示/隐藏窗口
  - `Cmd/Ctrl+Shift+N` — 新建会话
- [ ] 快捷键冲突检测和配置

**关键文件**:
- `packages/desktop/src/main/tray.ts`
- `packages/desktop/src/main/shortcuts.ts`

**验收标准**: 托盘图标显示正确，快捷键全局生效

---

### T5.2 自动更新机制（2d）

**交付物**: electron-updater 集成

- [ ] 集成 `electron-updater`
- [ ] 启动时检查更新
- [ ] 更新下载进度显示
- [ ] 更新就绪后提示重启
- [ ] 支持手动检查更新（菜单）
- [ ] 更新日志展示

**关键文件**:
- `packages/desktop/src/main/updater.ts`

**新增依赖**:
```json
{
  "electron-updater": "^6.3.0"
}
```

**验收标准**: 应用可自动检查和安装更新

---

### T5.3 深度链接处理（1d）

**交付物**: mimocode:// 协议

- [ ] 注册 `mimocode://` 自定义协议
- [ ] 处理深度链接参数（打开项目、跳转会话）
- [ ] macOS/Windows 协议注册差异处理
- [ ] 链接格式：`mimocode://open?path=/project/path`

**关键文件**:
- `packages/desktop/src/main/deep-link.ts`

**验收标准**: 点击 `mimocode://` 链接正确打开应用并跳转

---

### T5.4 系统通知集成（1d）

**交付物**: 任务完成通知

- [ ] 任务完成时发送系统通知
- [ ] 审查请求到达时发送通知
- [ ] 通知点击跳转到对应会话/审查
- [ ] 通知权限请求和配置
- [ ] macOS/Windows 通知样式适配

**关键文件**:
- `packages/desktop/src/main/notification.ts`

**验收标准**: 系统通知正确发送，点击可跳转

---

### T5.5 本地服务管理（2d）

**交付物**: 自动启动/停止 opencode server

- [ ] Electron 主进程管理 opencode server 生命周期
- [ ] 应用启动时自动启动 server
- [ ] 应用退出时自动停止 server
- [ ] Server 健康检查和自动重启
- [ ] Server 端口动态分配
- [ ] Server 日志收集

**关键文件**:
- `packages/desktop/src/main/server-manager.ts`

**验收标准**: Server 随应用自动启停，异常时可自动恢复

---

### T5.6 多窗口支持（2d）

**交付物**: 多项目多窗口

- [ ] 支持打开多个独立窗口（每个窗口一个项目）
- [ ] 窗口间状态隔离
- [ ] 新窗口创建：菜单 File → New Window
- [ ] 窗口标题显示项目名称
- [ ] 窗口位置和大小记忆

**关键文件**:
- `packages/desktop/src/main/window.ts`（更新）

**验收标准**: 可同时打开多个项目窗口，互不干扰

---

### T5.7 性能优化（2d）

**交付物**: 虚拟滚动、懒加载、内存优化

- [ ] 消息列表虚拟滚动优化（virtua）
- [ ] 组件懒加载（路由级别 code splitting）
- [ ] 图片和附件懒加载
- [ ] 内存使用监控和优化
- [ ] 长会话消息分页加载
- [ ] 渲染性能 profiling 和优化

**关键文件**:
- `packages/app/src/components/chat/message-list.tsx`（更新）
- `packages/app/src/app.tsx`（更新路由懒加载）

**验收标准**: 1000+ 消息会话滚动流畅，内存占用稳定

---

## 依赖关系

```
T5.1, T5.2, T5.3, T5.4, T5.5, T5.6, T5.7 (大部分可并行)
T5.5 → T5.6 (多窗口需要稳定的 server 管理)
```

## 验收测试

1. 系统托盘图标显示，右键菜单可用
2. 全局快捷键可显示/隐藏窗口
3. 应用可自动检查更新
4. `mimocode://` 链接正确打开应用
5. 任务完成时系统通知弹出
6. Server 随应用自动启停
7. 可同时打开多个项目窗口
8. 大量消息会话滚动流畅
