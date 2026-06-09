# Lesson 02.6：让图片可以拖拽，并同步位置到 store

## 本节目标

本节做一件事：图片节点可以在画布上拖动，拖动结束后把新的 `x / y` 同步回 `workspaceStore.elements`。

上一节已经完成：

```text
store.elements -> CanvasElements -> createImageNode -> Konva.Image
```

这一节继续完成：

```text
拖动 Konva.Image
  -> dragend
  -> node.x() / node.y()
  -> store.updateElement(id, { x, y })
```

## 本节不会做什么

- 不做选中
- 不做选中框
- 不做 Transformer
- 不做缩放
- 不做删除
- 不做 viewport

这一步只解决“图片节点自己能拖拽，并且数据会更新”。

## 本节参考 ai-design-canvas 的哪里

原项目对应位置：

```text
ai-design-canvas/src/elements/createImageElement.tsx
ai-design-canvas/src/workSpace/CanvasElements.tsx
ai-design-canvas/src/store/workSpaceStore.ts
```

原项目图片节点创建时会传：

```ts
draggable
onDragEnd
```

拖拽结束后会更新元素数据：

```ts
store.updateElement(element.id, { x: newX, y: newY }, false);
```

我们这一节做它的最小版本。

## 本节改动文件

按顺序改 3 个文件：

```text
src/store/workspaceStore.ts
src/elements/createImageElement.ts
src/canvas/CanvasElements.tsx
```

## 第 1 步：修改 `src/store/workspaceStore.ts`

### 修改位置

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/workspaceStore.ts
```

找到 `addElement` 方法：

```ts
addElement(element: CanvasElement) {
  this.elements.push({
    ...element,
    zIndex: element.zIndex ?? this.elements.length + 1,
  });
}
```

在它下面新增：

```ts
updateElement(id: string, patch: Partial<CanvasElement>) {
  const element = this.elements.find((item) => item.id === id);
  if (!element) {
    return;
  }

  Object.assign(element, patch);
}
```

### 为什么这样改

拖拽结束后，需要把节点的新位置写回数据层。

`updateElement` 是统一的数据更新入口：

```text
id 找到元素
patch 表示要改哪些字段
Object.assign 把 patch 合并到元素上
```

现在只会更新 `x / y`。以后选中、缩放、旋转也会复用这个入口。

## 第 2 步：修改 `src/elements/createImageElement.ts`

### 修改位置 1：给参数类型新增拖拽配置

找到：

```ts
export interface CreateImageNodeOptions {
  layer: Konva.Layer;
  id: string;
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
}
```

改成：

```ts
export interface CreateImageNodeOptions {
  layer: Konva.Layer;
  id: string;
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  draggable?: boolean;
  onDragEnd?: (node: Konva.Image) => void;
}
```

### 为什么这样改

`createImageNode` 只负责创建 Konva 节点。

它不应该直接知道 store。它只暴露 `onDragEnd` 回调，让外层决定拖拽结束后做什么。

### 修改位置 2：让函数接收 `draggable` 和 `onDragEnd`

找到函数参数：

```ts
export function createImageNode({ layer, id, src, x = 0, y = 0, width, height, zIndex }: CreateImageNodeOptions) {
```

改成：

```ts
export function createImageNode({
  layer,
  id,
  src,
  x = 0,
  y = 0,
  width,
  height,
  zIndex,
  draggable = false,
  onDragEnd,
}: CreateImageNodeOptions) {
```

### 为什么这样改

`draggable = false` 表示默认不拖拽。只有调用方明确传 `draggable: true`，图片才可以拖动。

### 修改位置 3：开启 Konva 图片节点拖拽

找到：

```ts
listening: false,
```

改成：

```ts
draggable,
listening: draggable,
```

### 为什么这样改

- `draggable` 控制 Konva 节点能不能被拖。
- `listening` 控制节点是否接收鼠标事件。

如果 `listening: false`，即使 `draggable: true`，节点也不能正常响应鼠标拖拽。

### 修改位置 4：绑定 dragend

在 `new Konva.Image(...)` 后面新增：

```ts
imageNode.on('dragend', () => {
  onDragEnd?.(imageNode);
});
```

### 为什么这样改

Konva 拖拽结束时会触发 `dragend`。

这里把当前 `imageNode` 传给外层，外层可以读取：

```ts
node.x()
node.y()
```

## 第 3 步：修改 `src/canvas/CanvasElements.tsx`

### 修改位置 1：新增 `useStore` 导入

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasElements.tsx
```

在导入区新增：

```ts
import { useStore } from '../store';
```

### 修改位置 2：在组件里拿到 store

找到：

```tsx
export const CanvasElements = observer(({ layer, elements }: CanvasElementsProps) => {
  const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
```

改成：

```tsx
export const CanvasElements = observer(({ layer, elements }: CanvasElementsProps) => {
  const store = useStore();
  const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
```

### 为什么这样改

拖拽结束后要调用：

```ts
store.updateElement(...)
```

所以 `CanvasElements` 需要访问 store。

### 修改位置 3：创建图片节点时传入拖拽参数

找到：

```tsx
const node = createImageNode({
  layer,
  id: element.id,
  src: element.src,
  x: element.x,
  y: element.y,
  width: element.width,
  height: element.height,
  zIndex: element.zIndex,
});
```

改成：

```tsx
const node = createImageNode({
  layer,
  id: element.id,
  src: element.src,
  x: element.x,
  y: element.y,
  width: element.width,
  height: element.height,
  zIndex: element.zIndex,
  draggable: true,
  onDragEnd: (node) => {
    store.updateElement(element.id, {
      x: node.x(),
      y: node.y(),
    });
  },
});
```

### 为什么这样改

这一步把 Konva 节点事件和 store 数据连接起来：

```text
Konva 节点的位置
  -> node.x() / node.y()
  -> store.elements 里的元素位置
```

### 修改位置 4：更新 useEffect 依赖

找到：

```tsx
}, [elementSnapshot, layer]);
```

改成：

```tsx
}, [elementSnapshot, layer, store]);
```

### 为什么这样改

`useEffect` 里用了 `store`，所以依赖数组里应该包含它。

## 本节完成后你应该看到

1. 点击“图片”上传图片。
2. 图片显示在画布上。
3. 鼠标按住图片可以拖动。
4. 松开鼠标后，图片停在新位置。

因为 `dragend` 已经把新位置写回 store，所以后续做选中、刷新节点、撤销重做时都有数据基础。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。

## 本节你需要理解

1. `draggable` 和 `listening` 分别控制什么。
2. 为什么 `createImageNode` 不直接 import store。
3. 为什么拖拽结束后才更新 store，而不是拖拽过程中持续更新。
4. `updateElement(id, patch)` 为什么比直接改数组更适合作为统一入口。
5. 为什么本节还不做选中和 Transformer。
