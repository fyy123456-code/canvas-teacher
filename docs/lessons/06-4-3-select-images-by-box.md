# Lesson 06.4.3：框选命中图片并设置 selectedIds

这一节让框选真正选中图片。

前两节已经完成：

```txt
06.4.1：拖出框选矩形 UI
06.4.2：把屏幕矩形转换成画布世界矩形
```

这一节要做：

```txt
worldRect 和图片矩形做相交判断
找出被框住的图片 id
调用 store.setSelectedIds(ids)
```

这一节暂时不做 Shift 追加框选。框选结果会直接替换当前选中状态。

## 这节要改哪些文件

修改两个文件：

```ts
src/canvas/useSelectBox.ts
src/canvas/InfiniteCanvas.tsx
```

## 第 1 步：useSelectBox 接收 elements 和 onSelectIds

修改文件：

```ts
src/canvas/useSelectBox.ts
```

新增类型导入：

```ts
import type { CanvasElement } from '../store/workspaceStore';
```

把参数类型改成：

```ts
export interface UseSelectBoxOptions {
  stage: Konva.Stage | null;
  interactionLayer: Konva.Layer | null;
  viewport: Viewport;
  elements: CanvasElement[];
  enabled: boolean;
  onSelectIds: (ids: string[]) => void;
}
```

### 为什么要传 elements

框选要判断哪些图片被框住。

图片数据在：

```ts
store.elements
```

所以 `useSelectBox` 需要拿到当前画布上的元素列表。

### 为什么要传 onSelectIds

`useSelectBox` 只负责框选逻辑，不应该直接依赖完整 store。

它只需要告诉外面：

```txt
我框中了这些 id
```

真正怎么设置选中状态，由外层决定。

所以这里传：

```ts
onSelectIds: (ids: string[]) => void
```

## 第 2 步：定义 Rect 类型

在 `useSelectBox.ts` 里新增：

```ts
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 为什么要有 Rect

框选矩形和图片矩形都可以抽象成：

```ts
{ x, y, width, height }
```

有了统一的 `Rect` 类型，后面的相交函数可以同时处理：

```txt
框选矩形
图片矩形
```

## 第 3 步：写矩形相交函数

新增：

```ts
function haveRectIntersection(rectA: Rect, rectB: Rect) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}
```

### 为什么这样判断

两个矩形相交，需要同时满足：

```txt
A 的左边 < B 的右边
A 的右边 > B 的左边
A 的上边 < B 的下边
A 的下边 > B 的上边
```

换成代码就是：

```ts
rectA.x < rectB.x + rectB.width
rectA.x + rectA.width > rectB.x
rectA.y < rectB.y + rectB.height
rectA.y + rectA.height > rectB.y
```

只要四个条件都成立，两个矩形就有重叠区域。

## 第 4 步：把元素转成矩形

新增：

```ts
function getElementRect(element: CanvasElement): Rect {
  return {
    x: element.x ?? 0,
    y: element.y ?? 0,
    width: element.width ?? 0,
    height: element.height ?? 0,
  };
}
```

### 为什么图片元素可以这样转

现在我们的图片元素数据里已经有：

```ts
x
y
width
height
```

这些值就是图片在画布世界坐标中的矩形区域。

所以它可以直接转换成 `Rect`。

## 第 5 步：根据框选矩形找出 selectedIds

新增：

```ts
function getSelectedIdsByRect(elements: CanvasElement[], selectRect: Rect) {
  return elements
    .filter((element) => haveRectIntersection(selectRect, getElementRect(element)))
    .map((element) => element.id);
}
```

### 为什么先 filter 再 map

先用 `filter` 找出和框选矩形相交的图片：

```ts
haveRectIntersection(selectRect, getElementRect(element))
```

再用 `map` 只取它们的 id：

```ts
element.id
```

最后得到：

```ts
string[]
```

这正好可以传给：

```ts
store.setSelectedIds(ids)
```

## 第 6 步：mouseup 时设置选中 ids

把上一节的：

```ts
console.log('[select-box]', {
  screenRect,
  worldRect,
});
```

改成：

```ts
const selectedIds = getSelectedIdsByRect(elements, worldRect);
onSelectIds(selectedIds);
```

完整逻辑是：

```ts
if (screenRect) {
  const worldRect = viewport.screenRectToWorldRect(screenRect);
  const selectedIds = getSelectedIdsByRect(elements, worldRect);
  onSelectIds(selectedIds);
}
```

### 为什么用 worldRect

图片的 `x/y/width/height` 是画布世界坐标。

所以框选矩形也必须转换成画布世界坐标后才能比较。

如果直接拿屏幕坐标去比较，画布一旦移动或缩放，框选结果就会错。

## 第 7 步：InfiniteCanvas 传入参数

修改文件：

```ts
src/canvas/InfiniteCanvas.tsx
```

把：

```ts
useSelectBox({
  stage,
  interactionLayer,
  viewport: store.viewport,
  enabled: store.editMode === 'select',
});
```

改成：

```ts
useSelectBox({
  stage,
  interactionLayer,
  viewport: store.viewport,
  elements,
  enabled: store.editMode === 'select',
  onSelectIds: (ids) => {
    store.setSelectedIds(ids);
  },
});
```

### 为什么在 InfiniteCanvas 里调用 store.setSelectedIds

`InfiniteCanvas` 已经能拿到：

```ts
store
elements
viewport
```

所以它负责把这些数据传给框选 hook。

而 `useSelectBox` 不直接 import store，是为了让 hook 更通用。

## 完成后的效果

现在你应该可以：

1. 上传多张图片。
2. 从空白画布拖出框选矩形。
3. 框住一张或多张图片。
4. 松开鼠标后，被框住的图片变成选中状态。

注意：这一节框选结果会替换当前选择。

如果你原来选中了图片 A，然后框选图片 B 和 C，最后选中状态会变成：

```ts
selectedIds = [B, C]
```

Shift 追加框选会在下一小节做。
