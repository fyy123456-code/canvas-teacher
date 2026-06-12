# Lesson 06.4.2：把框选矩形从屏幕坐标转换成画布世界坐标

这一节继续做框选，但仍然不选中图片。

上一节我们已经能拖出一个框选矩形。这个矩形是根据鼠标位置画出来的，所以它使用的是屏幕坐标。

但是图片元素的数据在 `store.elements` 里，使用的是画布世界坐标。

所以真正判断图片有没有被框住之前，必须先做坐标转换：

```txt
屏幕坐标矩形 -> 画布世界坐标矩形
```

这一节只做转换，并在 `mouseup` 时打印：

```ts
console.log('[select-box]', {
  screenRect,
  worldRect,
});
```

## 这一节改哪些文件

这节改三个文件：

```ts
src/viewport/Viewport.ts
src/canvas/useSelectBox.ts
src/canvas/InfiniteCanvas.tsx
```

## 第 1 步：在 Viewport 里定义矩形类型

修改文件：

```ts
src/viewport/Viewport.ts
```

在 `ViewportPoint` 后面新增：

```ts
export interface ViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 为什么要新增 ViewportRect

框选不是一个点，而是一个矩形。

点的数据结构是：

```ts
{ x, y }
```

矩形的数据结构是：

```ts
{ x, y, width, height }
```

所以单独定义 `ViewportRect`，后面 `screenRectToWorldRect` 的输入和输出都会更清楚。

## 第 2 步：新增 screenToWorld

还是修改：

```ts
src/viewport/Viewport.ts
```

在 `zoomOutAt` 后面新增：

```ts
screenToWorld(screenPoint: ViewportPoint) {
  return {
    x: (screenPoint.x - this.x) / this.scale,
    y: (screenPoint.y - this.y) / this.scale,
  };
}
```

### 为什么这个方法放在 Viewport 里

因为只有 `Viewport` 知道当前画布是怎么被移动和缩放的：

```ts
this.x
this.y
this.scale
```

屏幕坐标转换成画布世界坐标，必须依赖这些值。

所以这个能力应该属于 `Viewport`，而不是属于 `useSelectBox`。

## 第 3 步：理解 screenToWorld 公式

公式是：

```ts
worldX = (screenX - viewport.x) / viewport.scale
worldY = (screenY - viewport.y) / viewport.scale
```

举例：

```ts
viewport.x = 100
viewport.y = 50
viewport.scale = 2
```

说明：

```txt
画布整体往右移动了 100px
画布整体往下移动了 50px
画布被放大了 2 倍
```

如果鼠标在屏幕上：

```ts
screenX = 300
screenY = 250
```

那么它对应的画布世界坐标是：

```ts
worldX = (300 - 100) / 2 = 100
worldY = (250 - 50) / 2 = 100
```

意思是：屏幕上的 `(300, 250)`，实际指向画布世界里的 `(100, 100)`。

## 第 4 步：新增 screenRectToWorldRect

继续在 `Viewport.ts` 里新增：

```ts
screenRectToWorldRect(screenRect: ViewportRect) {
  const topLeft = this.screenToWorld({
    x: screenRect.x,
    y: screenRect.y,
  });
  const bottomRight = this.screenToWorld({
    x: screenRect.x + screenRect.width,
    y: screenRect.y + screenRect.height,
  });

  return {
    x: Math.min(topLeft.x, bottomRight.x),
    y: Math.min(topLeft.y, bottomRight.y),
    width: Math.abs(bottomRight.x - topLeft.x),
    height: Math.abs(bottomRight.y - topLeft.y),
  };
}
```

### 为什么矩形要转两个点

矩形可以用两个点确定：

```txt
左上角
右下角
```

屏幕矩形的左上角是：

```ts
{ x: screenRect.x, y: screenRect.y }
```

屏幕矩形的右下角是：

```ts
{
  x: screenRect.x + screenRect.width,
  y: screenRect.y + screenRect.height
}
```

把这两个点都转成世界坐标，再重新计算出世界矩形。

## 第 5 步：useSelectBox 接收 viewport

修改文件：

```ts
src/canvas/useSelectBox.ts
```

新增 import：

```ts
import type { Viewport } from '../viewport';
```

修改参数类型：

```ts
export interface UseSelectBoxOptions {
  stage: Konva.Stage | null;
  interactionLayer: Konva.Layer | null;
  viewport: Viewport;
  enabled: boolean;
}
```

### 为什么 useSelectBox 需要 viewport

`useSelectBox` 负责框选过程。

鼠标松开时，它拿到了最终的屏幕矩形：

```ts
screenRect
```

但后面要判断图片是否被选中，需要世界矩形：

```ts
worldRect
```

所以它需要调用：

```ts
viewport.screenRectToWorldRect(screenRect)
```

## 第 6 步：保存当前屏幕矩形

在 `useSelectBox.ts` 里新增：

```ts
const screenRectRef = useRef<ReturnType<typeof getRectFromPoints> | null>(null);
```

然后在 `mousemove` 里：

```ts
const screenRect = getRectFromPoints(startPoint, pointer);
screenRectRef.current = screenRect;
selectRect.setAttrs(screenRect);
```

### 为什么要保存 screenRect

`mousemove` 时会不断计算最新框选矩形。

到了 `mouseup`，我们需要知道最后一次的矩形是多少。

所以用 ref 保存：

```ts
screenRectRef.current
```

## 第 7 步：mouseup 时转换并打印

在 `handleMouseUp` 里新增：

```ts
if (screenRect) {
  const worldRect = viewport.screenRectToWorldRect(screenRect);
  console.log('[select-box]', {
    screenRect,
    worldRect,
  });
}
```

### 为什么现在只是 console.log

这一节的目标是理解坐标转换。

下一节才会使用 `worldRect` 去判断哪些图片和框选区域相交。

所以现在先打印两个矩形：

```txt
screenRect：鼠标拖出来的屏幕矩形
worldRect：转换后的画布世界矩形
```

你可以缩放或拖动画布后再框选，观察这两个值的差异。

## 第 8 步：InfiniteCanvas 传入 viewport

修改文件：

```ts
src/canvas/InfiniteCanvas.tsx
```

把：

```ts
useSelectBox({
  stage,
  interactionLayer,
  enabled: store.editMode === 'select',
});
```

改成：

```ts
useSelectBox({
  stage,
  interactionLayer,
  viewport: store.viewport,
  enabled: store.editMode === 'select',
});
```

### 为什么从 store 里传 viewport

`store.viewport` 是当前画布唯一的视口对象。

它记录了当前画布的位置和缩放：

```ts
viewport.x
viewport.y
viewport.scale
```

所以框选坐标转换必须用它。

## 完成后的效果

现在你拖出框选矩形后，松开鼠标，控制台会打印：

```ts
[select-box] {
  screenRect: { x, y, width, height },
  worldRect: { x, y, width, height }
}
```

你可以测试：

1. 不移动、不缩放画布时，`screenRect` 和 `worldRect` 通常接近。
2. 拖动画布后，两个矩形的 `x/y` 会不同。
3. 缩放画布后，两个矩形的 `width/height` 也会不同。

如果这些现象能观察到，说明你已经理解框选为什么必须做坐标转换。
