# Lesson 01：从零渲染全屏空白 Konva Stage

## 本节目标

本节只做一件事：创建一个全屏空白 `Konva.Stage`。

当前基线刻意不包含这些内容：

- 不定义 `ElementType`
- 不定义 `ElementStatus`
- 不定义 `CanvasElement`
- 不创建 `CanvasElements`
- 不创建工具栏
- 不创建文字和图片逻辑

原因是：这些都应该在后面的课程里一步一步手写。现在提前放在项目里，会让你不知道它们是怎么来的。

## 本节知识点

1. `Stage` 是 Konva 的画布根容器。
2. `Layer` 是 `Stage` 下面的绘制层。
3. React 只负责 DOM 容器、生命周期和组件边界。
4. Konva 节点用 `new Konva.Stage()`、`new Konva.Layer()` 这种命令式 API 创建。
5. `StoreProvider`、`useStore`、`createWorkSpaceStore` 先只负责保存画布实例引用。

## 当前文件职责

- `src/store/workspaceStore.ts`：保存画布宽高、`stage`、`layer`。
- `src/store/StoreContext.tsx`：把同一个 store 传给 React 子组件。
- `src/store/index.ts`：统一导出 store。
- `src/canvas/types.ts`：保存画布尺寸类型。
- `src/canvas/canvasConfig.ts`：保存默认尺寸和背景色。
- `src/canvas/InfiniteCanvas.tsx`：创建和销毁 Konva Stage、Layer、背景 Rect。
- `src/canvas/CanvasWorkspace.tsx`：创建 store，监听窗口尺寸，把尺寸传给 `InfiniteCanvas`。
- `src/canvas/index.ts`：统一导出 canvas 模块。
- `src/App.tsx`：只渲染 `CanvasWorkspace`。
- `src/styles/index.scss`：让页面和画布占满浏览器窗口。

## 和 ai-design-canvas 的对应关系

```text
ai-design-canvas/src/workSpace/index.tsx
  -> canvas-teacher/src/canvas/CanvasWorkspace.tsx

ai-design-canvas/src/workSpace/InfiniteCanvas.tsx
  -> canvas-teacher/src/canvas/InfiniteCanvas.tsx

ai-design-canvas/src/store/workSpaceStore.ts
  -> canvas-teacher/src/store/workspaceStore.ts

ai-design-canvas/src/store/StoreContext.tsx
  -> canvas-teacher/src/store/StoreContext.tsx
```

本项目会参考 `ai-design-canvas` 的核心架构，但不会提前把元素、工具栏、上传图片、文字编辑这些代码一次性写进去。

## 画布结构

当前结构是：

```text
App
  CanvasWorkspace
    StoreProvider
      InfiniteCanvas
        wrapperRef
        containerRef
        stageRef
        layerRef
        interactionLayerRef
```

`CanvasWorkspace` 负责外层工作区和窗口尺寸。

`InfiniteCanvas` 负责真正创建 Konva 实例。

## 关键代码解释

### `src/store/workspaceStore.ts`

```ts
export class WorkSpaceStore {
  width: number;
  height: number;
  stage: Konva.Stage | null = null;
  layer: Konva.Layer | null = null;
}
```

这里现在只保存最基础的信息：

- 画布宽高
- 当前 `stage`
- 当前主 `layer`

为什么没有 `elements`：因为还没有开始讲元素数据结构。后面做图片或文字时，再从零添加元素类型和元素列表。

### `src/canvas/InfiniteCanvas.tsx`

```tsx
const wrapperRef = useRef<HTMLDivElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
const stageRef = useRef<Konva.Stage | null>(null);
const layerRef = useRef<Konva.Layer | null>(null);
const interactionLayerRef = useRef<Konva.Layer | null>(null);
```

这些 `ref` 的作用：

- `wrapperRef`：画布外壳。
- `containerRef`：Konva Stage 挂载的真实 DOM。
- `stageRef`：保存 `new Konva.Stage()` 创建出来的 Stage。
- `layerRef`：保存主内容层。
- `interactionLayerRef`：保存后续交互辅助层。

真正创建 Stage 的代码：

```ts
const stage = new Konva.Stage({
  container: containerRef.current,
  width: stageSize.width,
  height: stageSize.height,
});

const layer = new Konva.Layer();
const interactionLayer = new Konva.Layer();
```

这一点必须理解：React 不直接声明 `<Stage>`、`<Layer>`，而是在 `useEffect` 中命令式创建 Konva 对象。

## 逐文件手写步骤

### 第 1 步：创建 `src/store/workspaceStore.ts`

写最小 store，只保留 `width`、`height`、`stage`、`layer` 和两个 setter。

为什么这样写：先让后续组件能拿到同一个 Konva 实例引用，不提前引入元素和工具栏概念。

### 第 2 步：创建 `src/store/StoreContext.tsx`

写 `StoreProvider` 和 `useStore`。

为什么这样写：后续 `InfiniteCanvas`、工具栏、右侧面板都会通过 `useStore()` 访问同一个工作区状态。

### 第 3 步：创建 `src/canvas/InfiniteCanvas.tsx`

用 `containerRef` 创建 `new Konva.Stage()`，再创建主 `Layer`、交互 `Layer`、背景 `Rect`。

为什么这样写：这一步是画布编辑器的核心底座。后面所有图片、文字、选中框、拖拽缩放都依赖这个 Stage 和 Layer。

### 第 4 步：创建 `src/canvas/CanvasWorkspace.tsx`

创建 store，监听窗口 `resize`，把窗口尺寸传给 `InfiniteCanvas`。

为什么这样写：工作区负责尺寸，画布组件负责根据尺寸更新 Stage。

### 第 5 步：创建 `src/styles/index.scss`

建立完整高度链路：

```text
html/body/#root height: 100%
workspace-container height: 100%
workspace-body flex: 1
canvas-wrapper height: 100%
canvas-container inset: 0
```

为什么这样写：全屏画布不是只给最后一个元素写 `height: 100%`，每一层父容器都必须有稳定高度。

## 本节完成标准

完成后你应该能解释：

1. 为什么 `Stage` 要挂载到真实 DOM 容器。
2. 为什么 Konva 对象保存在 `ref`，不是 React state。
3. 为什么 `stage` 和 `layer` 在 MobX 中使用 `observable.ref`。
4. 为什么现在不提前写 `ElementType`、`CanvasElement`、工具栏。
5. 窗口 resize 时为什么更新 Stage 尺寸，而不是重新创建 Stage。
