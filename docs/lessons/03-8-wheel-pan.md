# Lesson 03.8：两指触摸板滑动画布

## 本节目标

上一节我们让 `Viewport` 接管了手型拖拽。

这一节继续对齐 `ai-design-canvas`，新增触摸板两指滑动画布：

```text
两指滑动触摸板
  -> 浏览器触发 wheel 事件
  -> Viewport 读取 deltaX / deltaY
  -> 移动 viewport.x / viewport.y
  -> layer.position 跟着变
  -> 图片和网格整体移动
```

## 本节不会做什么

- 不做 Ctrl/Cmd + wheel 缩放
- 不做鼠标滚轮缩放
- 不做滚动惯性优化
- 不做移动端双指缩放

本节只做：

```text
普通 wheel -> 平移画布
```

## 本节改动文件

只改 1 个文件：

```text
src/viewport/Viewport.ts
```

## 第 1 步：在 attach 里绑定 wheel 事件

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/viewport/Viewport.ts
```

找到：

```ts
this.applyToLayer(layer);

stage.on('mousedown', this.handleStageMouseDown);
window.addEventListener('mousemove', this.handleWindowMouseMove);
window.addEventListener('mouseup', this.handleWindowMouseUp);
```

改成：

```ts
this.applyToLayer(layer);

stage.container().addEventListener('wheel', this.handleWheel, {
  passive: false,
});
stage.on('mousedown', this.handleStageMouseDown);
window.addEventListener('mousemove', this.handleWindowMouseMove);
window.addEventListener('mouseup', this.handleWindowMouseUp);
```

## 为什么这样改

两指触摸板滑动在浏览器里不是 `mousedown / mousemove`。

它触发的是：

```ts
wheel
```

所以如果只监听鼠标拖拽事件，两指滑动不会移动画布。

这里绑定在：

```ts
stage.container()
```

因为 wheel 是浏览器 DOM 事件，不是 Konva 节点拖拽事件。

`passive: false` 很重要。后面我们要调用：

```ts
event.preventDefault()
```

如果不设置 `passive: false`，浏览器可能不允许我们阻止默认滚动行为。

## 第 2 步：在 destroy 里解绑 wheel 事件

找到：

```ts
destroy() {
  this.stage?.off('mousedown', this.handleStageMouseDown);
```

改成：

```ts
destroy() {
  this.stage?.container().removeEventListener('wheel', this.handleWheel);
  this.stage?.off('mousedown', this.handleStageMouseDown);
```

## 为什么这样改

`attach` 里绑定了事件，`destroy` 里就必须解绑。

否则组件重新创建时会重复绑定，导致一次滑动触发多次移动。

## 第 3 步：新增 handleWheel

找到：

```ts
private handleWindowMouseUp = () => {
  this.endDrag();
};
```

在它下面新增：

```ts
private handleWheel = (event: WheelEvent) => {
  event.preventDefault();

  if (event.ctrlKey || event.metaKey) {
    return;
  }

  this.moveBy(-event.deltaX * 0.8, -event.deltaY * 0.8);
};
```

## 为什么这样改

`event.deltaX` 表示横向滚动距离。

`event.deltaY` 表示纵向滚动距离。

我们把它转换成 viewport 的移动：

```ts
this.moveBy(-event.deltaX * 0.8, -event.deltaY * 0.8);
```

这里的 `0.8` 来自 `ai-design-canvas`：

```ts
x: position.x - event.deltaX * 0.8
y: position.y - event.deltaY * 0.8
```

它的作用是让滑动速度稍微柔和一点。

这里先判断：

```ts
if (event.ctrlKey || event.metaKey) {
  return;
}
```

原因是 `ai-design-canvas` 里：

```text
普通 wheel：平移画布
Ctrl/Cmd + wheel：缩放画布
```

我们这一节只做平移，所以先把 Ctrl/Cmd 的情况空出来，留给下一节做缩放。

## 本节完成后你应该看到

1. 不需要点击“手”。
2. 鼠标放在画布区域。
3. 触摸板两指滑动。
4. 图片和网格整体移动。
5. 这时图片自己的 `x/y` 不变，移动的是 viewport。

## 和手型拖拽的区别

手型拖拽：

```text
按住鼠标拖动
mousedown -> mousemove -> mouseup
```

两指滑动：

```text
触摸板滚动
wheel
```

这两个交互最终做的是同一件事：

```text
移动 viewport.x / viewport.y
```

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
