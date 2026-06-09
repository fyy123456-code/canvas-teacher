# Lesson 02.4：把选择的图片保存成画布元素数据

## 本节目标

本节做一件事：选择本地图片后，把它转换成一条图片元素数据，并放进 `workspaceStore.elements`。

本节完成后，图片还不会显示在画布上。

原因是：显示图片需要下一节用 `Konva.Image` 根据 `store.elements` 创建画布节点。本节只负责“数据进入 store”。

## 本节会做什么

这一节会完成这条链路：

```text
File
  -> URL.createObjectURL(file)
  -> getImageSize(src)
  -> store.generateId()
  -> store.addElement(imageElement)
```

## 本节不会做什么

- 不创建 `Konva.Image`
- 不新增 `CanvasElements`
- 不渲染图片到画布
- 不上传后端
- 不做拖拽、选中、缩放
- 不做文字元素

## 本节参考 ai-design-canvas 的哪里

原项目对应位置：

```text
ai-design-canvas/src/components/side-tool-bar/index.tsx
ai-design-canvas/src/type/element.ts
ai-design-canvas/src/store/workSpaceStore.ts
```

原项目选择图片后的关键逻辑是：

```ts
const url = URL.createObjectURL(file);
const elementId = store.generateId();
const { width, height } = await getImageWidthAndHeight(url);
store.addElement({
  id: elementId,
  type: "image",
  src: url,
  status: ElementStatus.LOADED,
  file_name: file.name,
  width,
  height,
});
```

我们这一节做它的简化版。

## 本节改动文件

按顺序改 4 个文件：

```text
src/store/workspaceStore.ts
src/store/index.ts
src/utils/image.ts
src/components/toolbar/Toolbar.tsx
```

## 第 1 步：修改 `src/store/workspaceStore.ts`

### 修改位置 1：在 import 后面新增元素类型

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/workspaceStore.ts
```

在这两行后面：

```ts
import Konva from 'konva';
import { makeAutoObservable, observable } from 'mobx';
```

新增：

```ts
export const ElementType = {
  IMAGE: 'image',
} as const;

export enum ElementStatus {
  LOADED = 'loaded',
}

export type ElementType = (typeof ElementType)[keyof typeof ElementType];
```

为什么这样改：

`ai-design-canvas` 也是用 `ElementType` 表示元素类型。我们现在只做图片，所以先只加 `IMAGE`，不提前加 `TEXT`。

`ElementStatus.LOADED` 表示本地图片已经可以使用。因为这一版没有后端上传，所以先不需要 `PENDING`、`FAILED` 等状态。

### 修改位置 2：继续新增基础元素和图片元素接口

在刚才新增的类型下面继续写：

```ts
export interface BaseElementData {
  id: string;
  file_name: string;
  type: ElementType;
  status: ElementStatus;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  opacity?: number;
}

export interface ImageElementData extends BaseElementData {
  type: typeof ElementType.IMAGE;
  src: string;
}

export type CanvasElement = ImageElementData;
```

为什么这样改：

`BaseElementData` 放所有元素通用字段，比如位置、尺寸、层级、透明度。

`ImageElementData` 是图片元素专属字段，最重要的是 `src`。

`CanvasElement` 现在只等于 `ImageElementData`。以后加文字时会变成：

```ts
export type CanvasElement = ImageElementData | TextElementData;
```

### 修改位置 3：给 `WorkSpaceStoreConfig` 增加 elements

找到：

```ts
export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
}
```

改成：

```ts
export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
  elements?: CanvasElement[];
}
```

为什么这样改：

`createWorkSpaceStore` 以后可以接收初始元素。现在主要是为了让 store 内部有统一的元素列表入口。

### 修改位置 4：给 `WorkSpaceStore` 增加 elements

找到：

```ts
export class WorkSpaceStore {
  width: number;
  height: number;
  stage: Konva.Stage | null = null;
  layer: Konva.Layer | null = null;
```

改成：

```ts
export class WorkSpaceStore {
  width: number;
  height: number;
  elements: CanvasElement[];
  stage: Konva.Stage | null = null;
  layer: Konva.Layer | null = null;
```

为什么这样改：

画布上的所有业务对象都应该先成为数据。后续渲染层只根据 `elements` 创建 Konva 节点。

### 修改位置 5：constructor 里初始化 elements

找到：

```ts
this.width = config.width ?? window.innerWidth;
this.height = config.height ?? window.innerHeight;
```

下面新增：

```ts
this.elements = config.elements ?? [];
```

为什么这样改：

保证 `elements` 一开始就是数组。后续 `store.elements.map(...)` 或 `store.addElement(...)` 才有稳定的数据基础。

### 修改位置 6：新增 `generateId` 和 `addElement`

在 `setLayer` 方法后面新增：

```ts
generateId() {
  return `element-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

addElement(element: CanvasElement) {
  this.elements.push({
    ...element,
    zIndex: element.zIndex ?? this.elements.length + 2,
  });
}
```

为什么这样改：

`generateId` 对齐原项目思路：每个画布元素都必须有唯一 id。

`addElement` 是所有新增元素的统一入口。现在只是 push 到数组里，后面会在这里扩展层级、历史记录、选中等逻辑。

`zIndex` 默认用当前数组长度加 2，表示越晚添加的元素层级越高，并且给背景矩形和网格保留底层位置。

## 第 2 步：修改 `src/store/index.ts`

### 修改位置

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/index.ts
```

找到：

```ts
export type { WorkSpaceStore, WorkSpaceStoreConfig } from './workspaceStore';
```

改成：

```ts
export type { CanvasElement, WorkSpaceStore, WorkSpaceStoreConfig } from './workspaceStore';
```

为什么这样改：

后续画布渲染层会需要 `CanvasElement` 类型，所以先从 store 统一出口导出。

## 第 3 步：创建 `src/utils/image.ts`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/utils/image.ts
```

### 写入代码

```ts
export interface ImageSize {
  width: number;
  height: number;
}

export function getImageSize(src: string): Promise<ImageSize> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      reject(new Error('Failed to load image.'));
    };

    image.src = src;
  });
}
```

为什么这样改：

`File` 本身没有图片宽高。必须先把它变成 URL，再创建浏览器的 `Image` 对象加载，加载完成后才能读取 `naturalWidth` 和 `naturalHeight`。

这一步对应原项目里的 `getImageWidthAndHeight(url)`。

## 第 4 步：修改 `src/components/toolbar/Toolbar.tsx`

### 修改位置 1：新增导入

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/components/toolbar/Toolbar.tsx
```

在顶部导入后面新增：

```ts
import { useStore } from '../../store';
import { ElementStatus, ElementType } from '../../store/workspaceStore';
import { getImageSize } from '../../utils/image';
```

为什么这样改：

- `useStore` 用来拿到当前 workspace store。
- `ElementType` 和 `ElementStatus` 用来创建图片元素。
- `getImageSize` 用来读取图片宽高。

### 修改位置 2：在 `Toolbar` 函数开头拿 store

找到：

```tsx
export function Toolbar() {
  const imageInputRef = useRef<HTMLInputElement>(null);
```

改成：

```tsx
export function Toolbar() {
  const store = useStore();
  const imageInputRef = useRef<HTMLInputElement>(null);
```

为什么这样改：

选择图片后要调用 `store.generateId()` 和 `store.addElement()`。

### 修改位置 3：把 `handleImageFileChange` 改成 async

找到：

```tsx
const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
```

改成：

```tsx
const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
```

为什么这样改：

读取图片宽高是异步的，需要 `await getImageSize(src)`。

### 修改位置 4：替换打印文件信息的逻辑

找到这一段：

```tsx
console.info('[Toolbar] selected image file', {
  name: file.name,
  type: file.type,
  size: file.size,
});
```

替换成：

```tsx
const src = URL.createObjectURL(file);
const { width, height } = await getImageSize(src);
const id = store.generateId();

store.addElement({
  id,
  type: ElementType.IMAGE,
  status: ElementStatus.LOADED,
  file_name: file.name,
  src,
  x: 80,
  y: 80,
  width,
  height,
});
```

为什么这样改：

- `URL.createObjectURL(file)` 把本地文件变成浏览器可访问的临时 URL。
- `getImageSize(src)` 拿到图片原始宽高。
- `store.generateId()` 给元素生成唯一 id。
- `store.addElement(...)` 把图片元素放进数据层。
- `x: 80, y: 80` 先给一个默认位置，下一节渲染时会用到。

## 本节完成后你应该看到

视觉上页面还不会变化。

因为我们只是把图片元素保存进 store，还没有渲染 `Konva.Image`。

你可以先在 `Toolbar.tsx` 的 `store.addElement(...)` 后面临时加一行调试：

```ts
console.info(store.elements);
```

确认数据已经进入 store。确认后再删掉这行，不要长期保留。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。

## 本节你需要理解

1. 为什么图片要先变成 object URL。
2. 为什么读取宽高需要异步加载 `Image`。
3. 为什么画布元素要先进入 store，而不是直接创建 Konva 节点。
4. `BaseElementData` 和 `ImageElementData` 的关系。
5. 为什么现在只加 `ElementType.IMAGE`，不提前加 `TEXT`。
