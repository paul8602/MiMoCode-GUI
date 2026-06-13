# Phase 6: 打磨与发布

> **工期**: 1-2 周 | **目标**: 最终打磨和发布准备

---

## 前置依赖

- Phase 5 完成（桌面体验优化）

---

## 里程碑

✅ 可发布的 v1.0

---

## 任务清单

### T6.1 主题系统（2d）

**交付物**: 完整的主题切换

- [ ] 实现暗色主题（默认）
- [ ] 实现亮色主题
- [ ] 主题切换 UI（设置页面 + 快捷键）
- [ ] 跟随系统主题（system 模式）
- [ ] 主题变量定义（CSS custom properties）
- [ ] 所有组件主题适配验证
- [ ] 主题偏好持久化

**关键文件**:
- `packages/ui/src/theme/dark.css`
- `packages/ui/src/theme/light.css`
- `packages/ui/src/theme/variables.css`
- `packages/app/src/stores/ui-store.ts`（更新）

**色彩方案**:
```css
/* 暗色主题 */
--surface-primary: #0d1117;
--surface-secondary: #161b22;
--border-subtle: #30363d;
--text-primary: #e6edf3;
--text-secondary: #8b949e;
--accent-blue: #58a6ff;
--accent-green: #3fb950;
--accent-red: #f85149;

/* 亮色主题 */
--surface-primary: #ffffff;
--surface-secondary: #f6f8fa;
--border-subtle: #d0d7de;
--text-primary: #1f2328;
--text-secondary: #656d76;
```

**验收标准**: 暗色/亮色主题切换流畅，所有组件样式正确

---

### T6.2 国际化 i18n（2d）

**交付物**: 中英文支持

- [ ] 集成 i18n 库（`@solid-primitives/i18n` 或 `typesafe-i18n`）
- [ ] 提取所有硬编码字符串到语言文件
- [ ] 实现中文翻译
- [ ] 实现英文翻译
- [ ] 语言切换 UI（设置页面）
- [ ] 语言偏好持久化
- [ ] 日期/时间格式本地化

**关键文件**:
- `packages/app/src/i18n/zh.ts`
- `packages/app/src/i18n/en.ts`
- `packages/app/src/i18n/index.ts`

**验收标准**: 中英文切换正确，无遗漏翻译

---

### T6.3 错误边界 + 降级处理（1d）

**交付物**: 优雅的错误处理

- [ ] 创建 `ErrorBoundary` 组件
- [ ] 页面级错误边界（每个路由页面）
- [ ] 组件级错误边界（关键组件）
- [ ] 错误页面 UI（重试 + 返回首页）
- [ ] 网络错误降级（离线提示 + 重连）
- [ ] 全局错误日志收集

**关键文件**:
- `packages/app/src/components/common/error-boundary.tsx`
- `packages/app/src/components/common/error-fallback.tsx`

**验收标准**: 错误发生时显示友好提示，不影响其他功能

---

### T6.4 E2E 测试（3d）

**交付物**: Playwright 测试覆盖

- [ ] 配置 Playwright 测试环境
- [ ] 核心流程测试：
  - 应用启动和布局渲染
  - 会话创建、发送消息、接收回复
  - 会话切换、删除
  - Diff 查看和操作
  - 终端打开和输入
  - 设置页面配置
- [ ] 边界场景测试：
  - 网络断开
  - 服务不可用
  - 长会话性能
- [ ] CI 集成

**关键文件**:
- `packages/app/e2e/layout.spec.ts`
- `packages/app/e2e/session.spec.ts`
- `packages/app/e2e/diff.spec.ts`
- `packages/app/e2e/settings.spec.ts`

**验收标准**: 核心流程 E2E 测试全部通过

---

### T6.5 打包与分发（2d）

**交付物**: macOS/Windows/Linux 安装包

- [ ] 配置 `electron-builder` 打包参数
- [ ] macOS: `.dmg` 安装包（支持 Intel + Apple Silicon）
- [ ] Windows: `.exe` 安装包（NSIS 安装器）
- [ ] Linux: `.AppImage` / `.deb` 安装包
- [ ] 应用图标和品牌素材
- [ ] 代码签名（macOS 公证、Windows 签名）
- [ ] GitHub Releases 自动发布

**关键文件**:
- `packages/desktop/electron-builder.yml`
- `packages/desktop/assets/icon.icns`
- `packages/desktop/assets/icon.ico`
- `packages/desktop/assets/icon.png`

**验收标准**: 三平台安装包可正常安装和运行

---

### T6.6 文档与 README（1d）

**交付物**: 用户文档

- [ ] README.md 更新（功能介绍、截图、安装说明）
- [ ] 快捷键参考表
- [ ] 配置说明文档
- [ ] 开发者贡献指南
- [ ] CHANGELOG.md

**关键文件**:
- `README.md`
- `CHANGELOG.md`
- `docs/keyboard-shortcuts.md`
- `docs/configuration.md`

**验收标准**: 文档完整，新用户可按文档完成安装和使用

---

## 依赖关系

```
T6.1, T6.2, T6.3 (可并行)
T6.4 (依赖 T6.1-T6.3 完成)
T6.5 (依赖 T6.4 测试通过)
T6.6 (可与 T6.4/T6.5 并行)
```

## 验收测试

1. 暗色/亮色主题切换正确
2. 中英文切换无遗漏
3. 错误发生时显示友好提示
4. E2E 测试全部通过
5. 三平台安装包可正常安装和运行
6. 文档完整可用

---

## 发布检查清单

- [ ] 所有 E2E 测试通过
- [ ] 三平台打包成功
- [ ] 代码签名完成
- [ ] CHANGELOG 更新
- [ ] 版本号更新
- [ ] GitHub Release 创建
- [ ] 安装包上传
- [ ] 发布公告准备
