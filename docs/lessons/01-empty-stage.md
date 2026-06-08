# Lesson 01：按 ai-design-canvas 方式渲染空白 Konva Stage

## 本节目标

本节只做一件事：用和 `ai-design-canvas` 一致的方式渲染一个空白 `Konva Stage`。

这里的“一致”不是只用同一个技术栈，而是底层架构一致：React 只负责 DOM 容器和生命周期，Konva 节点使用命令式 API 创建和管理。

本节不做图片、文本、拖拽、缩放、选中、Transformer，只搭好后续功能必须依赖的画布骨架。

## 本节知识点

1. `Stage` 是 Konva 的画布根容器。
2. `Layer` 是 `Stage` 下的绘制层。
3. `ai-design-canvas` 使用 `new Konva.Stage()`、`new Konva.Layer()` 命令式创建画布。
4. React 在这里负责 `ref`、生命周期和组件边界，不直接声明 `<Stage>`、`<Layer>`。
5. `StoreProvider`、`useStore`、`createWorkSpaceStore` 是后续状态流的基础。

## 必须遵守的架构约束

后续画布功能必须参考 `ai-design-canvas` 的对应实现。

本项目不使用 `react-konva` 的声明式写法作为核心画布架构：

```tsx
<Stage>
  <Layer />
</Stage>
```

本项目使用和 `ai-design-canvas` 一致的命令式写法：

```ts
const stage = new Konva.Stage({
  container: containerRef.current,
  width,
  height,
});

const layer = new Konva.Layer();
stage.add(layer);
```

## 改动文件

- `package.json`：移除 `react-konva`，核心版本对齐 `ai-design-canvas`。
- `src/store/workspaceStore.ts`：创建最小 workspace store。
- `src/store/StoreContext.tsx`：创建 `StoreProvider` 和 `useStore`。
- `src/store/index.ts`：统一导出 store 模块。
- `src/canvas/types.ts`：定义画布尺寸类型。
- `src/canvas/canvasConfig.ts`：保存默认画布尺寸和背景色。
- `src/canvas/InfiniteCanvas.tsx`：命令式创建 Konva Stage、Layer、背景矩形。
- `src/canvas/CanvasElements.tsx`：预留元素渲染入口。
- `src/canvas/CanvasWorkspace.tsx`：封装工作区和 StoreProvider。
- `src/canvas/index.ts`：统一导出 canvas 模块。
- `src/App.tsx`：只渲染 `CanvasWorkspace`。
- `src/styles/index.scss`：增加工作区和画布容器样式。

## 和 ai-design-canvas 的对应关系

```text
ai-design-canvas/src/workSpace/index.tsx
  -> canvas-teacher/src/canvas/CanvasWorkspace.tsx

ai-design-canvas/src/workSpace/InfiniteCanvas.tsx
  -> canvas-teacher/src/canvas/InfiniteCanvas.tsx

ai-design-canvas/src/workSpace/CanvasElements.tsx
  -> canvas-teacher/src/canvas/CanvasElements.tsx

ai-design-canvas/src/store/workSpaceStore.ts
  -> canvas-teacher/src/store/workspaceStore.ts

ai-design-canvas/src/store/StoreContext.tsx
  -> canvas-teacher/src/store/StoreContext.tsx
```

当前课程项目会减少业务分支、后端依赖和 AI 工具，但不会更换核心画布架构路线。

## 画布结构

本节完成后的结构是：

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
        CanvasElements
```

### `CanvasWorkspace`

负责创建 store，并把 store 通过 `StoreProvider` 传给子组件。

它对应 `ai-design-canvas/src/workSpace/index.tsx`。

### `InfiniteCanvas`

负责创建和销毁 Konva 实例：

- `new Konva.Stage()`
- `new Konva.Layer()`
- `new Konva.Rect()`

它对应 `ai-design-canvas/src/workSpace/InfiniteCanvas.tsx`。

### `CanvasElements`

当前先返回 `null`，因为本节还没有元素。

后续图片、文本、分组都会从这里开始做，和 `ai-design-canvas/src/workSpace/CanvasElements.tsx` 保持同一思路：根据 store 里的元素数据创建或更新 Konva 节点。

## 关键代码解释

### `src/store/workspaceStore.ts`

```ts
export class WorkSpaceStore {
  width: number;
  height: number;
  elements: CanvasElement[];
  stage: Konva.Stage | null = null;
  layer: Konva.Layer | null = null;
}
```

这一节只保存最基础的信息：

- 画布宽高
- 元素列表
- 当前 `stage`
- 当前主 `layer`

后续选中状态、编辑模式、历史记录、视口对象都会继续加到这个 store。

### `src/store/StoreContext.tsx`

```tsx
const StoreContext = createContext<WorkSpaceStore | null>(null);

export function StoreProvider({ store, children }: StoreProviderProps) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): WorkSpaceStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used inside StoreProvider.');
  }

  return store;
}
```

这个结构对应 `ai-design-canvas` 的 `StoreContext`。

后续任何组件只要调用 `useStore()`，就能拿到同一个 workspace store。

### `src/canvas/InfiniteCanvas.tsx`

```tsx
const wrapperRef = useRef<HTMLDivElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
const stageRef = useRef<Konva.Stage | null>(null);
const layerRef = useRef<Konva.Layer | null>(null);
const interactionLayerRef = useRef<Konva.Layer | null>(null);
```

这些 ref 对应 `ai-design-canvas` 的核心写法。

- `wrapperRef`：整个画布工作区外壳。
- `containerRef`：Konva Stage 挂载的真实 DOM 容器。
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

这就是本节最重要的代码。React 不直接声明 Konva 节点，而是在 `useEffect` 中命令式创建。

## 逐文件手写步骤

下面这部分是你在 `canvas-student` 中手写 Lesson 01 时的操作顺序。每一步只改一个文件，按顺序写。

### 第 1 步：修改 `package.json`

这个文件负责依赖版本。为了和 `ai-design-canvas` 保持一致，先移除 `react-konva`，并调整核心版本。

把依赖改成：

```json
{
  "dependencies": {
    "konva": "^10.0.12",
    "mobx": "^6.15.0",
    "mobx-react-lite": "^4.1.0",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "sass": "^1.94.2",
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
```

为什么先改它：后面的代码会直接 `import Konva from 'konva'`，不再使用 `react-konva`。

写完后检查：确认 `package.json` 中没有 `react-konva`。

### 第 2 步：创建 `src/store/workspaceStore.ts`

这个文件负责创建 workspace store。

写入：

```ts
import Konva from 'konva';
import { makeAutoObservable, observable } from 'mobx';

export type CanvasElement = never;

export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
  elements?: CanvasElement[];
}

export class WorkSpaceStore {
  width: number;
  height: number;
  elements: CanvasElement[];
  stage: Konva.Stage | null = null;
  layer: Konva.Layer | null = null;

  constructor(config: WorkSpaceStoreConfig = {}) {
    this.width = config.width ?? window.innerWidth;
    this.height = config.height ?? window.innerHeight;
    this.elements = config.elements ?? [];

    makeAutoObservable(this, {
      stage: observable.ref,
      layer: observable.ref,
    });
  }

  setStage(stage: Konva.Stage | null) {
    this.stage = stage;
  }

  setLayer(layer: Konva.Layer | null) {
    this.layer = layer;
  }
}

export function createWorkSpaceStore(config: WorkSpaceStoreConfig = {}) {
  return new WorkSpaceStore(config);
}
```

为什么这样写：`ai-design-canvas` 也是通过 `createWorkSpaceStore` 创建工作区状态。当前先只放 Stage、Layer 和元素列表。

写完后检查：确认函数名是 `createWorkSpaceStore`，不是 `createWorkspaceStore`。这里故意贴近原项目命名。

### 第 3 步：创建 `src/store/StoreContext.tsx`

这个文件负责在 React 组件树中传递 store。

写入：

```tsx
import { createContext, useContext } from 'react';
import type { WorkSpaceStore } from './workspaceStore';

const StoreContext = createContext<WorkSpaceStore | null>(null);

export interface StoreProviderProps {
  store: WorkSpaceStore;
  children: React.ReactNode;
}

export function StoreProvider({ store, children }: StoreProviderProps) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): WorkSpaceStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used inside StoreProvider.');
  }

  return store;
}
```

为什么这样写：后续 `InfiniteCanvas`、`CanvasElements`、工具栏都需要访问同一个 store。

写完后检查：确认 `useStore` 没有静默返回 `null`，否则后续错误会更难定位。

### 第 4 步：创建 `src/store/index.ts`

这个文件负责统一导出 store 模块。

写入：

```ts
export { StoreProvider, useStore } from './StoreContext';
export { createWorkSpaceStore } from './workspaceStore';
export type { CanvasElement, WorkSpaceStore, WorkSpaceStoreConfig } from './workspaceStore';
```

为什么这样写：外部可以从 `../store` 统一导入，不需要知道内部文件。

写完后检查：确认 `StoreProvider` 和 `createWorkSpaceStore` 都能导出。

### 第 5 步：创建 `src/canvas/types.ts`

这个文件负责放画布模块基础类型。

写入：

```ts
export interface CanvasSize {
  width: number;
  height: number;
}
```

为什么这样写：当前只需要尺寸类型。图层使用 ref 保存，不再用 `react-konva` 的 Layer id 类型。

写完后检查：确认没有 `CanvasLayerId`。

### 第 6 步：创建 `src/canvas/canvasConfig.ts`

这个文件负责放画布默认配置。

写入：

```ts
import type { CanvasSize } from './types';

export const DEFAULT_STAGE_SIZE: CanvasSize = {
  width: 960,
  height: 540,
};

export const CANVAS_BACKGROUND_COLOR = '#ffffff';
```

为什么这样写：画布默认尺寸和背景色集中在一个位置，后续调整尺寸时不需要改组件内部。

写完后检查：确认尺寸是 960 x 540。

### 第 7 步：创建 `src/canvas/CanvasElements.tsx`

这个文件负责后续元素渲染入口。

写入：

```tsx
import type Konva from 'konva';
import type { CanvasElement } from '../store/workspaceStore';

export interface CanvasElementsProps {
  layer: Konva.Layer | null;
  elements: CanvasElement[];
}

export function CanvasElements(_props: CanvasElementsProps) {
  return null;
}
```

为什么现在返回 `null`：本节还没有元素。先把入口建好，下一节画矩形或图片时会从这里开始扩展。

写完后检查：确认这个组件没有返回任何 DOM 节点。

### 第 8 步：创建 `src/canvas/InfiniteCanvas.tsx`

这个文件是本节核心，负责命令式创建 Konva Stage 和 Layer。

写入：

```tsx
import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store/StoreContext';
import { CANVAS_BACKGROUND_COLOR, DEFAULT_STAGE_SIZE } from './canvasConfig';
import { CanvasElements } from './CanvasElements';
import type { CanvasSize } from './types';

export interface InfiniteCanvasProps {
  width?: number;
  height?: number;
}

export function InfiniteCanvas({
  width = DEFAULT_STAGE_SIZE.width,
  height = DEFAULT_STAGE_SIZE.height,
}: InfiniteCanvasProps) {
  const store = useStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const interactionLayerRef = useRef<Konva.Layer | null>(null);
  const [layer, setLayer] = useState<Konva.Layer | null>(null);

  const stageSize = useMemo<CanvasSize>(() => ({ width, height }), [width, height]);

  useEffect(() => {
    if (!containerRef.current || stageRef.current) {
      return;
    }

    const stage = new Konva.Stage({
      container: containerRef.current,
      width: stageSize.width,
      height: stageSize.height,
    });

    const layer = new Konva.Layer();
    const interactionLayer = new Konva.Layer();
    const background = new Konva.Rect({
      name: 'canvas-background',
      x: 0,
      y: 0,
      width: stageSize.width,
      height: stageSize.height,
      fill: CANVAS_BACKGROUND_COLOR,
      listening: false,
    });

    layer.add(background);
    stage.add(layer);
    stage.add(interactionLayer);

    stageRef.current = stage;
    layerRef.current = layer;
    interactionLayerRef.current = interactionLayer;
    store.setStage(stage);
    store.setLayer(layer);
    setLayer(layer);

    layer.draw();
    interactionLayer.draw();

    return () => {
      stage.destroy();
      stageRef.current = null;
      layerRef.current = null;
      interactionLayerRef.current = null;
      store.setStage(null);
      store.setLayer(null);
      setLayer(null);
    };
  }, [store]);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) {
      return;
    }

    stage.width(stageSize.width);
    stage.height(stageSize.height);

    const background = layer.findOne('.canvas-background');
    background?.setAttrs({
      width: stageSize.width,
      height: stageSize.height,
    });

    layer.batchDraw();
  }, [stageSize.height, stageSize.width]);

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      width: stageSize.width,
      height: stageSize.height,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: CANVAS_BACKGROUND_COLOR,
    }),
    [stageSize.height, stageSize.width],
  );

  return (
    <div ref={wrapperRef} className="canvas-wrapper" data-infinite-canvas-wrapper="true">
      <div ref={containerRef} className="canvas-container" data-infinite-canvas-children="true" style={containerStyle}>
        <CanvasElements layer={layer} elements={store.elements} />
      </div>
    </div>
  );
}
```

为什么这样写：这和 `ai-design-canvas` 的 `InfiniteCanvas` 一样，核心 Konva 节点由 `useEffect` 内的命令式代码创建。

写完后检查：确认文件中出现的是 `new Konva.Stage()` 和 `new Konva.Layer()`，不是 `<Stage>` 和 `<Layer>`。

### 第 9 步：创建 `src/canvas/CanvasWorkspace.tsx`

这个文件负责创建 store，并提供给画布。

写入：

```tsx
import { useMemo } from 'react';
import { StoreProvider } from '../store';
import { createWorkSpaceStore } from '../store/workspaceStore';
import { InfiniteCanvas } from './InfiniteCanvas';
import { DEFAULT_STAGE_SIZE } from './canvasConfig';

export function CanvasWorkspace() {
  const store = useMemo(
    () =>
      createWorkSpaceStore({
        width: DEFAULT_STAGE_SIZE.width,
        height: DEFAULT_STAGE_SIZE.height,
      }),
    [],
  );

  return (
    <StoreProvider store={store}>
      <main className="workspace-container">
        <header className="workspace-header">
          <div>
            <p className="lesson-label">Lesson 01</p>
            <h1>命令式 Konva Stage</h1>
          </div>
          <div className="stage-meta">
            {DEFAULT_STAGE_SIZE.width} x {DEFAULT_STAGE_SIZE.height}
          </div>
        </header>

        <section className="workspace-body" aria-label="Canvas workspace">
          <InfiniteCanvas width={DEFAULT_STAGE_SIZE.width} height={DEFAULT_STAGE_SIZE.height} />
        </section>
      </main>
    </StoreProvider>
  );
}
```

为什么这样写：`CanvasWorkspace` 对齐原项目 `workSpace/index.tsx`，它负责准备 store 和工作区 UI。

写完后检查：确认 `createWorkSpaceStore` 只创建一次，所以用了 `useMemo`。

### 第 10 步：创建 `src/canvas/index.ts`

这个文件负责统一导出 canvas 模块。

写入：

```ts
export { CanvasWorkspace } from './CanvasWorkspace';
export { InfiniteCanvas } from './InfiniteCanvas';
export { DEFAULT_STAGE_SIZE } from './canvasConfig';
export type { CanvasSize } from './types';
```

为什么这样写：`App.tsx` 可以从 `./canvas` 导入，不依赖内部文件结构。

写完后检查：确认没有导出 `CanvasStage`。

### 第 11 步：修改 `src/App.tsx`

这个文件只负责接入工作区。

写入：

```tsx
import { CanvasWorkspace } from './canvas';

export function App() {
  return <CanvasWorkspace />;
}
```

为什么这样写：`App` 保持很薄，画布复杂度不放在这里。

写完后检查：确认 `App.tsx` 没有任何 Konva 代码。

### 第 12 步：修改 `src/styles/index.scss`

这个文件负责工作区布局和画布容器样式。

关键样式：

```scss
.workspace-container {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  background: #eef2f7;
}

.workspace-body {
  display: grid;
  min-height: 0;
  place-items: center;
  overflow: auto;
  padding: 40px;
}

.canvas-wrapper {
  position: relative;
  flex: none;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 45px rgb(31 41 55 / 12%);
  overflow: hidden;
}

.canvas-container {
  position: relative;
}
```

为什么这样写：React 外层负责布局，Konva Stage 挂载在 `.canvas-container` 中。

写完后检查：确认页面上能看到居中的白色画布区域。

### 第 13 步：安装并验证

运行：

```bash
pnpm install
pnpm typecheck
pnpm build
```

为什么最后检查：依赖、store、context、命令式 Konva 初始化都需要通过完整验证。

写完后检查：两条验证命令都通过，浏览器页面能看到 `Lesson 01` 和空白画布。

## 学生手写任务

在 `/Users/fyy/Desktop/projects/canvas-student` 中按“逐文件手写步骤”完成同样的结构。

本节重点不是写出更多功能，而是把底层架构改成和 `ai-design-canvas` 一致。

手写完成后运行：

```bash
pnpm install
pnpm typecheck
pnpm build
```

## 常见错误

### 继续使用 `react-konva`

本课程后续必须和 `ai-design-canvas` 保持一致，所以不要再写：

```tsx
<Stage>
  <Layer />
</Stage>
```

应该使用：

```ts
new Konva.Stage(...)
new Konva.Layer()
```

### 忘记传 `container`

`new Konva.Stage()` 必须接收真实 DOM 容器：

```ts
container: containerRef.current
```

如果没有 container，Konva 不知道要把 canvas 挂到哪里。

### 没有在卸载时销毁 Stage

必须在 `useEffect` 的 cleanup 里写：

```ts
stage.destroy();
```

否则热更新或组件卸载后可能留下旧 canvas 和事件监听。

## 小练习

完成 `canvas-student` 后，尝试在 `InfiniteCanvas.tsx` 里临时把背景色改成：

```ts
fill: '#f8fafc'
```

观察画布背景变化。确认后再改回 `CANVAS_BACKGROUND_COLOR`，并重新运行：

```bash
pnpm typecheck
pnpm build
```
