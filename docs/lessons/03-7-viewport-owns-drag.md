# Lesson 03.7：让 Viewport 接管手型拖拽

## 本节目标

上一节我们已经能用手型模式拖动画布，但拖拽逻辑分散在：

```text
src/store/workspaceStore.ts
src/canvas/InfiniteCanvas.tsx
```

这和 `ai-design-canvas` 不一致。

`ai-design-canvas` 的做法是：

```text
Viewport 类持有 stage / layer
Viewport 类监听 mousedown / mousemove / mouseup
Viewport 类直接修改 layer.position
```

所以本节要把拖拽逻辑迁回 `Viewport`。

## 本节不会做什么

- 不做两指触摸板滑动
- 不做 wheel 缩放
- 不做框选
- 不做 Transformer
- 不做选中逻辑

本节只做架构调整：让 `Viewport` 接管手型拖拽。

## 本节改动文件

按顺序改 5 个文件：

```text
src/viewport/Viewport.ts
src/store/workspaceStore.ts
src/canvas/InfiniteCanvas.tsx
src/components/toolbar/Toolbar.tsx
src/canvas/CanvasElements.tsx
```

## 第 1 步：修改 `src/viewport/Viewport.ts`

### 修改位置 1：给 Viewport 增加 stage / layer 引用

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/viewport/Viewport.ts
```

找到：

```ts
export class Viewport {
  x: number;
  y: number;
  scale: number;
```

在下面新增：

```ts
private stage: Konva.Stage | null = null;
private layer: Konva.Layer | null = null;
private viewportDragMode = false;
private isDragging = false;
private lastPointer: ViewportPoint | null = null;
private onTransformChange: (() => void) | null = null;
```

### 为什么这样改

`Viewport` 要自己拖动画布，就必须知道两个对象：

```text
stage：接收鼠标事件
layer：真正被移动和缩放的画布层
```

`viewportDragMode` 表示当前是否开启手型拖拽。

`isDragging` 表示当前是否正在按住鼠标拖。

`lastPointer` 用来记录上一次鼠标位置，用当前位置减去它，就能得到本次移动距离。

### 修改位置 2：新增 attach / destroy

在 constructor 下面新增：

```ts
attach(stage: Konva.Stage, layer: Konva.Layer, onTransformChange?: () => void) {
  this.destroy();
  this.stage = stage;
  this.layer = layer;
  this.onTransformChange = onTransformChange ?? null;
  this.applyToLayer(layer);

  stage.on('mousedown', this.handleStageMouseDown);
  window.addEventListener('mousemove', this.handleWindowMouseMove);
  window.addEventListener('mouseup', this.handleWindowMouseUp);
}

destroy() {
  this.stage?.off('mousedown', this.handleStageMouseDown);
  window.removeEventListener('mousemove', this.handleWindowMouseMove);
  window.removeEventListener('mouseup', this.handleWindowMouseUp);
  this.stage = null;
  this.layer = null;
  this.onTransformChange = null;
  this.isDragging = false;
  this.lastPointer = null;
}
```

### 为什么这样改

`attach` 的意思是：

```text
把真实的 Konva stage / layer 交给 Viewport
```

之后 Viewport 才能监听鼠标事件、移动 layer。

`destroy` 是反向操作：

```text
组件卸载时解绑事件，清空引用
```

这样不会重复绑定事件，也不会产生内存泄漏。

### 修改位置 3：新增 setViewportDragMode

在 `destroy` 后面新增：

```ts
setViewportDragMode(status: boolean) {
  this.viewportDragMode = status;

  if (!status && this.isDragging) {
    this.endDrag();
    return;
  }

  this.setCursor(status ? 'grab' : 'default');
}
```

### 为什么这样改

这和 `ai-design-canvas` 一致：工具栏不直接处理拖拽，只告诉 Viewport：

```text
现在是否进入手型拖拽模式
```

开启时鼠标是 `grab`。

关闭时鼠标恢复 `default`。

如果正在拖拽时关闭模式，就先结束拖拽。

### 修改位置 4：让 setPosition / setScale 自动同步 layer

找到：

```ts
setPosition(x: number, y: number) {
  this.x = x;
  this.y = y;
}
```

改成：

```ts
setPosition(x: number, y: number) {
  this.x = x;
  this.y = y;
  this.syncLayer();
}
```

找到：

```ts
setScale(scale: number) {
  this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
```

改成：

```ts
setScale(scale: number) {
  this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  this.syncLayer();
}
```

### 为什么这样改

以前 store 调用：

```ts
viewport.setScale(...)
store.applyViewport()
```

现在 Viewport 持有 layer，所以应该是：

```ts
viewport.setScale(...)
```

然后 Viewport 自己同步到 layer。

### 修改位置 5：修改 zoomAt

找到 `zoomAt` 里最后两行：

```ts
this.setScale(nextScale);
this.setPosition(screenPoint.x - worldPoint.x * this.scale, screenPoint.y - worldPoint.y * this.scale);
```

改成：

```ts
this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
this.x = screenPoint.x - worldPoint.x * this.scale;
this.y = screenPoint.y - worldPoint.y * this.scale;
this.syncLayer();
```

### 为什么这样改

`zoomAt` 同时要改：

```text
scale
x
y
```

如果分别调用 `setScale` 和 `setPosition`，会同步两次 layer。

这里一次性算完，再同步一次，更清楚。

### 修改位置 6：新增拖拽方法

在 `applyToLayer` 后面新增：

```ts
private handleStageMouseDown = () => {
  if (!this.viewportDragMode) {
    return;
  }

  this.startDrag();
};

private handleWindowMouseMove = (event: MouseEvent) => {
  if (!this.isDragging || !this.stage) {
    return;
  }

  const rect = this.stage.container().getBoundingClientRect();
  this.doDrag({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
};

private handleWindowMouseUp = () => {
  this.endDrag();
};

private startDrag() {
  if (!this.stage) {
    return;
  }

  this.isDragging = true;
  this.lastPointer = this.stage.getPointerPosition();
  this.setCursor('grabbing');
}

private doDrag(pointer: ViewportPoint) {
  if (!this.lastPointer) {
    return;
  }

  const deltaX = pointer.x - this.lastPointer.x;
  const deltaY = pointer.y - this.lastPointer.y;

  this.moveBy(deltaX, deltaY);
  this.lastPointer = pointer;
}

private endDrag() {
  if (!this.isDragging) {
    return;
  }

  this.isDragging = false;
  this.lastPointer = null;
  this.setCursor(this.viewportDragMode ? 'grab' : 'default');
}

private setCursor(cursor: string) {
  if (!this.stage) {
    return;
  }

  this.stage.container().style.cursor = cursor;
}

private syncLayer() {
  if (!this.layer) {
    return;
  }

  this.applyToLayer(this.layer);
  this.onTransformChange?.();
}
```

### 为什么这样改

这就是 `ai-design-canvas` 的核心模型：

```text
mousedown：开始拖拽
mousemove：计算 dx / dy，移动 layer
mouseup：结束拖拽
```

这里监听 `window.mousemove` 和 `window.mouseup`，不是只监听 stage。

原因是：鼠标拖着拖着可能离开画布区域，如果只监听 stage，松开鼠标时不一定能收到事件。

## 第 2 步：修改 `src/store/workspaceStore.ts`

### 修改位置 1：删除 ViewportDragState

删除：

```ts
export interface ViewportDragState {
  lastX: number;
  lastY: number;
}
```

### 修改位置 2：删除 viewportDragState 字段

删除：

```ts
viewportDragState: ViewportDragState | null = null;
```

### 修改位置 3：删除 makeAutoObservable 配置

删除：

```ts
viewportDragState: observable.ref,
```

### 修改位置 4：删除三个拖拽方法

删除：

```ts
startViewportDrag(...)
dragViewportTo(...)
endViewportDrag()
```

### 修改位置 5：zoomInViewport / zoomOutViewport 删除 applyViewport

把：

```ts
this.viewport.zoomInAt(...);
this.applyViewport();
```

改成：

```ts
this.viewport.zoomInAt(...);
```

`zoomOutViewport` 同理。

### 为什么这样改

store 不再管理拖拽过程。

现在 store 的角色是：

```text
保存业务状态
提供按钮调用入口
```

Viewport 的角色是：

```text
控制 layer 的位置和缩放
处理鼠标拖拽
```

## 第 3 步：修改 `src/canvas/InfiniteCanvas.tsx`

### 修改位置 1：删除 pointer 事件

删除上一节新增的这些内容：

```ts
const handlePointerDown = ...
const handlePointerMove = ...
const handlePointerUp = ...

stage.on('pointerdown', ...)
stage.on('pointermove', ...)
stage.on('pointerup pointerleave', ...)
```

cleanup 里也删除：

```ts
stage.off('pointerdown', ...)
stage.off('pointermove', ...)
stage.off('pointerup pointerleave', ...)
```

### 修改位置 2：把 stage/layer 交给 viewport

找到：

```ts
store.setRefreshGrid(() => {
  ...
});
setLayer(layer);
```

在它们中间新增：

```ts
store.viewport.attach(stage, layer, () => {
  store.refreshGrid?.();
});
```

### 修改位置 3：cleanup 时销毁 viewport

找到：

```ts
return () => {
  stage.destroy();
```

在 `stage.destroy()` 前面新增：

```ts
store.viewport.destroy();
```

### 为什么这样改

`InfiniteCanvas` 不再处理手型拖拽，它只负责：

```text
创建 stage
创建 layer
把 stage / layer 交给 Viewport
```

这和 `ai-design-canvas` 的方向一致。

## 第 4 步：修改 `src/components/toolbar/Toolbar.tsx`

### 修改位置 1：引入 observer

文件顶部新增：

```ts
import { observer } from 'mobx-react-lite';
```

### 修改位置 2：把 Toolbar 包成 observer

把：

```ts
export function Toolbar() {
  ...
}
```

改成：

```ts
export const Toolbar = observer(() => {
  ...
});
```

### 为什么这样改

Toolbar 里读取了：

```ts
store.editMode
```

读取 MobX 状态的 React 组件要用 `observer` 包起来，否则状态变化时 UI 不一定重新渲染。

这和 `ai-design-canvas` 的 toolbar 一样。

### 修改位置 3：手型按钮调用 viewport

找到：

```ts
store.setEditMode(store.editMode === 'viewport-drag' ? 'select' : 'viewport-drag');
```

改成：

```ts
const nextMode = store.editMode === 'viewport-drag' ? 'select' : 'viewport-drag';
store.setEditMode(nextMode);
store.viewport.setViewportDragMode(nextMode === 'viewport-drag');
```

### 为什么这样改

`editMode` 是业务状态。

`setViewportDragMode` 是 Viewport 的真实拖拽开关。

两者都要设置。

## 第 5 步：修改 `src/canvas/CanvasElements.tsx`

### 修改位置 1：读取是否是手型模式

找到：

```ts
const elementSnapshot = elements.slice();
```

下面新增：

```ts
const isViewportDragMode = store.editMode === 'viewport-drag';
```

### 修改位置 2：创建图片节点时控制 draggable

找到：

```ts
draggable: true,
```

改成：

```ts
draggable: !isViewportDragMode,
```

### 修改位置 3：手型模式变化时更新已有节点

在第一个 `useEffect` 后面新增：

```ts
useEffect(() => {
  const nodeMap = nodeMapRef.current;
  nodeMap.forEach((node) => {
    node.draggable(!isViewportDragMode);
    node.listening(!isViewportDragMode);
  });
  layer?.batchDraw();
}, [isViewportDragMode, layer]);
```

### 为什么这样改

`ai-design-canvas` 在 `viewport-drag` 模式下会让元素不能拖拽。

原因是：

```text
手型模式：拖的是画布
选择模式：拖的是图片
```

如果手型模式下图片还 draggable，鼠标按在图片上时图片和画布会抢交互。

## 本节完成后你应该看到

1. 点击左侧“手”。
2. 鼠标进入画布变成 `grab`。
3. 按住拖拽时变成 `grabbing`。
4. 拖动画布时，图片和网格整体移动。
5. 手型模式下按住图片，也应该是移动画布，不是移动图片。
6. 再次点击“手”回到选择模式后，图片可以继续单独拖拽。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
