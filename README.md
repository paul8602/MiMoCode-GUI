<h1 align="center">MiMo Code Desktop GUI</h1>

<p align="center">
  <img src="assets/readme/mimocode-banner.png" alt="MiMoCode" width="700">
</p>

<p align="center"><strong>基于 MiMo Code 的桌面端 GUI 应用，参考 Codex 三栏布局设计。</strong></p>

---

## 简介

MiMo Code Desktop GUI 是基于 [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) 构建的桌面端图形界面应用。采用三栏布局设计（参考 OpenAI Codex Desktop），为 AI 编程助手提供更直观的交互体验。

## 核心特性

### 三栏布局

```
┌─────────────┬──────────────────────┬──────────────┐
│  左侧边栏    │  主工作区             │  右侧摘要面板 │
│             │                      │              │
│  项目列表    │  Composer 输入框      │  Agent 计划   │
│  会话列表    │  对话流（流式输出）    │  引用文件     │
│  任务/记忆   │  代码 Diff 查看       │  产物列表     │
│             │  终端标签页            │              │
└─────────────┴──────────────────────┴──────────────┘
```

### 功能模块

| 模块 | 说明 |
|------|------|
| **SummaryPane** | 右侧摘要面板，包含 Plan/Sources/Artifacts 三个 Tab |
| **MemoryPanel** | 记忆管理面板，查看/编辑项目记忆、会话检查点、笔记 |
| **ReviewQueue** | 跨会话审查队列，支持状态筛选和快速操作 |
| **TaskTreeView** | 树形任务可视化，实时同步 Agent 任务状态 |
| **系统托盘** | 托盘图标 + 右键菜单（显示/新建/退出） |
| **全局快捷键** | `Cmd+Shift+M` 显示/隐藏，`Cmd+Shift+N` 新建会话 |

### Agent 系统

| Agent | 说明 |
|-------|------|
| **build** | 默认模式，完整工具权限，用于开发 |
| **plan** | 只读分析模式，用于代码探索和方案设计 |
| **compose** | 编排模式，规范驱动开发和技能工作流 |

按 `Tab` 键切换 Agent。

### 持久化记忆

基于 SQLite FTS5 全文搜索的跨会话记忆系统：

- **项目记忆** (`MEMORY.md`) — 持久化的项目知识、规则和架构决策
- **会话检查点** (`checkpoint.md`) — 自动维护的结构化状态快照
- **临时笔记** (`notes.md`) — Agent 的临时笔记区域
- **任务进度** (`tasks/<id>/progress.md`) — 每个任务的日志

会话恢复时自动注入记忆，无需重新学习项目上下文。

### 代码审查

- 行内评论：在 Diff 行上添加评论，支持 @mention
- 审查队列：跨会话聚合待审查项
- Approve/Reject：一键批准或拒绝代码变更
- Fork 操作：从任意消息点创建新会话

---

## 快速开始

### 环境要求

- [Bun](https://bun.sh) v1.3+
- Node.js v18+

### 安装

```bash
# 克隆仓库
git clone https://github.com/XiaomiMiMo/MiMo-Code.git
cd MiMo-Code

# 安装依赖
bun install
```

### 一键启动

**Web 模式（推荐调试）：**
```bash
./start.sh
# 自动启动后端 + 前端 + 打开浏览器
```

**桌面端（Electron）：**
```bash
./start-desktop.sh
# 自动启动后端 + Electron 桌面应用
```

### 手动启动

**终端 1 — 启动后端：**
```bash
cd packages/opencode
bun run --conditions=browser ./src/index.ts serve --port 4096
```

**终端 2 — 启动前端：**
```bash
cd packages/app
bun dev -- --port 4444
```

打开 `http://localhost:4444`

**或启动 Electron 桌面应用：**
```bash
cd packages/desktop
bun dev
```

### 配置 LLM 提供商

首次启动后需要配置 LLM 提供商：

1. 打开设置（`Cmd+,`）
2. 在 Providers 中添加提供商：
   - **MiMo Auto**（限时免费）：选择 MiMo Auto，按提示登录
   - **自定义 API**：添加 OpenAI 兼容的 API key 和 endpoint
3. 在 Composer 区域选择智能体和模型

---

## 项目结构

```
packages/
├── app/              # SolidJS Web 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── summary/      # SummaryPane（Plan/Sources/Artifacts）
│   │   │   ├── memory/       # MemoryPanel（记忆管理）
│   │   │   ├── review/       # ReviewQueue（审查队列）
│   │   │   ├── chat/         # 对话组件
│   │   │   ├── terminal/     # 终端组件
│   │   │   └── prompt-input/ # Composer 输入框
│   │   ├── stores/           # 状态管理（summary/memory/review）
│   │   ├── context/          # SolidJS Context Providers
│   │   ├── pages/            # 页面组件
│   │   ├── i18n/             # 国际化（17 种语言）
│   │   └── utils/            # 工具函数
│   └── e2e/                  # Playwright E2E 测试
├── desktop/          # Electron 桌面应用
│   └── src/
│       ├── main/             # 主进程
│       │   ├── tray.ts       # 系统托盘
│       │   ├── shortcuts.ts  # 全局快捷键
│       │   ├── window-registry.ts  # 窗口注册表
│       │   └── server.ts     # 后端服务管理
│       ├── preload/          # 预加载脚本
│       └── renderer/         # 渲染进程
├── ui/               # 共享 UI 组件库（Kobalte + Tailwind）
├── opencode/         # 核心引擎 + HTTP Server
├── sdk/              # JavaScript SDK
└── shared/           # 共享工具函数
```

---

## 快捷键

### 全局（系统级）

| 快捷键 | 功能 |
|--------|------|
| `Cmd+Shift+M` | 显示/隐藏窗口 |
| `Cmd+Shift+N` | 新建会话 |

### 导航

| 快捷键 | 功能 |
|--------|------|
| `Cmd+B` | 切换侧边栏 |
| `Cmd+Shift+B` | 切换摘要面板 |
| `Cmd+O` | 打开项目 |
| `Cmd+,` | 打开设置 |
| `Cmd+Shift+P` | 命令面板 |

### 会话

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 发送消息 |
| `Shift+Enter` | 换行 |
| `Escape` | 中止当前操作 |
| `Cmd+.` | 切换智能体 |
| `Ctrl+`` | 切换终端 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| UI 框架 | SolidJS |
| 样式 | Tailwind CSS |
| 组件库 | Kobalte |
| 桌面端 | Electron |
| 终端 | Ghostty (GPU 加速) |
| 构建 | Bun + Vite + Turborepo |
| 数据库 | SQLite (Drizzle ORM) |
| LLM 集成 | Vercel AI SDK (18+ 提供商) |
| 协议 | MCP + ACP |

---

## 开发

```bash
# 安装依赖
bun install

# 类型检查
cd packages/app && bun typecheck
cd packages/desktop && bun typecheck

# 单元测试
cd packages/app && bun test:unit

# E2E 测试
cd packages/app && bun test:e2e
```

---

## 相关项目

- [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) — 核心引擎
- [OpenCode](https://github.com/anomalyco/opencode) — 上游项目

---

## 许可证

源代码基于 [MIT 许可证](./LICENSE)。

使用 MiMoCode 需遵守[使用限制](./USE_RESTRICTIONS.md)。
使用小米 MiMo 托管服务需遵守[MiMo 服务条款](https://platform.xiaomimimo.com/docs/terms/user-agreement)。
