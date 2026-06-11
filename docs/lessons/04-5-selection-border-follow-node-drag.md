# Lesson 04.5：拖动图片时选中描边实时跟随

## 本节目标

上一节我们让选中描边跟随 viewport 平移和缩放。

这一节补一个更细的体验：

```text
拖动已选中的图片时
蓝色虚线描边实时跟着图片移动
```

## 本节不会做什么

- 不做 Transformer
- 不做缩放控制点
- 不做旋转
- 不做多选
- 不做吸附
- 不做自动滚动画布

本节只做：

```text
选中节点 x/y 变化 -> 刷新选中描边
```

## 参考 ai-design-canvas

`ai-design-canvas` 的选中边框会监听选中节点的变化：

```ts
selectedNodes.forEach((node) => {
  node.on("xChange.selectionBorders yChange.selectionBorders", updateBorders);
});
```

意思是：

```text
选中的 Konva 节点 x 变了
或者 y 变了
就重新计算选中边框
```

我们这节做这个逻辑的简化版。

## 本节改动文件

只改 1 个文件：

```text
src/canvas/CanvasElements.tsx
```

## 第 1 步：新增监听选中节点变化的 effect

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasElements.tsx
```

找到上一节新增的 viewport 监听 effect：

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

在它下面新增：

```ts
useEffect(() => {
  if (!selectedId) {
    return;
  }

  const selectedNode = nodeMapRef.current.get(selectedId);
  if (!selectedNode) {
    return;
  }

  const updateSelectionBorder = () => {
    setSelectionUpdateKey((value) => value + 1);
  };
  const nodeEvents = 'xChange.selectionBorder yChange.selectionBorder';

  selectedNode.on(nodeEvents, updateSelectionBorder);

  return () => {
    selectedNode.off(nodeEvents);
  };
}, [selectedId]);
```

## 为什么这样改

图片拖动过程中，Konva 会不断修改图片节点自己的：

```text
x
y
```

也就是：

```ts
node.x(...)
node.y(...)
```

Konva 节点的 x/y 变化时，会触发：

```text
xChange
yChange
```

所以我们监听当前选中节点：

```ts
selectedNode.on('xChange.selectionBorder yChange.selectionBorder', updateSelectionBorder)
```

只要图片位置变化，就更新：

```ts
selectionUpdateKey
```

已有的选中描边 effect 依赖了：

```ts
selectionUpdateKey
```

所以它会重新计算描边位置。

## 为什么不直接用 dragmove

可以用 `dragmove`，但是 `xChange / yChange` 更底层。

因为后面图片位置变化不一定都来自拖拽，比如：

```text
键盘微调
属性面板修改 x/y
对齐工具修改位置
```

这些都会改变节点 x/y。

监听 `xChange / yChange` 更接近 `ai-design-canvas` 的做法，也更通用。

## 为什么只监听 selectedId

当前项目还没有多选。

所以现在只需要监听：

```ts
const selectedId = store.selectedIds[0] ?? null;
```

后面做多选时，再改成遍历：

```ts
selectedIds.forEach(...)
```

## 本节完成后你应该看到

1. 上传一张图片。
2. 点击图片选中。
3. 按住图片拖动。
4. 蓝色虚线描边在拖动过程中实时跟着图片移动。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
