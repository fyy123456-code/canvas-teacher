# Lesson 01 空白 Konva Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可扩展的画布模块封装，并渲染第一个空白 Konva Stage。

**Architecture:** `App` 只负责进入编辑器页面；`CanvasWorkspace` 负责工作区布局和 StoreProvider；`InfiniteCanvas` 使用 `new Konva.Stage()`、`new Konva.Layer()` 命令式创建 Stage 和 Layer；`CanvasElements` 后续负责把 store 元素渲染成 Konva 节点。本节不渲染真实元素，只建立和 `ai-design-canvas` 一致的底层挂载方式。

**Tech Stack:** React、TypeScript、Vite、Konva、MobX、SCSS。

---

## 文件结构

- Create: `src/store/workspaceStore.ts`，创建最小 workspace store。
- Create: `src/store/StoreContext.tsx`，提供 StoreProvider 和 useStore。
- Create: `src/store/index.ts`，统一导出 store 模块。
- Create: `src/canvas/types.ts`，定义画布尺寸类型。
- Create: `src/canvas/canvasConfig.ts`，保存默认画布尺寸和背景色。
- Create: `src/canvas/InfiniteCanvas.tsx`，命令式创建 Konva Stage 和 Layer。
- Create: `src/canvas/CanvasElements.tsx`，预留元素渲染入口。
- Create: `src/canvas/CanvasWorkspace.tsx`，封装画布工作区外壳和 StoreProvider。
- Create: `src/canvas/index.ts`，统一导出 canvas 模块。
- Modify: `src/App.tsx`，从说明页切换为画布工作区。
- Modify: `src/styles/index.scss`，增加编辑器布局和空白 Stage 样式。
- Create: `docs/lessons/01-empty-stage.md`，中文课程文档。

## Task 1: 实现 canvas 模块边界

**Files:**
- Create: `src/canvas/types.ts`
- Create: `src/canvas/canvasConfig.ts`
- Create: `src/store/workspaceStore.ts`
- Create: `src/store/StoreContext.tsx`
- Create: `src/store/index.ts`
- Create: `src/canvas/InfiniteCanvas.tsx`
- Create: `src/canvas/CanvasElements.tsx`
- Create: `src/canvas/CanvasWorkspace.tsx`
- Create: `src/canvas/index.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles/index.scss`

- [ ] **Step 1: 定义类型和配置**

创建 `CanvasSize`、`CanvasLayerId` 类型，创建默认 Stage 配置。

- [ ] **Step 2: 封装 `InfiniteCanvas`**

使用 `new Konva.Stage()` 和 `new Konva.Layer()` 命令式创建 Stage 和 Layer。本节只添加一个背景 Rect，不渲染真实业务元素。

- [ ] **Step 3: 封装 `CanvasWorkspace`**

创建工作区外壳，负责标题、StoreProvider、画布居中区域和后续工具栏接入位置。

- [ ] **Step 4: 修改 `App`**

让 `App` 只渲染 `CanvasWorkspace`。

## Task 2: 验证并提交

**Files:**
- Create: `docs/lessons/01-empty-stage.md`

- [ ] **Step 1: 写中文课程文档**

文档解释 Stage、Layer、组件边界和为什么提前分层。

- [ ] **Step 2: 类型检查**

Run:

```bash
pnpm typecheck
```

Expected: TypeScript 检查通过。

- [ ] **Step 3: 构建验证**

Run:

```bash
pnpm build
```

Expected: Vite 构建通过。

- [ ] **Step 4: 浏览器验证**

打开 `http://127.0.0.1:5173/`，确认页面显示 `Lesson 01` 和空白画布区域。

- [ ] **Step 5: 提交**

Run:

```bash
git add .
git commit -m "lesson-01: render empty Konva stage"
```

Expected: 生成 Lesson 01 的独立 commit。
