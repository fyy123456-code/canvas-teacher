# Lesson 03.3：让 ZoomTools 以画布中心为中心缩放

## 本节目标

上一节点击 `+ / -` 时，只改了：

```ts
viewport.scale
```

但没有同步调整：

```ts
viewport.x
viewport.y
```

这样缩放会以 layer 的原点为基准，视觉上容易感觉内容往一边跑。

本节让右下角 `ZoomTools` 以画布中心为中心缩放。

## 顺便修改

把默认 viewport 从上一节演示用的偏移：

```ts
new Viewport({
  x: 200,
  y: 100,
  scale: 1,
});
```

改成正式默认值：

```ts
new Viewport({
  x: 0,
  y: 0,
  scale: 1,
});
```

## 本节核心公式

缩放前，先把屏幕中心点转换成画布世界坐标：

```ts
worldX = (screenX - viewport.x) / viewport.scale
worldY = (screenY - viewport.y) / viewport.scale
```

缩放后，再反推出新的 viewport 位置：

```ts
viewport.x = screenX - worldX * newScale
viewport.y = screenY - worldY * newScale
```

这样可以保证：

```text
缩放前屏幕中心看到的画布世界点
缩放后仍然停留在屏幕中心
```

## 本节不会做什么

- 不做鼠标滚轮缩放
- 不做以鼠标位置为中心缩放
- 不做手型拖拽画布
- 不做完整 screen/world 坐标工具

这一步只做“按钮缩放时，以画布中心为缩放中心”。

## 本节改动文件

按顺序改 3 个文件：

```text
src/viewport/Viewport.ts
src/store/workspaceStore.ts
src/canvas/CanvasWorkspace.tsx
```

## 第 1 步：修改 `src/viewport/Viewport.ts`

### 修改位置 1：新增点类型

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/viewport/Viewport.ts
```

在 `ViewportConfig` 后面新增：

```ts
export interface ViewportPoint {
  x: number;
  y: number;
}
```

为什么这样改：

`zoomAt` 需要一个缩放中心点，这个点有 `x / y`。

### 修改位置 2：新增 `zoomAt`

在 `zoomOut` 后面新增：

```ts
zoomAt(screenPoint: ViewportPoint, nextScale: number) {
  const worldPoint = {
    x: (screenPoint.x - this.x) / this.scale,
    y: (screenPoint.y - this.y) / this.scale,
  };

  this.setScale(nextScale);
  this.setPosition(screenPoint.x - worldPoint.x * this.scale, screenPoint.y - worldPoint.y * this.scale);
}
```

为什么这样改：

`zoomAt` 的职责是：

```text
给定一个屏幕点
让缩放前后这个屏幕点对应同一个画布世界点
```

这就是“以某个点为中心缩放”。

### 修改位置 3：新增 `zoomInAt` 和 `zoomOutAt`

继续新增：

```ts
zoomInAt(screenPoint: ViewportPoint) {
  this.zoomAt(screenPoint, this.scale * DEFAULT_ZOOM_FACTOR);
}

zoomOutAt(screenPoint: ViewportPoint) {
  this.zoomAt(screenPoint, this.scale / DEFAULT_ZOOM_FACTOR);
}
```

为什么这样改：

`zoomAt` 是通用方法。

`zoomInAt` 和 `zoomOutAt` 只是把“放大一档 / 缩小一档”的规则封装起来。

## 第 2 步：修改 `src/store/workspaceStore.ts`

### 修改位置 1：默认 viewport 改成 0,0

找到：

```ts
new Viewport({
  x: 200,
  y: 100,
  scale: 1,
});
```

改成：

```ts
new Viewport({
  x: 0,
  y: 0,
  scale: 1,
});
```

为什么这样改：

`x=200, y=100` 是上一节为了理解 viewport 偏移的临时演示值。

现在开始做正式 zoom 行为，默认视口应该回到左上角。

### 修改位置 2：新增 `setSize`

找到：

```ts
setLayer(layer: Konva.Layer | null) {
  this.layer = layer;
}
```

在下面新增：

```ts
setSize(width: number, height: number) {
  this.width = width;
  this.height = height;
}
```

为什么这样改：

`zoomInViewport` 和 `zoomOutViewport` 需要知道当前画布中心点：

```ts
x: this.width / 2
y: this.height / 2
```

窗口 resize 后，store 里的宽高也要更新。

### 修改位置 3：修改 `zoomInViewport`

找到：

```ts
zoomInViewport() {
  this.viewport.zoomIn();
  this.applyViewport();
}
```

改成：

```ts
zoomInViewport() {
  this.viewport.zoomInAt({
    x: this.width / 2,
    y: this.height / 2,
  });
  this.applyViewport();
}
```

为什么这样改：

放大不再只是改 scale，而是以画布中心为缩放点。

### 修改位置 4：修改 `zoomOutViewport`

找到：

```ts
zoomOutViewport() {
  this.viewport.zoomOut();
  this.applyViewport();
}
```

改成：

```ts
zoomOutViewport() {
  this.viewport.zoomOutAt({
    x: this.width / 2,
    y: this.height / 2,
  });
  this.applyViewport();
}
```

## 第 3 步：修改 `src/canvas/CanvasWorkspace.tsx`

### 修改位置

找到 resize effect：

```tsx
useEffect(() => {
  const handleResize = () => {
    setStageSize(getWindowSize());
  };

  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

改成：

```tsx
useEffect(() => {
  const handleResize = () => {
    const nextSize = getWindowSize();
    store.setSize(nextSize.width, nextSize.height);
    setStageSize(nextSize);
  };

  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, [store]);
```

### 为什么这样改

`stageSize` 是 React 用来传给 `InfiniteCanvas` 的尺寸。

`store.width / store.height` 是 viewport zoom 计算中心点用的尺寸。

这两个都要在窗口变化时更新。

## 本节完成后你应该看到

点击右下角 `+ / -` 时：

```text
画布以窗口中心为基准放大或缩小
中心位置更稳定
内容不会明显从左上角发散
```

## 本节你需要理解

1. 为什么只改 scale 会以 layer 原点缩放。
2. 为什么以中心缩放时必须同时更新 `viewport.x / y`。
3. `screenPoint -> worldPoint` 的公式。
4. 为什么 store 需要知道当前画布宽高。
5. 为什么这一步还不是鼠标滚轮缩放。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
