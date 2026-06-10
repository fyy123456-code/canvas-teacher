# Lesson 04.1：点击图片选中，点击空白取消选中

## 本节目标

前面我们完成了 viewport 的移动和缩放。

从这一节开始进入画布编辑器的另一个核心能力：

```text
元素选中系统
```

本节只做最小闭环：

```text
点击图片 -> 选中图片
点击空白画布 -> 取消选中
选中的图片 -> 显示一个简单描边
```

## 本节不会做什么

- 不做 Transformer
- 不做缩放控制点
- 不做旋转
- 不做多选
- 不做删除
- 不做右侧属性面板

本节只做“单选”和“选中视觉反馈”。

## 为什么要先做选中

后面的很多功能都依赖选中状态：

```text
删除元素
移动层级
右侧属性面板
Transformer 缩放旋转
多选
复制粘贴
```

`ai-design-canvas` 也是围绕：

```ts
selectedIds
```

来组织选中元素相关逻辑的。

所以我们这节也使用：

```ts
selectedIds: string[]
```

即使当前只做单选，也先用数组结构，为后面多选做准备。

## 本节改动文件

按顺序改 4 个文件：

```text
src/store/workspaceStore.ts
src/elements/createImageElement.ts
src/canvas/CanvasElements.tsx
src/canvas/InfiniteCanvas.tsx
```

## 第 1 步：修改 `src/store/workspaceStore.ts`

### 修改位置 1：新增 selectedIds

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/workspaceStore.ts
```

找到：

```ts
elements: CanvasElement[];
editMode: EditMode = 'select';
viewport: Viewport;
```

改成：

```ts
elements: CanvasElement[];
editMode: EditMode = 'select';
selectedIds: string[] = [];
viewport: Viewport;
```

### 为什么这样改

`selectedIds` 用来保存当前被选中的元素 id。

虽然本节只做单选，但是用数组更接近真实编辑器，也和 `ai-design-canvas` 一致。

### 修改位置 2：新增选中方法

找到：

```ts
setEditMode(mode: EditMode) {
  this.editMode = mode;
}
```

在它下面新增：

```ts
setSelectedIds(ids: string[]) {
  this.selectedIds = ids;
}

selectElement(id: string) {
  this.setSelectedIds([id]);
}

clearSelection() {
  this.setSelectedIds([]);
}
```

### 为什么这样改

不要在组件里直接写：

```ts
store.selectedIds = [id]
```

而是通过方法表达意图：

```text
selectElement：选中一个元素
clearSelection：清空选中
```

后面如果要支持多选，只需要继续扩展 store 方法。

## 第 2 步：修改 `src/elements/createImageElement.ts`

### 修改位置 1：给 CreateImageNodeOptions 增加 onSelect

找到：

```ts
draggable?: boolean;
onDragEnd?: (node: Konva.Image) => void;
```

改成：

```ts
draggable?: boolean;
onSelect?: () => void;
onDragEnd?: (node: Konva.Image) => void;
```

### 修改位置 2：解构 onSelect

找到：

```ts
draggable = false,
onDragEnd,
```

改成：

```ts
draggable = false,
onSelect,
onDragEnd,
```

### 修改位置 3：绑定点击事件

找到：

```ts
imageNode.on('dragend', () => {
  onDragEnd?.(imageNode);
});
```

在它下面新增：

```ts
imageNode.on('click tap', (event) => {
  event.cancelBubble = true;
  onSelect?.();
});
```

### 为什么这样改

图片节点是 Konva 节点，不是普通 React DOM。

所以图片点击事件要绑定在 Konva 节点上：

```ts
imageNode.on('click tap', ...)
```

这里的：

```ts
event.cancelBubble = true;
```

表示点击图片后，不继续冒泡到 stage。

否则会出现：

```text
先选中图片
事件冒泡到 stage
stage 又清空选中
```

结果就是看起来“点了图片也没选中”。

## 第 3 步：修改 `src/canvas/CanvasElements.tsx`

### 修改位置 1：引入 useState

找到：

```ts
import { useEffect, useRef } from 'react';
```

改成：

```ts
import { useEffect, useRef, useState } from 'react';
```

### 修改位置 2：新增 selection rect 引用和更新 key

找到：

```ts
const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
const elementSnapshot = elements.slice();
const isViewportDragMode = store.editMode === 'viewport-drag';
```

改成：

```ts
const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
const selectionRectRef = useRef<Konva.Rect | null>(null);
const [selectionUpdateKey, setSelectionUpdateKey] = useState(0);
const elementSnapshot = elements.slice();
const isViewportDragMode = store.editMode === 'viewport-drag';
const selectedId = store.selectedIds[0] ?? null;
```

### 为什么这样改

`selectionRectRef` 保存选中描边节点。

`selectionUpdateKey` 用来在图片拖拽结束后强制重新计算描边位置。

`selectedId` 是当前单选元素 id。

### 修改位置 3：创建图片节点时传入 onSelect

找到：

```ts
draggable: !isViewportDragMode,
onDragEnd: (node) => {
```

改成：

```ts
draggable: !isViewportDragMode,
onSelect: () => {
  if (store.editMode !== 'select') {
    return;
  }

  store.selectElement(element.id);
},
onDragEnd: (node) => {
```

### 为什么这样改

只有选择模式下点击图片才选中。

手型模式下点击图片不选中，因为手型模式的目标是拖动画布。

### 修改位置 4：拖拽结束后更新描边

找到：

```ts
store.updateElement(element.id, {
  x: node.x(),
  y: node.y(),
});
```

改成：

```ts
store.updateElement(element.id, {
  x: node.x(),
  y: node.y(),
});
setSelectionUpdateKey((value) => value + 1);
```

### 为什么这样改

图片拖拽后，图片位置变了。

选中描边也要重新计算位置。

### 修改位置 5：新增选中描边 effect

在控制图片 draggable 的 effect 后面新增：

```ts
useEffect(() => {
  if (!layer || !selectedId) {
    selectionRectRef.current?.destroy();
    selectionRectRef.current = null;
    layer?.batchDraw();
    return;
  }

  const selectedNode = nodeMapRef.current.get(selectedId);
  if (!selectedNode) {
    selectionRectRef.current?.destroy();
    selectionRectRef.current = null;
    layer.batchDraw();
    return;
  }

  const rect = selectionRectRef.current ?? new Konva.Rect({
    name: 'selection-border',
    listening: false,
    stroke: '#2563eb',
    strokeWidth: 2 / store.viewport.scale,
    dash: [8 / store.viewport.scale, 4 / store.viewport.scale],
  });
  const selectedRect = selectedNode.getClientRect({
    relativeTo: layer,
    skipStroke: true,
    skipShadow: true,
  });

  rect.setAttrs({
    x: selectedRect.x,
    y: selectedRect.y,
    width: selectedRect.width,
    height: selectedRect.height,
    strokeWidth: 2 / store.viewport.scale,
    dash: [8 / store.viewport.scale, 4 / store.viewport.scale],
  });

  if (!selectionRectRef.current) {
    selectionRectRef.current = rect;
    layer.add(rect);
  }

  rect.moveToTop();
  layer.batchDraw();
}, [layer, selectedId, selectionUpdateKey, store.viewport.scale]);
```

### 为什么这样改

我们暂时不用 Transformer，只用一个简单的 `Konva.Rect` 作为选中描边。

`getClientRect` 可以拿到当前节点在 layer 坐标系里的外框。

这里除以 `store.viewport.scale`：

```ts
strokeWidth: 2 / store.viewport.scale
dash: [8 / store.viewport.scale, 4 / store.viewport.scale]
```

原因是 layer 缩放后，描边也会跟着缩放。

如果不除以 scale，放大画布时描边会变得很粗，缩小时描边会变得很细。

### 修改位置 6：组件卸载时销毁 selection rect

找到最后的 cleanup：

```ts
return () => {
  nodeMap.forEach((node) => {
    node.destroy();
  });
```

改成：

```ts
return () => {
  selectionRectRef.current?.destroy();
  selectionRectRef.current = null;
  nodeMap.forEach((node) => {
    node.destroy();
  });
```

### 为什么这样改

组件卸载时要销毁我们手动创建的 Konva 节点。

否则 layer 里会残留无用节点。

## 第 4 步：修改 `src/canvas/InfiniteCanvas.tsx`

### 修改位置 1：新增 stage click 事件

找到：

```ts
store.viewport.attach(stage, layer, () => {
  store.refreshGrid?.();
});
setLayer(layer);
```

改成：

```ts
store.viewport.attach(stage, layer, () => {
  store.refreshGrid?.();
});
const handleStageClick = (event: Konva.KonvaEventObject<MouseEvent>) => {
  if (store.editMode !== 'select') {
    return;
  }

  if (event.target !== stage) {
    return;
  }

  store.clearSelection();
};
stage.on('click tap', handleStageClick);
setLayer(layer);
```

### 为什么这样改

点击空白画布时取消选中。

这里必须判断：

```ts
event.target !== stage
```

只有真正点到空白 stage，才取消选中。

点图片时不应该清空选中。

### 修改位置 2：cleanup 解绑事件

找到：

```ts
return () => {
  store.viewport.destroy();
```

改成：

```ts
return () => {
  stage.off('click tap', handleStageClick);
  store.viewport.destroy();
```

### 为什么这样改

手动绑定的 Konva 事件，组件卸载时要解绑。

## 本节完成后你应该看到

1. 上传一张图片。
2. 点击图片。
3. 图片外面出现蓝色虚线描边。
4. 点击空白画布。
5. 描边消失。
6. 选择模式下拖动图片，拖完后描边跟着更新位置。
7. 手型模式下点击图片，不会选中图片。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
