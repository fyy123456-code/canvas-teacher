# Lesson 03.4：把固定网格改成 viewport-aware 可视区域网格

## 本节目标

上一节的网格是按窗口大小固定画出来的：

```text
x: 0 -> width
y: 0 -> height
```

这不是真正的无限画布网格。

因为后面 viewport 平移或缩放后，可视区域对应的画布世界范围会变化。如果网格还只画固定窗口大小，就可能看到网格断掉。

本节把网格改成：

```text
根据 viewport.x / viewport.y / viewport.scale
反算当前屏幕可见区域对应的画布世界范围
只绘制这个范围里的网格线
```

## 本节不会做什么

- 不做手型拖拽画布
- 不做鼠标滚轮缩放
- 不做动态网格密度
- 不做坐标轴
- 不做小地图

这一步只让网格具备“跟随 viewport 重新覆盖可视区域”的能力。

## 为什么固定网格不够

如果只画：

```text
0 到 window.innerWidth
0 到 window.innerHeight
```

那网格只存在于画布世界的这一块区域。

以后如果 viewport 向左拖、向右拖、放大、缩小，可见区域可能变成：

```text
worldLeft = -300
worldRight = 900
worldTop = -200
worldBottom = 700
```

这时候固定网格就不够了。

所以要根据当前 viewport 重新计算网格应该画在哪里。

## 核心公式

屏幕坐标转画布世界坐标：

```ts
worldX = (screenX - viewport.x) / viewport.scale
worldY = (screenY - viewport.y) / viewport.scale
```

屏幕左上角是：

```ts
screenX = 0
screenY = 0
```

屏幕右下角是：

```ts
screenX = width
screenY = height
```

所以当前可见的画布世界范围是：

```ts
worldLeft = (0 - viewport.x) / viewport.scale
worldTop = (0 - viewport.y) / viewport.scale
worldRight = (width - viewport.x) / viewport.scale
worldBottom = (height - viewport.y) / viewport.scale
```

然后在这个范围内画网格线。

## 本节改动文件

按顺序改 3 个文件：

```text
src/canvas/createGrid.ts
src/store/workspaceStore.ts
src/canvas/InfiniteCanvas.tsx
```

## 第 1 步：修改 `src/canvas/createGrid.ts`

### 修改位置 1：新增 Viewport 类型导入

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/createGrid.ts
```

在顶部新增：

```ts
import type { Viewport } from '../viewport';
```

### 修改位置 2：让创建网格时接收 viewport

找到：

```ts
export interface CreateGridOptions {
  width: number;
  height: number;
}
```

改成：

```ts
export interface CreateGridOptions {
  width: number;
  height: number;
  viewport: Viewport;
}
```

### 修改位置 3：新增计算起始网格线的方法

在 interface 后面新增：

```ts
function getStartLine(value: number) {
  return Math.floor(value / GRID_SIZE) * GRID_SIZE;
}
```

为什么这样改：

如果可见区域从 `worldLeft = 73` 开始，第一条网格线不应该从 73 开始，而应该从离它最近的 40 的倍数开始，比如 40。

这样网格线能一直对齐到固定刻度。

### 修改位置 4：替换 `createGridGroup`

把原来的：

```ts
export function createGridGroup({ width, height }: CreateGridOptions) {
  ...
}
```

替换成：

```ts
export function createGridGroup({ width, height, viewport }: CreateGridOptions) {
  const gridGroup = new Konva.Group({
    name: 'canvas-grid',
    listening: false,
  });

  const worldLeft = (0 - viewport.x) / viewport.scale;
  const worldTop = (0 - viewport.y) / viewport.scale;
  const worldRight = (width - viewport.x) / viewport.scale;
  const worldBottom = (height - viewport.y) / viewport.scale;
  const startX = getStartLine(worldLeft) - GRID_SIZE;
  const endX = getStartLine(worldRight) + GRID_SIZE;
  const startY = getStartLine(worldTop) - GRID_SIZE;
  const endY = getStartLine(worldBottom) + GRID_SIZE;

  for (let x = startX; x <= endX; x += GRID_SIZE) {
    gridGroup.add(
      new Konva.Line({
        points: [x, startY, x, endY],
        stroke: GRID_LINE_COLOR,
        strokeWidth: 1 / viewport.scale,
        listening: false,
      }),
    );
  }

  for (let y = startY; y <= endY; y += GRID_SIZE) {
    gridGroup.add(
      new Konva.Line({
        points: [startX, y, endX, y],
        stroke: GRID_LINE_COLOR,
        strokeWidth: 1 / viewport.scale,
        listening: false,
      }),
    );
  }

  return gridGroup;
}
```

### 为什么这样改

现在网格不是画固定的 `0..width / 0..height`。

它先算出当前屏幕对应的画布世界范围，再在这个世界范围里画线。

`strokeWidth: 1 / viewport.scale` 是为了让网格线在屏幕上看起来接近 1px。因为 layer 已经被 scale 缩放，如果线宽不反向处理，放大后线也会变粗。

## 第 2 步：修改 `src/store/workspaceStore.ts`

### 修改位置 1：新增刷新网格回调字段

找到：

```ts
stage: Konva.Stage | null = null;
layer: Konva.Layer | null = null;
```

下面新增：

```ts
refreshGrid: (() => void) | null = null;
```

### 修改位置 2：makeAutoObservable 增加配置

找到：

```ts
makeAutoObservable(this, {
  viewport: observable.ref,
  stage: observable.ref,
  layer: observable.ref,
});
```

改成：

```ts
makeAutoObservable(this, {
  viewport: observable.ref,
  stage: observable.ref,
  layer: observable.ref,
  refreshGrid: observable.ref,
});
```

### 修改位置 3：新增 `setRefreshGrid`

找到：

```ts
setLayer(layer: Konva.Layer | null) {
  this.layer = layer;
}
```

下面新增：

```ts
setRefreshGrid(callback: (() => void) | null) {
  this.refreshGrid = callback;
}
```

### 修改位置 4：应用 viewport 后刷新网格

找到：

```ts
this.viewport.applyToLayer(this.layer);
```

下面新增：

```ts
this.refreshGrid?.();
```

### 为什么这样改

点击放大/缩小时，viewport 会变化。

viewport 变化后，网格可见范围也要重新算。

所以流程变成：

```text
zoomInViewport
  -> viewport 改 scale/x/y
  -> applyViewport
  -> applyToLayer
  -> refreshGrid
```

## 第 3 步：修改 `src/canvas/InfiniteCanvas.tsx`

### 修改位置 1：增加 stageSizeRef

找到：

```ts
const interactionLayerRef = useRef<Konva.Layer | null>(null);
const [layer, setLayer] = useState<Konva.Layer | null>(null);

const stageSize = useMemo<CanvasSize>(() => ({ width, height }), [width, height]);
```

改成：

```ts
const interactionLayerRef = useRef<Konva.Layer | null>(null);
const [layer, setLayer] = useState<Konva.Layer | null>(null);

const stageSize = useMemo<CanvasSize>(() => ({ width, height }), [width, height]);
const stageSizeRef = useRef<CanvasSize>(stageSize);
```

然后新增：

```ts
useEffect(() => {
  stageSizeRef.current = stageSize;
}, [stageSize]);
```

为什么这样改：

`refreshGrid` 回调需要拿到最新窗口尺寸。

但创建 Stage 的 effect 不应该因为尺寸变化而重建 Stage，所以用 ref 保存最新尺寸。

### 修改位置 2：创建初始网格时传 viewport

找到：

```ts
const grid = createGridGroup({
  width: stageSize.width,
  height: stageSize.height,
});
```

改成：

```ts
const grid = createGridGroup({
  width: stageSize.width,
  height: stageSize.height,
  viewport: store.viewport,
});
```

### 修改位置 3：注册 refreshGrid 回调

找到：

```ts
store.setStage(stage);
store.setLayer(layer);
setLayer(layer);
```

改成：

```ts
store.setStage(stage);
store.setLayer(layer);
store.setRefreshGrid(() => {
  const currentLayer = layerRef.current;
  if (!currentLayer) {
    return;
  }

  const currentGrid = currentLayer.findOne('.canvas-grid');
  currentGrid?.destroy();
  const currentStageSize = stageSizeRef.current;
  const nextGrid = createGridGroup({
    width: currentStageSize.width,
    height: currentStageSize.height,
    viewport: store.viewport,
  });
  currentLayer.add(nextGrid);
  nextGrid.zIndex(1);
  currentLayer.batchDraw();
});
setLayer(layer);
```

### 为什么这样改

`InfiniteCanvas` 拥有 layer 和 stage 尺寸，所以网格重建逻辑放在这里。

store 只保存一个回调入口：

```ts
refreshGrid
```

这样 store 不需要知道怎么创建 Konva 网格。

### 修改位置 4：销毁时清空 refreshGrid

找到 cleanup：

```ts
store.setStage(null);
store.setLayer(null);
setLayer(null);
```

改成：

```ts
store.setStage(null);
store.setLayer(null);
store.setRefreshGrid(null);
setLayer(null);
```

### 修改位置 5：resize 重建网格时传 viewport

找到 resize effect 里的：

```ts
const nextGrid = createGridGroup({
  width: stageSize.width,
  height: stageSize.height,
});
```

改成：

```ts
const nextGrid = createGridGroup({
  width: stageSize.width,
  height: stageSize.height,
  viewport: store.viewport,
});
```

### 为什么这样改

窗口尺寸变化时，网格也要按照最新 viewport 重新生成。

## 本节完成后你应该看到

视觉上仍然是网格。

点击右下角 `+ / -` 时：

```text
网格线会跟着 viewport 重新覆盖当前可视区域
不会只固定在最开始的窗口范围
```

因为我们现在还没做手型拖拽，所以你主要能在缩放时感受到网格更稳定。

## 本节你需要理解

1. 固定窗口网格不等于无限画布网格。
2. 无限画布网格要根据 viewport 反算可视世界范围。
3. 网格线画在画布世界坐标里，不是屏幕坐标里。
4. viewport 改变后，网格要重新生成。
5. `refreshGrid` 是 store 和 InfiniteCanvas 之间的桥，但创建 Konva 节点仍然留在 InfiniteCanvas。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
