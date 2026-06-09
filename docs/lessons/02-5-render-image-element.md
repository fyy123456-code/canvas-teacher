# Lesson 02.5：把图片元素渲染到 Konva 画布上

## 本节目标

本节做一件事：根据 `store.elements` 里的图片元素，在 Konva 画布上创建 `Konva.Image` 节点。

上一节已经完成：

```text
File -> object URL -> 图片宽高 -> store.addElement(imageElement)
```

这一节继续完成：

```text
store.elements -> CanvasElements -> createImageNode -> Konva.Image
```

## 本节不会做什么

- 不做拖拽
- 不做选中
- 不做缩放
- 不做删除
- 不做图片更新
- 不做后端上传

这一步只解决“图片能显示到画布上”。

## 本节参考 ai-design-canvas 的哪里

原项目对应位置：

```text
ai-design-canvas/src/workSpace/CanvasElements.tsx
ai-design-canvas/src/elements/createImageElement.tsx
ai-design-canvas/src/workSpace/InfiniteCanvas.tsx
```

原项目也是这个分层：

```text
InfiniteCanvas
  负责创建 Stage 和 Layer

CanvasElements
  负责遍历元素数据

createImageNode
  负责创建 Konva.Image 节点
```

我们这一节做它的最小版本。

## 本节改动文件

按顺序改 4 个文件：

```text
src/elements/createImageElement.ts
src/canvas/CanvasElements.tsx
src/canvas/InfiniteCanvas.tsx
src/store/workspaceStore.ts
```

其中 `workspaceStore.ts` 只改一行 `zIndex` 默认值，避免图片被背景矩形盖住。

## 第 1 步：创建 `src/elements/createImageElement.ts`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/elements/createImageElement.ts
```

### 写入代码

```ts
import Konva from 'konva';

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

function createEmptyImage() {
  return document.createElement('canvas');
}

export function createImageNode({ layer, id, src, x = 0, y = 0, width, height, zIndex }: CreateImageNodeOptions) {
  const imageNode = new Konva.Image({
    image: createEmptyImage(),
    name: id,
    x,
    y,
    width: width ?? 0,
    height: height ?? 0,
    listening: false,
  });

  layer.add(imageNode);

  if (typeof zIndex === 'number') {
    imageNode.zIndex(zIndex);
  }

  const image = new Image();

  image.onload = () => {
    imageNode.image(image);
    imageNode.width(width ?? image.naturalWidth);
    imageNode.height(height ?? image.naturalHeight);
    layer.batchDraw();
  };

  image.src = src;

  return imageNode;
}
```

### 为什么这样写

`Konva.Image` 不能直接使用字符串 `src`。它需要的是浏览器已经加载好的 `HTMLImageElement`。

所以这里分两步：

1. 先用一个透明 canvas 作为占位图，创建 `Konva.Image` 节点并放到 layer 上。
2. 再用浏览器原生 `Image` 加载 `src`，加载完成后把它设置给 `imageNode.image(image)`。

`listening: false` 表示当前图片节点不参与鼠标事件。因为本节不做选中和拖拽。

`createEmptyImage()` 是为了满足 Konva 10 的类型要求：`Konva.Image` 创建时需要一个 `image` 字段。真实图片加载完成后会替换掉这个透明 canvas。

## 第 2 步：创建 `src/canvas/CanvasElements.tsx`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasElements.tsx
```

### 写入代码

```tsx
import Konva from 'konva';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { createImageNode } from '../elements/createImageElement';
import { ElementType } from '../store/workspaceStore';
import type { CanvasElement } from '../store/workspaceStore';

export interface CanvasElementsProps {
  layer: Konva.Layer | null;
  elements: CanvasElement[];
}

export const CanvasElements = observer(({ layer, elements }: CanvasElementsProps) => {
  const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
  const elementSnapshot = elements.slice();

  useEffect(() => {
    if (!layer) {
      return;
    }

    const nodeMap = nodeMapRef.current;
    const nextElementIds = new Set(elementSnapshot.map((element) => element.id));

    nodeMap.forEach((node, id) => {
      if (!nextElementIds.has(id)) {
        node.destroy();
        nodeMap.delete(id);
      }
    });

    elementSnapshot.forEach((element) => {
      if (nodeMap.has(element.id)) {
        return;
      }

      if (element.type === ElementType.IMAGE) {
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

        nodeMap.set(element.id, node);
      }
    });

    layer.batchDraw();
  }, [elementSnapshot, layer]);

  useEffect(() => {
    const nodeMap = nodeMapRef.current;

    return () => {
      nodeMap.forEach((node) => {
        node.destroy();
      });
      nodeMap.clear();
    };
  }, []);

  return null;
});
```

### 为什么这样写

`CanvasElements` 是“数据到 Konva 节点”的桥。

它不返回 DOM。它返回 `null`，但内部通过 `useEffect` 命令式创建 Konva 节点。

`nodeMapRef` 保存元素 id 到 Konva 节点的关系：

```text
element.id -> Konva.Node
```

这样同一个元素不会重复创建节点。

`observer` 很重要。因为 `store.elements.push(...)` 是 MobX observable 数组变化，`CanvasElements` 需要被 MobX 通知重新运行。

`elements.slice()` 也很重要。它会在 render 阶段读取数组内容，让 MobX 能追踪数组变化。

## 第 3 步：修改 `src/canvas/InfiniteCanvas.tsx`

### 修改位置 1：修改 React 导入

找到：

```tsx
import { useEffect, useMemo, useRef } from 'react';
```

改成：

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
```

为什么这样改：

`CanvasElements` 需要拿到已经创建好的 `layer`。`layerRef` 变化不会触发 React 重新渲染，所以这里需要用 `useState` 保存一份 layer。

### 修改位置 2：新增 `CanvasElements` 导入

找到：

```tsx
import { CANVAS_BACKGROUND_COLOR } from './canvasConfig';
```

下面新增：

```tsx
import { CanvasElements } from './CanvasElements';
```

### 修改位置 3：新增 layer state

找到：

```tsx
const layerRef = useRef<Konva.Layer | null>(null);
const interactionLayerRef = useRef<Konva.Layer | null>(null);
```

下面新增：

```tsx
const [layer, setLayer] = useState<Konva.Layer | null>(null);
```

### 修改位置 4：创建 layer 后同步到 state

找到：

```tsx
store.setStage(stage);
store.setLayer(layer);
```

下面新增：

```tsx
setLayer(layer);
```

为什么这样改：

Stage 和 Layer 是在 `useEffect` 里创建的。创建完成后需要让 React 组件重新渲染一次，这样 `<CanvasElements layer={layer} />` 才能拿到真实 layer。

### 修改位置 5：销毁时清空 layer state

找到 cleanup 里的：

```tsx
store.setStage(null);
store.setLayer(null);
```

下面新增：

```tsx
setLayer(null);
```

### 修改位置 6：在容器中渲染 `CanvasElements`

找到：

```tsx
<div ref={containerRef} className="canvas-container" data-infinite-canvas-children="true" style={containerStyle} />
```

改成：

```tsx
<div ref={containerRef} className="canvas-container" data-infinite-canvas-children="true" style={containerStyle}>
  <CanvasElements layer={layer} elements={store.elements} />
</div>
```

为什么这样改：

`InfiniteCanvas` 负责创建 layer，`CanvasElements` 负责使用这个 layer 渲染元素。这样职责是分开的。

## 第 4 步：修改 `src/store/workspaceStore.ts`

### 修改位置

找到：

```ts
zIndex: element.zIndex ?? this.elements.length + 1,
```

改成：

```ts
zIndex: element.zIndex ?? this.elements.length + 2,
```

### 为什么这样改

我们的主 layer 上已经有一个背景矩形。

背景矩形是 layer 里的第一个节点，层级可以理解为 0。后面加入网格后，网格层级是 1。

如果第一张图片的 `zIndex` 太低，它可能会被背景或网格盖住。所以图片默认从 2 开始。

## 本节完成后你应该看到

1. 页面打开后还是空白画布。
2. 点击左侧“图片”。
3. 选择本地图片。
4. 图片显示在画布左上区域，默认位置是：

```text
x: 80
y: 80
```

图片暂时不能拖拽、不能选中、不能缩放，这是正确的。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。

## 本节你需要理解

1. 为什么 `CanvasElements` 返回 `null`，但仍然能创建画布节点。
2. 为什么 `Konva.Image` 需要 `HTMLImageElement`，不能直接用 `src` 字符串。
3. 为什么需要 `nodeMapRef` 防止重复创建节点。
4. 为什么 `CanvasElements` 要用 `observer`。
5. 为什么 `InfiniteCanvas` 要把 `layerRef` 同步成 React state。
