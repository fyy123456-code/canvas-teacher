# Lesson 05.1：选中图片后显示 Konva Transformer

## 本节目标

前面我们已经有了选中系统：

```text
点击图片选中
点击空白取消选中
Delete / Backspace 删除
选中描边跟随 viewport
选中描边跟随图片拖动
```

这一节开始进入真正的编辑能力：

```text
选中图片后显示 Konva Transformer
```

本节只做显示控制框，不做缩放后的数据保存。

## 本节不会做什么

- 不处理 transformend
- 不把缩放后的 width / height 写回 store
- 不做旋转
- 不做多选
- 不做自定义控制点交互
- 不做等比约束说明

本节只做：

```text
创建 Transformer
选中图片时绑定 Transformer
取消选中时清空 Transformer
单选时隐藏上一章的自定义虚线描边
```

## 参考 ai-design-canvas

`ai-design-canvas` 里会创建一个 `Konva.Transformer`：

```ts
const transformer = new Konva.Transformer({
  rotateEnabled: false,
  flipEnabled: false,
  borderStroke: "#4C90FF",
  borderStrokeWidth: 2,
  anchorSize: 10,
  anchorStroke: "#d4d6dc",
  anchorStrokeWidth: 2,
  anchorCornerRadius: 5,
  enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
});
```

然后根据 `selectedIds` 找到对应节点：

```ts
transformer.nodes(selectedNodes);
```

我们这节做它的简化版，只绑定一个选中图片节点。

## 本节改动文件

只改 1 个文件：

```text
src/canvas/CanvasElements.tsx
```

## 第 1 步：新增 transformerRef

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasElements.tsx
```

找到：

```ts
const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
const selectionRectRef = useRef<Konva.Rect | null>(null);
```

改成：

```ts
const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
const selectionRectRef = useRef<Konva.Rect | null>(null);
const transformerRef = useRef<Konva.Transformer | null>(null);
```

## 为什么这样改

`Transformer` 是一个 Konva 节点，不是 React 组件。

我们需要用 ref 保存它：

```ts
transformerRef
```

后面选中图片时，才能调用：

```ts
transformer.nodes([selectedNode])
```

## 第 2 步：创建 Transformer

找到控制图片 draggable 的 effect：

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

  const transformer = new Konva.Transformer({
    rotateEnabled: false,
    flipEnabled: false,
    borderStroke: '#4C90FF',
    borderStrokeWidth: 2,
    anchorSize: 10,
    anchorStroke: '#d4d6dc',
    anchorStrokeWidth: 2,
    anchorCornerRadius: 5,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  });

  layer.add(transformer);
  transformer.nodes([]);
  transformer.on('mousedown', (event) => {
    event.cancelBubble = true;
  });
  transformerRef.current = transformer;
  layer.batchDraw();

  return () => {
    transformer.nodes([]);
    transformer.destroy();
    transformerRef.current = null;
    layer.batchDraw();
  };
}, [layer]);
```

## 为什么这样改

`new Konva.Transformer(...)` 创建控制框。

这里对齐 `ai-design-canvas` 的几个关键配置：

```ts
rotateEnabled: false
flipEnabled: false
enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
```

意思是：

```text
不允许旋转
不允许翻转
只显示四个角的控制点
```

`transformer.nodes([])` 表示初始状态不绑定任何节点。

`transformer.on('mousedown', ...)` 用来阻止事件继续冒泡，避免点击 Transformer 时被当成点击空白画布。

cleanup 里必须销毁 Transformer：

```ts
transformer.destroy()
```

因为这是我们手动创建的 Konva 节点。

## 第 3 步：选中图片时绑定 Transformer

在创建 Transformer 的 effect 后面新增：

```ts
useEffect(() => {
  const transformer = transformerRef.current;
  if (!layer || !transformer) {
    return;
  }

  if (!selectedId || isViewportDragMode) {
    transformer.nodes([]);
    layer.batchDraw();
    return;
  }

  const selectedNode = nodeMapRef.current.get(selectedId);
  if (!selectedNode) {
    transformer.nodes([]);
    layer.batchDraw();
    return;
  }

  transformer.nodes([selectedNode]);
  transformer.moveToTop();
  layer.batchDraw();
}, [isViewportDragMode, layer, selectedId]);
```

## 为什么这样改

选中图片时：

```ts
selectedId
```

会有值。

我们通过：

```ts
nodeMapRef.current.get(selectedId)
```

找到对应的 Konva 图片节点。

然后绑定给 Transformer：

```ts
transformer.nodes([selectedNode])
```

如果没有选中，或者当前是手型拖拽模式，就清空：

```ts
transformer.nodes([])
```

`transformer.moveToTop()` 是为了让控制框显示在图片上方。

## 第 4 步：单选时隐藏自定义虚线描边

找到选中描边 effect 里的：

```ts
if (!layer || !selectedId) {
```

改成：

```ts
if (!layer || !selectedId || transformerRef.current) {
```

## 为什么这样改

上一章我们自己画了一个蓝色虚线 `selectionRect`。

现在单选图片时已经有 Transformer 了。

如果两个都显示，就会出现两套选中框叠在一起，四个角的控制点上还压着虚线框。

`ai-design-canvas` 的做法是：

```text
单选：主要显示 Transformer
多选：额外显示 selection borders
```

我们现在还没有多选，所以单选时先隐藏自定义虚线描边。

## 第 5 步：组件卸载时销毁 transformer

找到最后的 cleanup：

```ts
return () => {
  selectionRectRef.current?.destroy();
  selectionRectRef.current = null;
  nodeMap.forEach((node) => {
    node.destroy();
  });
```

改成：

```ts
return () => {
  selectionRectRef.current?.destroy();
  selectionRectRef.current = null;
  transformerRef.current?.destroy();
  transformerRef.current = null;
  nodeMap.forEach((node) => {
    node.destroy();
  });
```

## 为什么这样改

Transformer 是手动创建的 Konva 节点。

组件卸载时，如果不销毁，它可能残留在 layer 里。

## 本节完成后你应该看到

1. 上传一张图片。
2. 点击图片选中。
3. 图片周围出现 Konva Transformer 的控制框和四个角控制点。
4. 不再显示上一章的蓝色虚线描边。
5. 切到手型模式时 Transformer 消失。

## 重要提醒

这节只显示 Transformer。

你现在拖动 Transformer 控制点，图片可能会视觉缩放，但我们还没有把缩放结果写回 store。

下一节再做：

```text
transformend 后把 width / height / x / y 写回 store
```

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
