# Lesson 03.0：添加网格，演示 viewport.x / viewport.y 偏移

## 本节目标

本节做一个临时学习实验：给画布添加网格，然后把整个内容层固定偏移：

```ts
layer.x(200);
layer.y(100);
```

也就是：

```ts
viewport.x = 200;
viewport.y = 100;
```

本节不是正式 viewport 系统，只是为了让你直观看到：

```text
viewport.x / viewport.y 改的是整个画布内容层的位置
不是改图片元素自己的 x / y
```

## 本节会看到什么

添加网格之后，画布内容层会整体向右移动 200px、向下移动 100px。

你上传图片后，图片仍然是：

```ts
x: 80
y: 80
```

但屏幕上看起来会出现在：

```text
80 + 200 = 280
80 + 100 = 180
```

这就是屏幕坐标和画布世界坐标的区别。

## 本节不会做什么

- 不创建正式 `Viewport` 类
- 不做滚轮缩放
- 不做手型拖拽画布
- 不做坐标转换
- 不做无限网格

当前网格只是固定铺满窗口大小，用来帮助理解偏移。

## 本节改动文件

按顺序改 3 个文件：

```text
src/canvas/canvasConfig.ts
src/canvas/createGrid.ts
src/canvas/InfiniteCanvas.tsx
```

## 第 1 步：修改 `src/canvas/canvasConfig.ts`

### 修改位置

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/canvasConfig.ts
```

在文件最后新增：

```ts
export const GRID_LINE_COLOR = '#e5e7eb';
export const GRID_SIZE = 40;

export const VIEWPORT_DEMO_OFFSET = {
  x: 200,
  y: 100,
} as const;
```

### 为什么这样改

`GRID_SIZE = 40` 表示每隔 40px 画一条网格线。

`VIEWPORT_DEMO_OFFSET` 是本节的临时演示值：

```text
x: 200 表示整个内容层向右偏移 200px
y: 100 表示整个内容层向下偏移 100px
```

后面正式做 `Viewport` 类时，这个常量会被真正的 viewport 状态替换。

## 第 2 步：创建 `src/canvas/createGrid.ts`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/createGrid.ts
```

### 写入代码

```ts
import Konva from 'konva';
import { GRID_LINE_COLOR, GRID_SIZE } from './canvasConfig';

export interface CreateGridOptions {
  width: number;
  height: number;
}

export function createGridGroup({ width, height }: CreateGridOptions) {
  const gridGroup = new Konva.Group({
    name: 'canvas-grid',
    listening: false,
  });

  for (let x = 0; x <= width; x += GRID_SIZE) {
    gridGroup.add(
      new Konva.Line({
        points: [x, 0, x, height],
        stroke: GRID_LINE_COLOR,
        strokeWidth: 1,
        listening: false,
      }),
    );
  }

  for (let y = 0; y <= height; y += GRID_SIZE) {
    gridGroup.add(
      new Konva.Line({
        points: [0, y, width, y],
        stroke: GRID_LINE_COLOR,
        strokeWidth: 1,
        listening: false,
      }),
    );
  }

  return gridGroup;
}
```

### 为什么这样写

`createGridGroup` 返回一个 `Konva.Group`。

这个 Group 里有两类线：

```text
竖线：x 固定，y 从 0 到 height
横线：y 固定，x 从 0 到 width
```

`listening: false` 表示网格不参与鼠标事件。否则它可能挡住图片拖拽。

## 第 3 步：修改 `src/canvas/InfiniteCanvas.tsx`

### 修改位置 1：修改导入

找到：

```ts
import { CANVAS_BACKGROUND_COLOR } from './canvasConfig';
```

改成：

```ts
import { CANVAS_BACKGROUND_COLOR, VIEWPORT_DEMO_OFFSET } from './canvasConfig';
```

然后新增：

```ts
import { createGridGroup } from './createGrid';
```

### 修改位置 2：创建 layer 后设置位置

找到：

```ts
const layer = new Konva.Layer();
const interactionLayer = new Konva.Layer();
```

改成：

```ts
const layer = new Konva.Layer();
layer.position(VIEWPORT_DEMO_OFFSET);

const interactionLayer = new Konva.Layer();
```

### 为什么这样改

这就是本节最关键的一行：

```ts
layer.position({
  x: 200,
  y: 100,
});
```

它表示整个内容层都被移动了。

注意：这不会修改任何图片元素自己的 `x / y`。

### 修改位置 3：创建网格

找到背景矩形创建代码后面：

```ts
const background = new Konva.Rect({
  name: 'canvas-background',
  x: 0,
  y: 0,
  width: stageSize.width,
  height: stageSize.height,
  fill: CANVAS_BACKGROUND_COLOR,
  listening: false,
});
```

在它下面新增：

```ts
const grid = createGridGroup({
  width: stageSize.width,
  height: stageSize.height,
});
```

### 修改位置 4：把网格加到 layer

找到：

```ts
layer.add(background);
stage.add(layer);
```

改成：

```ts
layer.add(background);
layer.add(grid);
stage.add(layer);
```

### 为什么这样改

layer 里的顺序现在是：

```text
background
grid
image elements
```

这样图片会显示在网格上方。

### 修改位置 5：resize 时重建网格

找到 resize effect 里的：

```ts
background?.setAttrs({
  width: stageSize.width,
  height: stageSize.height,
});

layer.batchDraw();
```

改成：

```ts
background?.setAttrs({
  width: stageSize.width,
  height: stageSize.height,
});

const grid = layer.findOne('.canvas-grid');
grid?.destroy();
const nextGrid = createGridGroup({
  width: stageSize.width,
  height: stageSize.height,
});
layer.add(nextGrid);
nextGrid.zIndex(1);

layer.batchDraw();
```

### 为什么这样改

窗口大小变化后，Stage 尺寸会变化，网格也要跟着窗口重新铺满。

这里先用最简单方式：

```text
销毁旧网格
创建新网格
加入 layer
把新网格层级放回 1
```

`nextGrid.zIndex(1)` 是为了让顺序保持：

```text
background: 0
grid: 1
image elements: 2+
```

否则 resize 之后，新网格可能被添加到最后，盖在图片上。

## 本节完成后你应该观察什么

页面会出现网格。

因为内容层设置了：

```ts
x: 200
y: 100
```

所以网格左上角不会从窗口左上角开始，而是会向右、向下偏移。

上传图片后，图片数据仍然是：

```ts
x: 80
y: 80
```

但视觉上它会跟着整个 layer 一起偏移。

## 你可以做的小实验

把：

```ts
export const VIEWPORT_DEMO_OFFSET = {
  x: 200,
  y: 100,
} as const;
```

临时改成：

```ts
export const VIEWPORT_DEMO_OFFSET = {
  x: 0,
  y: 0,
} as const;
```

你会看到网格回到窗口左上角。

再改成：

```ts
export const VIEWPORT_DEMO_OFFSET = {
  x: -200,
  y: -100,
} as const;
```

你会看到整个内容层向左、向上移动。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。

## 本节你需要理解

1. `layer.position({ x, y })` 移动的是整个内容层。
2. 图片元素自己的 `x / y` 没有变。
3. 屏幕上看到的位置 = 元素世界坐标 + viewport 偏移。
4. 网格可以帮助你看到内容层整体移动。
5. 这一步只是 viewport 演示，不是正式 viewport 系统。
