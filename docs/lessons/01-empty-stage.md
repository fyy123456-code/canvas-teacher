# Lesson 01：渲染第一个空白 Konva Stage

## 本节目标

本节只做一件事：渲染一个空白的 `Konva Stage`。

但是我们不会把 `Stage` 直接写在 `App.tsx` 里。本节会先建立一个可扩展的画布模块边界，为后面的图片、文本、选中、拖拽、缩放、框选、Transformer 做准备。

## 本节知识点

1. `Stage` 是 Konva 的画布根容器。
2. `Layer` 是 `Stage` 下的绘制层。
3. `react-konva` 让我们可以用 React 组件写 Konva 节点。
4. 画布工程需要尽早拆分“页面壳”和“画布内核”。
5. 图层分层可以降低后续功能互相干扰的概率。

## 改动文件

- `src/canvas/types.ts`：定义画布尺寸和图层 id 类型。
- `src/canvas/canvasConfig.ts`：保存默认画布尺寸、背景色和图层 id。
- `src/canvas/CanvasStage.tsx`：封装 `Stage` 和三层 `Layer`。
- `src/canvas/CanvasWorkspace.tsx`：封装画布工作区外壳。
- `src/canvas/index.ts`：统一导出 canvas 模块。
- `src/App.tsx`：只渲染 `CanvasWorkspace`。
- `src/styles/index.scss`：增加编辑器布局和画布外观样式。

## 为什么现在就要封装

如果第一节直接在 `App.tsx` 里写：

```tsx
<Stage width={960} height={540}>
  <Layer />
</Stage>
```

短期看起来最简单，但后面加入这些功能时会很快变乱：

- 图片元素渲染
- 文本元素渲染
- 元素选中
- Transformer 缩放框
- 框选矩形
- 画布拖拽
- 画布缩放
- 快捷键
- 工具栏
- 本地保存和导出

所以本节先建立三个层次：

```text
App
  CanvasWorkspace
    CanvasStage
      backgroundLayer
      sceneLayer
      interactionLayer
```

这和 `ai-design-canvas` 的思路一致：外层工作区负责组织 UI 和快捷键，画布组件负责 Stage、Layer 和交互接入点。

## 三层 Layer 的职责

### `backgroundLayer`

背景层。当前只放一个白色 `Rect`，让画布区域有明确边界。

后续可以放：

- 画布背景色
- 透明棋盘格
- 页面边界

### `sceneLayer`

内容层。真正的用户元素会放在这里。

后续可以放：

- 图片
- 文本
- 图形
- 分组元素

### `interactionLayer`

交互层。它不代表真实内容，而是用于辅助编辑。

后续可以放：

- 框选矩形
- hover 边框
- Transformer
- 标注辅助图形

## 关键代码解释

### `src/canvas/types.ts`

```ts
export interface CanvasSize {
  width: number;
  height: number;
}

export type CanvasLayerId = 'backgroundLayer' | 'sceneLayer' | 'interactionLayer';
```

这里先把画布尺寸和图层 id 变成明确类型。这样后面传尺寸、查找图层、更新视口时，不容易写出随意字符串。

### `src/canvas/canvasConfig.ts`

```ts
export const DEFAULT_STAGE_SIZE: CanvasSize = {
  width: 960,
  height: 540,
};
```

当前默认画布是 16:9。后面做自定义画布尺寸时，可以先从这里开始改。

### `src/canvas/CanvasStage.tsx`

```tsx
<Stage width={size.width} height={size.height} className="canvas-stage">
  <Layer id={CANVAS_LAYER_IDS.backgroundLayer} listening={false}>
    <Rect x={0} y={0} width={size.width} height={size.height} fill={CANVAS_BACKGROUND_COLOR} />
  </Layer>
  <Layer id={CANVAS_LAYER_IDS.sceneLayer} />
  <Layer id={CANVAS_LAYER_IDS.interactionLayer} />
</Stage>
```

这段代码完成了真正的 Konva 挂载。

`listening={false}` 表示背景层不参与鼠标事件。背景只是视觉底色，不应该抢走元素点击、框选、拖拽等交互事件。

## 学生手写任务

在 `/Users/fyy/Desktop/projects/canvas-student` 中手写同样的模块结构：

```text
src/canvas/
  types.ts
  canvasConfig.ts
  CanvasStage.tsx
  CanvasWorkspace.tsx
  index.ts
```

然后修改：

```text
src/App.tsx
src/styles/index.scss
```

建议手写顺序：

1. 先写 `types.ts`。
2. 再写 `canvasConfig.ts`。
3. 写 `CanvasStage.tsx`，只关注 `Stage` 和三层 `Layer`。
4. 写 `CanvasWorkspace.tsx`，负责页面布局。
5. 写 `index.ts`，统一导出。
6. 修改 `App.tsx`。
7. 修改样式。
8. 运行 `pnpm typecheck`。
9. 运行 `pnpm build`。

## 常见错误

### 忘记从 `react-konva` 导入组件

应该写：

```ts
import { Layer, Rect, Stage } from 'react-konva';
```

不是从 `konva` 导入这些 React 组件。

### 只写 Layer，没有背景 Rect

空白 Stage 如果没有背景矩形，视觉上可能看不出画布边界。背景 Rect 可以让你明确看到画布尺寸。

### 所有东西都放在一个 Layer

一个 Layer 也能跑，但后面会越来越难维护。真实编辑器通常会区分内容层和交互辅助层。

## 小练习

完成 `canvas-student` 后，尝试把 `DEFAULT_STAGE_SIZE` 改成：

```ts
export const DEFAULT_STAGE_SIZE: CanvasSize = {
  width: 800,
  height: 800,
};
```

观察页面中的画布从 16:9 变成正方形。再改回 960 x 540，并重新运行：

```bash
pnpm typecheck
pnpm build
```
