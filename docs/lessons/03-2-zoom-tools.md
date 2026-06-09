# Lesson 03.2：右下角 ZoomTools 放大和缩小画布

## 本节目标

本节做一个简化版 `ZoomTools`：在画布右下角放两个按钮：

```text
-
+
```

点击后只修改：

```ts
viewport.scale
```

然后重新应用到 layer：

```ts
viewport.applyToLayer(layer)
```

## 本节参考 ai-design-canvas 的哪里

原项目对应位置：

```text
ai-design-canvas/src/components/zoom-tools/index.tsx
ai-design-canvas/src/components/zoom-tools/index.module.scss
ai-design-canvas/src/workSpace/InfiniteCanvas.tsx
```

原项目的 `ZoomTools` 在右下角，能力很多：

- 放大
- 缩小
- 显示百分比
- 适应画布
- 回到 100%
- 缩放到选中元素

我们这一节只做：

```text
放大
缩小
```

## 本节不会做什么

- 不做滚轮缩放
- 不做以鼠标为中心缩放
- 不做缩放百分比显示
- 不做适应画布
- 不做回到 100%
- 不做缩放到选中元素

## 本节改动文件

按顺序改 6 个文件：

```text
src/viewport/Viewport.ts
src/store/workspaceStore.ts
src/components/zoom-tools/ZoomTools.tsx
src/components/zoom-tools/index.ts
src/canvas/CanvasWorkspace.tsx
src/styles/index.scss
```

## 第 1 步：修改 `src/viewport/Viewport.ts`

### 修改位置 1：新增缩放常量

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/viewport/Viewport.ts
```

在 import 后面新增：

```ts
const DEFAULT_ZOOM_FACTOR = 1.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
```

### 为什么这样改

- `DEFAULT_ZOOM_FACTOR = 1.2` 表示每次放大 1.2 倍，缩小除以 1.2。
- `MIN_SCALE` 和 `MAX_SCALE` 限制缩放范围，避免无限缩小或无限放大。

### 修改位置 2：限制 `setScale`

找到：

```ts
setScale(scale: number) {
  this.scale = scale;
}
```

改成：

```ts
setScale(scale: number) {
  this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
```

### 为什么这样改

外部传进来的 scale 不一定合理，所以在 viewport 内部统一限制范围。

### 修改位置 3：新增 `zoomIn` 和 `zoomOut`

在 `setScale` 后面新增：

```ts
zoomIn() {
  this.setScale(this.scale * DEFAULT_ZOOM_FACTOR);
}

zoomOut() {
  this.setScale(this.scale / DEFAULT_ZOOM_FACTOR);
}
```

### 为什么这样改

`ZoomTools` 不应该自己计算缩放规则。

缩放规则属于 viewport，所以放在 `Viewport` 类里。

## 第 2 步：修改 `src/store/workspaceStore.ts`

### 修改位置

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/workspaceStore.ts
```

找到：

```ts
setLayer(layer: Konva.Layer | null) {
  this.layer = layer;
}
```

在它下面新增：

```ts
applyViewport() {
  if (!this.layer) {
    return;
  }

  this.viewport.applyToLayer(this.layer);
}

zoomInViewport() {
  this.viewport.zoomIn();
  this.applyViewport();
}

zoomOutViewport() {
  this.viewport.zoomOut();
  this.applyViewport();
}
```

### 为什么这样改

`ZoomTools` 是 React 组件，它不应该直接操作 Konva layer。

更清晰的流程是：

```text
ZoomTools 点击按钮
  -> store.zoomInViewport()
  -> viewport.zoomIn()
  -> viewport.applyToLayer(layer)
```

这样以后滚轮缩放、快捷键缩放也能复用同一套 store 方法。

## 第 3 步：创建 `src/components/zoom-tools/ZoomTools.tsx`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/components/zoom-tools/ZoomTools.tsx
```

### 写入代码

```tsx
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';

export const ZoomTools = observer(() => {
  const store = useStore();

  return (
    <div className="zoom-tools-container" aria-label="Canvas zoom tools">
      <button type="button" className="zoom-tool-button" title="缩小" onClick={() => store.zoomOutViewport()}>
        -
      </button>
      <button type="button" className="zoom-tool-button" title="放大" onClick={() => store.zoomInViewport()}>
        +
      </button>
    </div>
  );
});
```

### 为什么这样写

这里用 `observer` 是为了后面如果显示缩放百分比，可以自动响应 `viewport.scale` 变化。

当前按钮只调用 store 方法：

```ts
store.zoomOutViewport()
store.zoomInViewport()
```

## 第 4 步：创建 `src/components/zoom-tools/index.ts`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/components/zoom-tools/index.ts
```

### 写入代码

```ts
export { ZoomTools } from './ZoomTools';
```

### 为什么这样写

这是 zoom-tools 模块的统一出口。

外部可以写：

```ts
import { ZoomTools } from '../components/zoom-tools';
```

## 第 5 步：修改 `src/canvas/CanvasWorkspace.tsx`

### 修改位置 1：新增导入

找到：

```ts
import { Toolbar } from '../components/toolbar';
```

下面新增：

```ts
import { ZoomTools } from '../components/zoom-tools';
```

### 修改位置 2：挂载 ZoomTools

找到：

```tsx
<section className="workspace-body" aria-label="Canvas workspace">
  <Toolbar />
  <InfiniteCanvas width={stageSize.width} height={stageSize.height} />
</section>
```

改成：

```tsx
<section className="workspace-body" aria-label="Canvas workspace">
  <Toolbar />
  <InfiniteCanvas width={stageSize.width} height={stageSize.height} />
  <ZoomTools />
</section>
```

### 为什么这样写

`ZoomTools` 和 `Toolbar` 一样，都是 React DOM 控件，不是 Konva 节点。

它应该悬浮在画布上方，而不是画进 Konva layer 里。

## 第 6 步：修改 `src/styles/index.scss`

### 修改位置

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/styles/index.scss
```

在文件最后新增：

```scss
.zoom-tools-container {
  position: absolute;
  right: 24px;
  bottom: 24px;
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #f4f5f7;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 10px rgb(0 8 24 / 8%);
  padding: 6px;
}

.zoom-tool-button {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #111827;
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

.zoom-tool-button:hover {
  background: #edeff1;
}
```

### 为什么这样写

右下角定位参考 `ai-design-canvas` 的 zoom tools 位置。

`z-index: 10001` 保证它在画布上方。

按钮暂时用文字 `-` 和 `+`，因为本节重点是理解 viewport 缩放，不是做图标系统。

## 本节完成后你应该看到

画布右下角出现两个按钮：

```text
-   +
```

点击 `+`：

```text
网格和图片一起放大
图片自己的 width / height 不变
viewport.scale 变大
```

点击 `-`：

```text
网格和图片一起缩小
图片自己的 width / height 不变
viewport.scale 变小
```

## 本节你需要理解

1. 缩放是改 `viewport.scale`，不是改图片尺寸。
2. `Viewport.zoomIn()` 和 `Viewport.zoomOut()` 管缩放规则。
3. `store.zoomInViewport()` 负责把 viewport 变化应用到 layer。
4. `ZoomTools` 是 DOM 控件，不是 Konva 节点。
5. 本节缩放中心还不准确，后面会单独做“以画布中心或鼠标位置为中心缩放”。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
