# Lesson 03.6：手型模式拖动画布 viewport

## 本节目标

上一节左侧工具栏已经有“手”按钮，可以切换：

```ts
store.editMode === 'viewport-drag'
```

本节让这个模式真正生效：

```text
手型模式下，按住空白画布拖动
  -> 更新 viewport.x / viewport.y
  -> applyViewport()
  -> 网格和图片整体移动
```

## 本节不会做什么

- 不做滚轮缩放
- 不做框选
- 不做选中
- 不做 Transformer
- 不做空格临时手型
- 不做拖拽图片时移动画布

这一步只做“手型模式下拖空白画布”。

## 本节改动文件

按顺序改 3 个文件：

```text
src/viewport/Viewport.ts
src/store/workspaceStore.ts
src/canvas/InfiniteCanvas.tsx
```

## 第 1 步：修改 `src/viewport/Viewport.ts`

### 修改位置

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/viewport/Viewport.ts
```

找到：

```ts
setPosition(x: number, y: number) {
  this.x = x;
  this.y = y;
}
```

在它下面新增：

```ts
moveBy(deltaX: number, deltaY: number) {
  this.setPosition(this.x + deltaX, this.y + deltaY);
}
```

### 为什么这样改

拖动画布时，我们拿到的是鼠标移动了多少：

```text
deltaX
deltaY
```

所以 viewport 需要一个方法表示：

```text
在当前 x/y 基础上继续移动一段距离
```

这就是 `moveBy`。

## 第 2 步：修改 `src/store/workspaceStore.ts`

### 修改位置 1：新增拖拽状态类型

找到：

```ts
export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
  elements?: CanvasElement[];
  viewport?: Viewport;
}
```

在它下面新增：

```ts
export interface ViewportDragState {
  lastX: number;
  lastY: number;
}
```

### 为什么这样改

拖动画布时需要记住上一次鼠标位置。

下一次鼠标移动时，用当前位置减去上一次位置，得到移动距离。

### 修改位置 2：给 store 增加拖拽状态

找到：

```ts
refreshGrid: (() => void) | null = null;
```

在下面新增：

```ts
viewportDragState: ViewportDragState | null = null;
```

### 修改位置 3：makeAutoObservable 增加配置

找到：

```ts
refreshGrid: observable.ref,
```

在下面新增：

```ts
viewportDragState: observable.ref,
```

### 修改位置 4：新增三个拖拽方法

在 `zoomOutViewport` 后面新增：

```ts
startViewportDrag(point: ViewportDragState) {
  this.viewportDragState = point;
}

dragViewportTo(point: ViewportDragState) {
  if (!this.viewportDragState) {
    return;
  }

  const deltaX = point.lastX - this.viewportDragState.lastX;
  const deltaY = point.lastY - this.viewportDragState.lastY;

  this.viewport.moveBy(deltaX, deltaY);
  this.viewportDragState = point;
  this.applyViewport();
}

endViewportDrag() {
  this.viewportDragState = null;
}
```

### 为什么这样改

拖拽分成三个阶段：

```text
startViewportDrag：鼠标按下，记录起点
dragViewportTo：鼠标移动，计算 dx/dy，移动 viewport
endViewportDrag：鼠标松开，清空拖拽状态
```

`dragViewportTo` 里更新的是：

```ts
viewport.x
viewport.y
```

不是图片元素的：

```ts
element.x
element.y
```

所以拖动画布不会改变图片数据。

## 第 3 步：修改 `src/canvas/InfiniteCanvas.tsx`

### 修改位置

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/InfiniteCanvas.tsx
```

找到：

```ts
layer.add(background);
layer.add(grid);
stage.add(layer);
stage.add(interactionLayer);
```

在它下面新增：

```ts
const handlePointerDown = (event: Konva.KonvaEventObject<PointerEvent>) => {
  if (store.editMode !== 'viewport-drag') {
    return;
  }

  if (event.target !== stage) {
    return;
  }

  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) {
    return;
  }

  store.startViewportDrag({
    lastX: pointerPosition.x,
    lastY: pointerPosition.y,
  });
};

const handlePointerMove = () => {
  if (store.editMode !== 'viewport-drag') {
    return;
  }

  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) {
    return;
  }

  store.dragViewportTo({
    lastX: pointerPosition.x,
    lastY: pointerPosition.y,
  });
};

const handlePointerUp = () => {
  store.endViewportDrag();
};

stage.on('pointerdown', handlePointerDown);
stage.on('pointermove', handlePointerMove);
stage.on('pointerup pointerleave', handlePointerUp);
```

### 为什么这样改

`pointerdown`：开始拖拽。

`pointermove`：如果正在拖拽，就移动 viewport。

`pointerup / pointerleave`：结束拖拽。

这段判断很重要：

```ts
if (event.target !== stage) {
  return;
}
```

它表示只有按住空白画布才拖动画布。

如果按住图片，不触发画布拖拽，避免和图片拖拽冲突。

### 修改 cleanup

找到 cleanup 里的：

```ts
return () => {
  stage.destroy();
```

在 `stage.destroy()` 前面新增：

```ts
stage.off('pointerdown', handlePointerDown);
stage.off('pointermove', handlePointerMove);
stage.off('pointerup pointerleave', handlePointerUp);
```

### 为什么这样改

组件卸载时要解绑事件，避免重复绑定和内存泄漏。

## 本节完成后你应该看到

1. 点击左侧“手”按钮。
2. 手按钮变成 active。
3. 按住画布空白区域拖动。
4. 网格和图片整体移动。
5. 图片自己的 `x/y` 不变。

如果按住图片拖，仍然是拖图片，不是拖画布。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
