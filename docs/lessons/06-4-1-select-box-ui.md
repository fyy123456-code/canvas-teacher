# Lesson 06.4.1：拖出框选矩形 UI

这一节只做框选的第一小步：在空白画布上按下鼠标并拖动时，显示一个半透明的框选矩形。

这一节不做：

```txt
不判断哪些图片被框住
不设置 selectedIds
不做 Shift 追加框选
不做屏幕坐标和世界坐标转换
```

我们只先掌握框选 UI 的事件链路：

```txt
mousedown -> 记录起点
mousemove -> 更新矩形
mouseup -> 隐藏矩形
```

## 参考 ai-design-canvas 的地方

`ai-design-canvas` 里有 `useMultipleSelect`：

```ts
src/hooks/useMultipleSelect.ts
```

它的思路是：

1. 单独创建一个框选矩形。
2. 鼠标按下时显示矩形。
3. 鼠标移动时更新矩形大小。
4. 鼠标松开时结束框选。

我们的项目里已经有 `interactionLayer`，所以不需要再创建新的 layer。框选矩形直接放到 `interactionLayer` 里。

## 第 1 步：新增 useSelectBox 文件

新增文件：

```ts
src/canvas/useSelectBox.ts
```

这个文件专门负责框选 UI。

### 为什么单独建文件

框选后面会继续变复杂：

```txt
06.4.1 只画矩形
06.4.2 坐标转换
06.4.3 判断图片是否相交
06.4.4 Shift 追加框选
```

如果全部写在 `InfiniteCanvas.tsx` 里，主画布文件会越来越难读。

所以从第一步就拆成 hook：

```ts
useSelectBox(...)
```

## 第 2 步：定义 hook 参数

在 `useSelectBox.ts` 里写：

```ts
export interface UseSelectBoxOptions {
  stage: Konva.Stage | null;
  interactionLayer: Konva.Layer | null;
  enabled: boolean;
}
```

### 为什么需要 stage

鼠标事件来自 Konva Stage。

我们要监听：

```ts
stage.on('mousedown', ...)
```

所以 hook 需要拿到 `stage`。

### 为什么需要 interactionLayer

框选矩形是临时 UI，不属于图片元素，也不属于网格。

所以不要放在主图片 layer 里，而是放到交互层：

```ts
interactionLayer
```

这样框选 UI 不会影响图片节点、网格节点和 Transformer。

### 为什么需要 enabled

不是任何模式都能框选。

只有当前是选择模式时才允许框选：

```ts
enabled: store.editMode === 'select'
```

如果切到手型拖动画布模式，就不应该画框选矩形。

## 第 3 步：创建框选矩形

在 `useSelectBox.ts` 里创建：

```ts
function createSelectRect() {
  return new Konva.Rect({
    name: 'select-box',
    fill: 'rgba(76, 144, 255, 0.12)',
    stroke: '#4C90FF',
    strokeWidth: 1,
    listening: false,
    visible: false,
  });
}
```

### 为什么 listening 是 false

框选矩形只是视觉反馈，不应该接收鼠标事件。

如果它能接收事件，就可能挡住下面的画布事件。

所以设置：

```ts
listening: false
```

### 为什么 visible 初始是 false

默认没有框选动作，不应该显示矩形。

只有鼠标按下开始框选时，才显示：

```ts
visible: true
```

## 第 4 步：用两个点计算矩形

新增：

```ts
function getRectFromPoints(start: Point, end: Point) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return {
    x,
    y,
    width,
    height,
  };
}
```

### 为什么不能直接 width = end.x - start.x

用户可能从左上往右下拖，也可能从右下往左上拖。

如果直接写：

```ts
width = end.x - start.x
```

往反方向拖时 width 会是负数。

所以要用：

```ts
x = Math.min(start.x, end.x)
width = Math.abs(end.x - start.x)
```

这样无论往哪个方向拖，矩形都是正常的。

## 第 5 步：mousedown 记录起点并显示矩形

核心逻辑：

```ts
const handleMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
  if (!enabled || event.target !== stage) {
    return;
  }

  const pointer = stage.getPointerPosition();
  const selectRect = selectRectRef.current;
  if (!pointer || !selectRect) {
    return;
  }

  startPointRef.current = pointer;
  isSelectingRef.current = true;
  selectRect.setAttrs({
    x: pointer.x,
    y: pointer.y,
    width: 0,
    height: 0,
    visible: true,
  });
};
```

### 为什么判断 event.target !== stage

这一节只允许从空白画布开始框选。

如果按在图片上拖动，应该是拖动图片，不应该开始框选。

所以只有点到 Stage 空白区域时才开始：

```ts
event.target === stage
```

## 第 6 步：mousemove 更新矩形大小

核心逻辑：

```ts
const handleMouseMove = () => {
  if (!isSelectingRef.current) {
    return;
  }

  const startPoint = startPointRef.current;
  const pointer = stage.getPointerPosition();
  const selectRect = selectRectRef.current;
  if (!startPoint || !pointer || !selectRect) {
    return;
  }

  selectRect.setAttrs(getRectFromPoints(startPoint, pointer));
  interactionLayer.batchDraw();
};
```

### 为什么 mousemove 绑定在 window 上

用户拖动时，鼠标可能短暂移出画布区域。

如果只监听 Stage，移出画布后就收不到事件。

所以这里和 `ai-design-canvas` 一样，监听：

```ts
window.addEventListener('mousemove', ...)
```

## 第 7 步：mouseup 结束框选并隐藏矩形

核心逻辑：

```ts
const handleMouseUp = () => {
  if (!isSelectingRef.current) {
    return;
  }

  isSelectingRef.current = false;
  startPointRef.current = null;
  selectRect.visible(false);
  interactionLayer.batchDraw();
};
```

### 为什么这节只是隐藏矩形

因为这一节只做框选 UI。

真正选中图片要等下一节：

```txt
06.4.2：把框选矩形从屏幕坐标转成画布世界坐标
06.4.3：判断图片和框选矩形是否相交
```

现在如果提前写选中逻辑，会把概念混在一起，反而不容易学。

## 第 8 步：在 InfiniteCanvas 中接入 useSelectBox

修改文件：

```ts
src/canvas/InfiniteCanvas.tsx
```

新增 import：

```ts
import { useSelectBox } from './useSelectBox';
```

新增状态：

```ts
const [stage, setStage] = useState<Konva.Stage | null>(null);
const [interactionLayer, setInteractionLayer] = useState<Konva.Layer | null>(null);
```

Stage 和 interactionLayer 创建好后设置进去：

```ts
setStage(stage);
setInteractionLayer(interactionLayer);
```

销毁时清空：

```ts
setStage(null);
setInteractionLayer(null);
```

最后调用：

```ts
useSelectBox({
  stage,
  interactionLayer,
  enabled: store.editMode === 'select',
});
```

### 为什么不直接用 ref

`useSelectBox` 是 React hook。

如果只改 `stageRef.current`，React 不会重新渲染，hook 拿不到最新值。

所以这里用 state：

```ts
setStage(stage)
setInteractionLayer(interactionLayer)
```

让 hook 在 Stage 创建完成后重新执行。

## 完成后的效果

现在你应该能看到：

1. 当前是选择模式。
2. 鼠标按住空白画布拖动。
3. 画布上出现一个半透明蓝色矩形。
4. 松开鼠标后矩形消失。
5. 这一步不会选中任何图片。

如果这些行为正常，说明 06.4.1 完成。
