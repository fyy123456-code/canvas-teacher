# Lesson 04.4：让 InfiniteCanvas 对齐 ai-design-canvas 的响应式数据流

## 本节目标

上一节删除元素时，我们遇到一个问题：

```text
store.elements 被替换成新数组
但 InfiniteCanvas 不是 observer
CanvasElements 没有稳定收到新的 elements
所以 Konva 节点没有删除
```

为了更严格对齐 `ai-design-canvas`，本节把 `InfiniteCanvas` 改成 `observer`。

这样：

```text
store.elements 变化
-> InfiniteCanvas 重新渲染
-> 新 elements 传给 CanvasElements
-> CanvasElements 同步销毁不存在的 Konva 节点
```

## 对齐 ai-design-canvas 的点

`ai-design-canvas` 里：

```ts
const InfiniteCanvas: React.FC<InfiniteCanvasProps> = observer(...)
const elements = store.elements;
<CanvasElements layer={layerRef.current} elements={elements} editMode={store.editMode as any} />
```

也就是：

```text
InfiniteCanvas 自己是 observer
InfiniteCanvas 从 store 读取 elements
再把 elements 传给 CanvasElements
```

我们这节也改成这个模式。

## 本节改动文件

按顺序改 3 个文件：

```text
src/canvas/InfiniteCanvas.tsx
src/store/workspaceStore.ts
docs/lessons/04-3-delete-selected-element.md
```

其中第三个是同步修正文档。

## 第 1 步：修改 `src/canvas/InfiniteCanvas.tsx`

### 修改位置 1：引入 observer

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/InfiniteCanvas.tsx
```

在顶部新增：

```ts
import { observer } from 'mobx-react-lite';
```

### 修改位置 2：把组件包成 observer

把：

```ts
export function InfiniteCanvas({
  width = window.innerWidth,
  height = window.innerHeight,
}: InfiniteCanvasProps) {
```

改成：

```ts
export const InfiniteCanvas = observer(function InfiniteCanvas({
  width = window.innerWidth,
  height = window.innerHeight,
}: InfiniteCanvasProps) {
```

文件最后的：

```ts
}
```

改成：

```ts
});
```

### 为什么这样改

`InfiniteCanvas` 里会读取 MobX 状态：

```ts
store.elements
```

读取 MobX 状态的组件需要用 `observer` 包起来。

否则 store 变化后，React 不一定重新渲染这个组件。

### 修改位置 3：从 store 读取 elements

找到：

```ts
const store = useStore();
```

在它下面新增：

```ts
const elements = store.elements;
```

### 为什么这样改

这和 `ai-design-canvas` 一致。

`InfiniteCanvas` 是画布容器，它负责从 store 取画布元素数据，再交给 `CanvasElements` 渲染。

### 修改位置 4：传 elements 给 CanvasElements

找到：

```tsx
<CanvasElements layer={layer} elements={store.elements} />
```

改成：

```tsx
<CanvasElements layer={layer} elements={elements} />
```

### 为什么这样改

这样 `elements` 的读取发生在 `observer` 组件内部。

当 `store.elements` 替换成新数组时，`InfiniteCanvas` 会重新渲染，`CanvasElements` 会收到新数组。

## 第 2 步：修改 `src/store/workspaceStore.ts`

### 修改位置：把删除逻辑改回直接替换数组

找到：

```ts
const selectedIdSet = new Set(this.selectedIds);
const nextElements = this.elements.filter((element) => !selectedIdSet.has(element.id));
this.elements.splice(0, this.elements.length, ...nextElements);
this.clearSelection();
```

改成：

```ts
const selectedIdSet = new Set(this.selectedIds);
this.elements = this.elements.filter((element) => !selectedIdSet.has(element.id));
this.clearSelection();
```

### 为什么这样改

直接替换数组更直观：

```text
从旧 elements 过滤出新 elements
然后赋值回 this.elements
```

现在 `InfiniteCanvas` 是 `observer`，它能感知 `this.elements` 被替换，并把新数组传给 `CanvasElements`。

所以不再需要上一版的 `splice` 特殊写法。

## 第 3 步：同步修正 `docs/lessons/04-3-delete-selected-element.md`

把 04.3 文档里的删除代码也改成：

```ts
const selectedIdSet = new Set(this.selectedIds);
this.elements = this.elements.filter((element) => !selectedIdSet.has(element.id));
this.clearSelection();
```

并说明：

```text
InfiniteCanvas 需要是 observer
```

## 本节完成后你应该看到

1. 上传图片。
2. 点击图片选中。
3. 按 Delete 或 Backspace。
4. 图片被删除。
5. 代码结构更接近 ai-design-canvas。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
