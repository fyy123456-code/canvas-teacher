# Lesson 06.3：让多个选中的图片都显示出来

这一节是对 Lesson 06.2 的修正和补充。

上一节已经让 `selectedIds` 可以保存多个 id，但是画布上看起来还是只能选中一个。原因是：状态层已经支持多选，显示层还只用了第一个选中 id。

之前的代码里有这一句：

```ts
const selectedId = store.selectedIds[0] ?? null;
```

这表示不管 `selectedIds` 里面有几个 id，画布显示逻辑永远只拿第一个。

所以这节要做两件事：

1. Transformer 绑定所有选中的节点。
2. 多选时给每个选中图片画独立边框。

## 第 1 步：把 selectedId 改成 selectedIds

修改文件：

```ts
src/canvas/CanvasElements.tsx
```

找到：

```ts
const selectedId = store.selectedIds[0] ?? null;
```

改成：

```ts
const selectedIds = store.selectedIds.slice();
const selectedIdsKey = selectedIds.join("|");
```

### 为什么要这样改

`selectedIds` 是真正的多选数组。

`selectedIdsKey` 是为了放进 React `useEffect` 依赖里。

如果直接把数组放进依赖，每次渲染都是一个新数组，容易导致 effect 频繁执行。

所以这里用：

```ts
selectedIds.join("|")
```

生成一个稳定的字符串 key。

## 第 2 步：普通点击已选中元素时不要重置多选

还是修改：

```ts
src/canvas/CanvasElements.tsx
```

在 `onSelect` 里加入：

```ts
if (!isMultiSelect && store.selectedIds.includes(element.id)) {
  return;
}
```

### 为什么这样做

参考 `ai-design-canvas` 的选择逻辑：

如果一个元素已经在选中状态，普通点击它时，不应该立刻把多选状态重置成单选。

否则你已经选中了三张图片，再点其中一张，状态就会变成只选中这一张。

这个体验不符合常见编辑器。

## 第 3 步：Transformer 绑定多个节点

找到原来绑定 Transformer 的逻辑：

```ts
const selectedNode = nodeMapRef.current.get(selectedId);
transformer.nodes([selectedNode]);
```

改成：

```ts
const selectedNodes = selectedIds
  .map((id) => nodeMapRef.current.get(id))
  .filter(isKonvaNode);

transformer.nodes(selectedNodes);
```

### 为什么这样改

Konva 的 Transformer 支持绑定多个节点：

```ts
transformer.nodes([node1, node2, node3])
```

绑定多个节点后，Transformer 会显示一个包住所有选中元素的大框。

这就是多选编辑的基础。

## 第 4 步：多选时给每个图片画独立边框

新增：

```ts
const selectionBordersRef = useRef<Map<string, Konva.Rect>>(new Map());
```

然后在多选时，为每个选中节点创建一个 `Konva.Rect`：

```ts
selectedIds.forEach((id) => {
  const selectedNode = nodeMapRef.current.get(id);
  if (!selectedNode) {
    return;
  }

  const selectedRect = selectedNode.getClientRect({
    relativeTo: layer,
    skipStroke: true,
    skipShadow: true,
  });

  const rect = new Konva.Rect({
    name: `selection-border-${id}`,
    listening: false,
    stroke: "#4C90FF",
    x: selectedRect.x,
    y: selectedRect.y,
    width: selectedRect.width,
    height: selectedRect.height,
    strokeWidth: 2 / store.viewport.scale,
  });

  layer.add(rect);
  selectionBorders.set(id, rect);
});
```

### 为什么还要画独立边框

Transformer 多选时只会显示一个“大外框”。

但是用户通常还需要知道：

```txt
这个大外框里面到底哪些元素被选中了
```

所以我们给每个选中的图片都画一个独立边框。

这和 `ai-design-canvas` 的 `useSelectionBorders` 思路一致。

## 完成后的效果

现在你应该能看到：

1. 普通点击第一张图片，只选中第一张。
2. 按住 `Shift` 点击第二张图片，第一张和第二张都处于选中状态。
3. 多选时，Transformer 会包住所有选中的图片。
4. 每个选中图片外面也有独立蓝色边框。

## 你需要检查什么

手动测试：

1. 一次上传三张图片。
2. 普通点击第一张。
3. 按住 `Shift` 点击第二张。
4. 画布上应该看到两张图片都被选中。
5. 再按住 `Shift` 点击第三张。
6. 三张图片都应该处于选中状态。
