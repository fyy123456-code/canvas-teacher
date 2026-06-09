# Lesson 03.1：把临时 viewport 偏移抽成 Viewport 类

## 本节目标

上一节我们直接在 `InfiniteCanvas` 里写：

```ts
layer.position({
  x: 200,
  y: 100,
});
```

这能演示 viewport 偏移，但它只是硬编码。

本节把这个逻辑抽成正式的 `Viewport` 类：

```ts
viewport.x
viewport.y
viewport.scale
viewport.applyToLayer(layer)
```

本节完成后，视觉效果还是一样：网格和图片整体向右偏移 200px、向下偏移 100px。

区别是：偏移不再写死在 `InfiniteCanvas` 里，而是由 `Viewport` 对象控制。

## 本节不会做什么

- 不做滚轮缩放
- 不做手型拖拽画布
- 不做坐标转换
- 不做无限网格
- 不做工具栏模式切换

这一步只做 viewport 的结构。

## 为什么要抽成 Viewport 类

因为后续所有视口行为都会围绕这 3 个值：

```ts
x
y
scale
```

它们分别表示：

```text
x：整个画布内容层向左右偏移多少
y：整个画布内容层向上下偏移多少
scale：整个画布内容层缩放多少
```

如果这些值散落在 `InfiniteCanvas` 里，后面做滚轮缩放、拖动画布、坐标转换会很乱。

抽成 `Viewport` 后，`InfiniteCanvas` 只需要说：

```ts
store.viewport.applyToLayer(layer);
```

至于怎么设置 layer 的位置和缩放，由 `Viewport` 自己负责。

## 本节改动文件

按顺序改 5 个文件：

```text
src/viewport/Viewport.ts
src/viewport/index.ts
src/store/workspaceStore.ts
src/canvas/canvasConfig.ts
src/canvas/InfiniteCanvas.tsx
```

## 第 1 步：创建 `src/viewport/Viewport.ts`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/viewport/Viewport.ts
```

### 写入代码

```ts
import Konva from 'konva';

export interface ViewportConfig {
  x?: number;
  y?: number;
  scale?: number;
}

export class Viewport {
  x: number;
  y: number;
  scale: number;

  constructor(config: ViewportConfig = {}) {
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.scale = config.scale ?? 1;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setScale(scale: number) {
    this.scale = scale;
  }

  applyToLayer(layer: Konva.Layer) {
    layer.position({
      x: this.x,
      y: this.y,
    });
    layer.scale({
      x: this.scale,
      y: this.scale,
    });
    layer.batchDraw();
  }
}
```

### 为什么这样写

`Viewport` 现在只保存 3 个值：

```ts
x
y
scale
```

`applyToLayer` 是最关键的方法。它把 viewport 状态应用到 Konva layer：

```ts
layer.position(...)
layer.scale(...)
```

这就是 viewport 和 Konva 画布之间的连接点。

## 第 2 步：创建 `src/viewport/index.ts`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/viewport/index.ts
```

### 写入代码

```ts
export { Viewport } from './Viewport';
export type { ViewportConfig } from './Viewport';
```

### 为什么这样写

这是 viewport 模块的统一出口。

之后外部导入时可以写：

```ts
import { Viewport } from '../viewport';
```

不用关心内部文件名。

## 第 3 步：修改 `src/store/workspaceStore.ts`

### 修改位置 1：新增 Viewport 导入

找到：

```ts
import { makeAutoObservable, observable } from 'mobx';
```

下面新增：

```ts
import { Viewport } from '../viewport';
```

### 修改位置 2：给配置增加 viewport

找到：

```ts
export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
  elements?: CanvasElement[];
}
```

改成：

```ts
export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
  elements?: CanvasElement[];
  viewport?: Viewport;
}
```

### 为什么这样改

这样以后创建 store 时可以传入自定义 viewport。

当前课程先用默认 viewport。

### 修改位置 3：给 store 增加 viewport 字段

找到：

```ts
elements: CanvasElement[];
stage: Konva.Stage | null = null;
layer: Konva.Layer | null = null;
```

改成：

```ts
elements: CanvasElement[];
viewport: Viewport;
stage: Konva.Stage | null = null;
layer: Konva.Layer | null = null;
```

### 修改位置 4：constructor 里创建 viewport

找到：

```ts
this.elements = config.elements ?? [];
```

下面新增：

```ts
this.viewport =
  config.viewport ??
  new Viewport({
    x: 200,
    y: 100,
    scale: 1,
  });
```

### 为什么这样改

这里保留上一节的演示效果：

```ts
x: 200
y: 100
scale: 1
```

但它已经从 `InfiniteCanvas` 的硬编码，变成了 `store.viewport` 的状态。

### 修改位置 5：makeAutoObservable 增加 viewport 配置

找到：

```ts
makeAutoObservable(this, {
  stage: observable.ref,
  layer: observable.ref,
});
```

改成：

```ts
makeAutoObservable(this, {
  viewport: observable.ref,
  stage: observable.ref,
  layer: observable.ref,
});
```

### 为什么这样改

`viewport` 是一个类实例。这里先用 `observable.ref`，表示 MobX 只追踪这个引用本身，不深度改造它的内部。

后面正式做缩放和拖动画布时，我们会控制什么时候把 viewport 变化应用到 layer。

## 第 4 步：修改 `src/canvas/canvasConfig.ts`

### 修改位置

删除上一节的临时常量：

```ts
export const VIEWPORT_DEMO_OFFSET = {
  x: 200,
  y: 100,
} as const;
```

### 为什么这样改

临时演示值已经迁移到：

```ts
new Viewport({
  x: 200,
  y: 100,
  scale: 1,
})
```

`canvasConfig.ts` 不再负责 viewport 状态。

## 第 5 步：修改 `src/canvas/InfiniteCanvas.tsx`

### 修改位置 1：移除临时常量导入

找到：

```ts
import { CANVAS_BACKGROUND_COLOR, VIEWPORT_DEMO_OFFSET } from './canvasConfig';
```

改成：

```ts
import { CANVAS_BACKGROUND_COLOR } from './canvasConfig';
```

### 修改位置 2：用 viewport 应用 layer 位置

找到：

```ts
const layer = new Konva.Layer();
layer.position(VIEWPORT_DEMO_OFFSET);
```

改成：

```ts
const layer = new Konva.Layer();
store.viewport.applyToLayer(layer);
```

### 为什么这样改

`InfiniteCanvas` 不再关心 viewport 的具体数字。

它只负责创建 layer，然后把 layer 交给 viewport：

```ts
store.viewport.applyToLayer(layer)
```

这样职责更清楚：

```text
InfiniteCanvas：创建 Konva Stage / Layer
Viewport：控制 Layer 的位置和缩放
```

## 本节完成后你应该看到

视觉效果和上一节一样：

```text
网格整体向右偏移 200px
网格整体向下偏移 100px
图片也跟着内容层一起偏移
```

但代码结构已经变了：

```text
硬编码 layer.position
  -> store.viewport.applyToLayer(layer)
```

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。

## 本节你需要理解

1. `Viewport` 不是 UI，它是画布视角控制对象。
2. `Viewport.x / y / scale` 控制的是整个内容层，不是元素自身。
3. `applyToLayer(layer)` 是 viewport 作用到 Konva 的地方。
4. 为什么 `InfiniteCanvas` 不应该长期保存硬编码偏移值。
5. 为什么本节还不做滚轮缩放和手型拖拽。
