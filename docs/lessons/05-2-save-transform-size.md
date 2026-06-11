# Lesson 05.2：Transformer 缩放结束后保存图片尺寸

## 本节目标

上一节我们只是显示了 Transformer。

这一节做真正的数据保存：

```text
拖动 Transformer 四角控制点
松开鼠标
把图片缩放后的真实尺寸写回 store
把 Konva 节点的 scaleX / scaleY 重置为 1
```

## 本节不会做什么

- 不做旋转
- 不做多选
- 不做文字
- 不做分组
- 不做历史记录
- 不做缩放最小尺寸限制

本节只处理：

```text
单个图片节点 transformend
```

## 参考 ai-design-canvas

`ai-design-canvas` 的核心思路是：

```ts
const newWidth = node.width() * node.scaleX();
const newHeight = node.height() * node.scaleY();

store.updateElement(elementId, {
  width: newWidth,
  height: newHeight,
  scaleX: 1,
  scaleY: 1,
});

node.scaleX(1);
node.scaleY(1);
node.width(newWidth);
node.height(newHeight);
```

意思是：

```text
不要长期保留 scaleX / scaleY
把缩放结果合并到 width / height
```

我们这节做这个逻辑的图片简化版。

## 本节改动文件

只改 1 个文件：

```text
src/canvas/CanvasElements.tsx
```

## 第 1 步：给 transformer 监听 transformend

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasElements.tsx
```

找到创建 Transformer 的 effect 里这段：

```ts
transformer.on('mousedown', (event) => {
  event.cancelBubble = true;
});
transformerRef.current = transformer;
```

在 `transformerRef.current = transformer;` 前面新增：

```ts
transformer.on('transformend', () => {
  const [node] = transformer.nodes();
  if (!node) {
    return;
  }

  const elementId = node.name();
  if (!elementId) {
    return;
  }

  const nextWidth = node.width() * node.scaleX();
  const nextHeight = node.height() * node.scaleY();
  const nextX = node.x();
  const nextY = node.y();

  node.setAttrs({
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
    scaleX: 1,
    scaleY: 1,
  });

  store.updateElement(elementId, {
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  });
  transformer.forceUpdate();
  setSelectionUpdateKey((value) => value + 1);
  layer.batchDraw();
});
```

## 为什么这样改

### 1. 为什么监听 transformend

拖动 Transformer 控制点时，Konva 会不断改变节点的视觉变换。

但我们不想每一帧都写 store。

所以先只在用户松开鼠标时处理：

```ts
transformend
```

这是最小、最稳定的一步。

### 2. 为什么取 transformer.nodes()[0]

当前项目还没有多选。

所以 Transformer 只绑定一个节点：

```ts
transformer.nodes([selectedNode])
```

因此这里可以取：

```ts
const [node] = transformer.nodes();
```

### 3. 为什么用 node.name() 拿 elementId

创建图片节点时，我们设置过：

```ts
name: id
```

所以：

```ts
node.name()
```

就是这个图片元素在 store 里的 id。

有了 id，才能调用：

```ts
store.updateElement(elementId, ...)
```

### 4. 为什么 width 要乘 scaleX

拖 Transformer 的时候，Konva 不会直接改：

```ts
node.width()
node.height()
```

它通常会改：

```ts
node.scaleX()
node.scaleY()
```

假设原来：

```text
width = 200
scaleX = 1
```

你拖大 1.5 倍后，可能变成：

```text
width = 200
scaleX = 1.5
```

视觉宽度其实是：

```ts
200 * 1.5 = 300
```

所以我们计算：

```ts
const nextWidth = node.width() * node.scaleX();
const nextHeight = node.height() * node.scaleY();
```

### 5. 为什么要把 scaleX / scaleY 重置为 1

如果不重置，会越来越乱。

例如第一次缩放：

```text
width = 200
scaleX = 1.5
视觉宽度 = 300
```

第二次再缩放，又会叠加新的 scale。

后面保存、复制、导出、属性面板显示尺寸都会变复杂。

所以真实编辑器通常会做：

```text
把 scale 合并进 width / height
然后 scaleX / scaleY 归 1
```

也就是：

```ts
node.setAttrs({
  width: nextWidth,
  height: nextHeight,
  scaleX: 1,
  scaleY: 1,
});
```

### 6. 为什么要 forceUpdate

我们改了节点的尺寸和 scale。

Transformer 需要重新计算控制框位置。

所以调用：

```ts
transformer.forceUpdate();
```

## 本节完成后你应该看到

1. 上传图片。
2. 点击图片选中。
3. 拖动 Transformer 四角控制点缩放图片。
4. 松开鼠标后，图片保持缩放后的尺寸。
5. 再次拖动时，不会出现 scale 不断累积导致的异常。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
