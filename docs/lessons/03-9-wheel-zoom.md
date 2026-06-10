# Lesson 03.9：Ctrl/Cmd + 触摸板缩放画布

## 本节目标

上一节我们做了：

```text
普通 wheel -> 平移画布
```

这一节继续对齐 `ai-design-canvas`，补上同一个 wheel 入口里的另一半：

```text
Ctrl/Cmd + wheel -> 缩放画布
```

也就是：

```text
按住 Ctrl 或 Command
两指上下滑动触摸板
画布以鼠标所在位置为中心缩放
```

## 本节不会做什么

- 不做右下角 zoom 百分比显示
- 不做缩放快捷键
- 不做重置 100%
- 不做移动端双指缩放

本节只做：

```text
Ctrl/Cmd + wheel 缩放
```

## 本节改动文件

只改 1 个文件：

```text
src/viewport/Viewport.ts
```

## 第 1 步：新增 wheel 缩放常量

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/viewport/Viewport.ts
```

找到顶部常量：

```ts
const DEFAULT_ZOOM_FACTOR = 1.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
```

在下面新增：

```ts
const WHEEL_ZOOM_FACTOR = 0.02;
const MAX_WHEEL_DELTA = 5;
```

## 为什么这样改

`WHEEL_ZOOM_FACTOR` 控制每次 wheel 缩放的速度。

`MAX_WHEEL_DELTA` 用来限制 `event.deltaY` 的最大影响。

如果不限制，某些触摸板一次 wheel 事件的 `deltaY` 可能比较大，缩放会突然跳很多。

`ai-design-canvas` 里也是这样处理：

```ts
const clampedDelta = Math.max(-5, Math.min(5, event.deltaY));
const zoomFactor = 0.02;
```

## 第 2 步：修改 handleWheel

找到：

```ts
private handleWheel = (event: WheelEvent) => {
  event.preventDefault();

  if (event.ctrlKey || event.metaKey) {
    return;
  }

  this.moveBy(-event.deltaX * 0.8, -event.deltaY * 0.8);
};
```

改成：

```ts
private handleWheel = (event: WheelEvent) => {
  event.preventDefault();

  if (event.ctrlKey || event.metaKey) {
    this.handleWheelZoom(event);
    return;
  }

  this.moveBy(-event.deltaX * 0.8, -event.deltaY * 0.8);
};
```

## 为什么这样改

现在 wheel 分成两种情况：

```text
没有 Ctrl/Cmd：平移画布
有 Ctrl/Cmd：缩放画布
```

这和 `ai-design-canvas` 一致。

## 第 3 步：新增 handleWheelZoom

在 `handleWheel` 后面新增：

```ts
private handleWheelZoom(event: WheelEvent) {
  if (!this.stage) {
    return;
  }

  const pointer = this.stage.getPointerPosition();
  if (!pointer) {
    return;
  }

  const clampedDelta = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, event.deltaY));
  const nextScale = this.scale * Math.pow(2, -clampedDelta * WHEEL_ZOOM_FACTOR);

  this.zoomAt(pointer, nextScale);
}
```

## 为什么这样改

先拿鼠标在 stage 里的位置：

```ts
const pointer = this.stage.getPointerPosition();
```

这个点就是缩放中心。

然后计算下一次 scale：

```ts
const nextScale = this.scale * Math.pow(2, -clampedDelta * WHEEL_ZOOM_FACTOR);
```

最后调用已有的：

```ts
this.zoomAt(pointer, nextScale);
```

`zoomAt` 会做这件事：

```text
缩放前，先算鼠标所在的画布世界坐标
缩放后，重新计算 viewport.x / viewport.y
让鼠标指向的那个画布点保持在鼠标下面
```

所以缩放时不会总是往左上角缩，而是以鼠标位置为中心缩放。

## 这一步和右下角加减缩放的关系

右下角加减按钮调用的是：

```ts
zoomInAt({ x: width / 2, y: height / 2 })
zoomOutAt({ x: width / 2, y: height / 2 })
```

它的缩放中心是画布屏幕中心。

本节 wheel 缩放调用的是：

```ts
zoomAt(pointer, nextScale)
```

它的缩放中心是鼠标位置。

两者用的是同一个底层能力：

```ts
zoomAt(...)
```

只是传入的缩放中心不同。

## 本节完成后你应该看到

1. 鼠标放在画布区域。
2. 按住 Ctrl 或 Command。
3. 两指上下滑动触摸板。
4. 画布会围绕鼠标位置放大或缩小。
5. 普通两指滑动仍然是平移画布。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
