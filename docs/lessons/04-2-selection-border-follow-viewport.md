# Lesson 04.2：选中描边跟随 viewport 变化

## 本节目标

上一节我们做了：

```text
点击图片 -> 选中图片
点击空白 -> 取消选中
选中图片 -> 显示蓝色虚线描边
```

但上一节的描边主要在这些时候刷新：

```text
点击选中
拖拽图片结束
```

现在 viewport 已经支持：

```text
手型拖拽画布
两指滑动画布
Ctrl/Cmd + 两指缩放画布
右下角 + / - 缩放
```

这些操作会改变 `layer.position` 或 `layer.scale`。

所以本节要做：

```text
只要 layer 的位置或缩放变化
就刷新选中描边
```

## 本节不会做什么

- 不做 Transformer
- 不做控制点
- 不做多选边框
- 不做删除
- 不重构 selection border 成独立 hook

本节只做一个小能力：

```text
监听 layer 变化 -> 重新计算单个选中描边
```

## 参考 ai-design-canvas

`ai-design-canvas` 的选中边框也会监听 layer 的变化：

```ts
const viewportEvents = "xChange.selectionBorders yChange.selectionBorders scaleXChange.selectionBorders scaleYChange.selectionBorders";
layer.on(viewportEvents, updateBorders);
```

意思是：

```text
layer.x 变了
layer.y 变了
layer.scaleX 变了
layer.scaleY 变了
都要更新选中边框
```

我们这节做同样思想的简化版。

## 本节改动文件

只改 1 个文件：

```text
src/canvas/CanvasElements.tsx
```

## 第 1 步：新增监听 layer 变化的 effect

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasElements.tsx
```

找到这个 effect：

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

在它下面新增：

```ts
useEffect(() => {
  if (!layer) {
    return;
  }

  const updateSelectionBorder = () => {
    setSelectionUpdateKey((value) => value + 1);
  };
  const viewportEvents = 'xChange.selectionBorder yChange.selectionBorder scaleXChange.selectionBorder scaleYChange.selectionBorder';

  layer.on(viewportEvents, updateSelectionBorder);

  return () => {
    layer.off(viewportEvents);
  };
}, [layer]);
```

## 为什么这样改

我们的选中描边是一个 `Konva.Rect`。

它的位置和尺寸来自：

```ts
selectedNode.getClientRect(...)
```

只要 viewport 平移或缩放，layer 的这些属性会变化：

```text
x
y
scaleX
scaleY
```

所以我们监听：

```ts
xChange
yChange
scaleXChange
scaleYChange
```

一旦 layer 发生变化，就执行：

```ts
setSelectionUpdateKey((value) => value + 1);
```

这个 state 改变后，会触发已有的选中描边 effect 重新执行。

已有的 effect 依赖里已经有：

```ts
selectionUpdateKey
```

所以它会重新计算：

```text
描边 x
描边 y
描边 width
描边 height
描边 strokeWidth
描边 dash
```

## 为什么事件名里有 `.selectionBorder`

这叫 Konva 事件命名空间。

例如：

```ts
xChange.selectionBorder
```

真实事件是：

```text
xChange
```

`.selectionBorder` 是我们给这个监听器起的名字。

解绑时可以写：

```ts
layer.off(viewportEvents);
```

这样只移除这组选中描边相关事件，不影响别的地方监听 `xChange`。

## 本节完成后你应该看到

1. 上传一张图片。
2. 点击图片，出现蓝色虚线描边。
3. 使用手型拖动画布，描边跟着图片走。
4. 使用两指滑动画布，描边跟着图片走。
5. 使用 Ctrl/Cmd + 两指缩放，描边仍然贴着图片。
6. 右下角 + / - 缩放时，描边仍然贴着图片。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
