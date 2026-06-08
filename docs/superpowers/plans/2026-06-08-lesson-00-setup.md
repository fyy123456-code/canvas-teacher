# Lesson 00 项目初始化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个最小可运行的 Vite + React + TypeScript 画布学习项目，为后续 Konva、MobX、SCSS 学习做准备。

**Architecture:** 本节只搭建应用入口和基础样式，不实现画布功能。后续课程会从 `src/App.tsx` 逐步拆分出画布组件、状态管理和工具栏。

**Tech Stack:** React、TypeScript、Vite、Konva、MobX、SCSS。

---

## 文件结构

- Create: `.gitignore`，忽略依赖、构建产物和 macOS 临时文件。
- Create: `package.json`，声明项目脚本和核心依赖。
- Create: `index.html`，Vite 应用 HTML 入口。
- Create: `vite.config.ts`，启用 React 插件。
- Create: `tsconfig.json`，配置浏览器端 TypeScript。
- Create: `tsconfig.node.json`，配置 Vite 配置文件的 TypeScript。
- Create: `src/main.tsx`，React 挂载入口。
- Create: `src/App.tsx`，当前阶段的应用壳。
- Create: `src/styles/index.scss`，全局样式入口。
- Create: `docs/lessons/00-setup.md`，中文课程文档。

## Task 1: 创建项目骨架

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/index.scss`

- [ ] **Step 1: 写入项目配置和入口文件**

写入最小 Vite React TypeScript 项目。页面只显示课程标题和下一节要做的事情，不写 Konva 画布代码。

- [ ] **Step 2: 安装依赖**

Run:

```bash
pnpm install
```

Expected: 生成 `pnpm-lock.yaml`，安装 React、Vite、TypeScript、Konva、MobX、SCSS 相关依赖。

- [ ] **Step 3: 类型检查**

Run:

```bash
pnpm typecheck
```

Expected: `src` 和 `vite.config.ts` 的 TypeScript 检查通过，不生成 `.js`、`.d.ts` 或 `.tsbuildinfo` 文件。

- [ ] **Step 4: 构建验证**

Run:

```bash
pnpm build
```

Expected: 先完成类型检查，再由 Vite 构建通过，生成 `dist/`。

## Task 2: 写课程文档并提交

**Files:**
- Create: `docs/lessons/00-setup.md`

- [ ] **Step 1: 写中文课程文档**

文档包含本节目标、知识点、改动文件、关键代码解释、学生手写任务、常见错误、小练习。

- [ ] **Step 2: 查看变更**

Run:

```bash
git status --short
git diff --stat
```

Expected: 只出现 Lesson 00 相关文件。

- [ ] **Step 3: 提交**

Run:

```bash
git add .
git commit -m "lesson-00: scaffold React canvas project"
```

Expected: 生成 Lesson 00 的独立 commit。
