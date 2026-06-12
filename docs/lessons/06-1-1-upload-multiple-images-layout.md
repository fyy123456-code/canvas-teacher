# Lesson 06.1.1：多张图片上传后不要重叠

这一节是对 Lesson 06.1 的补充。

上一节已经可以一次选择多张图片，但是位置只是简单地错开 `24px`：

```ts
x: 80 + index * 24,
y: 80 + index * 24,
```

如果图片比较大，这种错位还是会互相重叠。

这一节要改成：多张图片上传后，按照图片真实宽度横向排开，并且图片之间留出固定间距。

## 参考 ai-design-canvas 的地方

`ai-design-canvas` 里不是在上传组件里随手写坐标，而是有独立的位置计算工具：

```ts
src/utils/elementPositionStrategy.ts
```

然后 `store.addElements(...)` 会先调用位置计算，再把元素加入画布。

我们这节也按这个方向做：

```txt
Toolbar 只负责读取文件
workspaceStore 负责添加元素
elementPositionStrategy 负责计算元素位置
```

这样后面不管是上传、复制粘贴，还是 AI 拆分图片，只要走 `addElements`，都可以复用同一套摆放逻辑。

## 第 1 步：新增位置计算文件

新增文件：

```ts
src/utils/elementPositionStrategy.ts
```

写入：

```ts
import type { CanvasElement } from '../store/workspaceStore';

export interface PositionConfig {
  horizontalGap: number;
  verticalGap: number;
  startX: number;
  startY: number;
  defaultWidth: number;
  defaultHeight: number;
}

export const DEFAULT_POSITION_CONFIG: PositionConfig = {
  horizontalGap: 40,
  verticalGap: 120,
  startX: 100,
  startY: 100,
  defaultWidth: 200,
  defaultHeight: 200,
};
```

### 为什么要有 DEFAULT_POSITION_CONFIG

这是位置规则的统一配置。

`horizontalGap: 40` 表示同一批图片之间横向间距是 `40px`。

`verticalGap: 120` 表示新一批图片会放到已有元素下方，并且留出 `120px` 间距。

`startX / startY` 表示空画布第一批元素从哪里开始放。

这些配置名和思路都参考了 `ai-design-canvas`。

## 第 2 步：在位置文件里计算已有元素边界

继续在：

```ts
src/utils/elementPositionStrategy.ts
```

加入：

```ts
function getElementBounds(element: CanvasElement, config: PositionConfig) {
  const x = element.x ?? 0;
  const y = element.y ?? 0;
  const width = element.width ?? config.defaultWidth;
  const height = element.height ?? config.defaultHeight;

  return {
    x,
    y,
    width,
    height,
    right: x + width,
    bottom: y + height,
  };
}
```

### 为什么要算 bottom

如果画布上已经有图片，新上传的一批图片不能继续放在 `100, 100`，否则会和已有图片重叠。

所以要先找到已有元素最下面的位置：

```ts
bottom = y + height
```

新的一批图片就可以放到这个位置下面。

## 第 3 步：计算一批图片的起点

继续加入：

```ts
function getBatchStartPosition(elements: CanvasElement[], config: PositionConfig) {
  if (elements.length === 0) {
    return {
      x: config.startX,
      y: config.startY,
    };
  }

  const maxBottom = elements.reduce((bottom, element) => {
    return Math.max(bottom, getElementBounds(element, config).bottom);
  }, config.startY);

  return {
    x: config.startX,
    y: maxBottom + config.verticalGap,
  };
}
```

### 为什么这样做

如果画布为空，第一批图片放在：

```ts
x: 100,
y: 100,
```

如果画布里已经有元素，新的一批图片放在已有元素的下方：

```ts
y: maxBottom + verticalGap
```

这样新上传的一批图片不会压到旧图片上。

## 第 4 步：计算多张新图片的位置

继续加入：

```ts
export function calculateElementsPositions(
  newElements: CanvasElement[],
  existingElements: CanvasElement[],
  config: Partial<PositionConfig> = {},
) {
  const finalConfig = {
    ...DEFAULT_POSITION_CONFIG,
    ...config,
  };
  const batchStartPosition = getBatchStartPosition(existingElements, finalConfig);
  let currentX = batchStartPosition.x;

  return newElements.map((element) => {
    if (element.x !== undefined && element.y !== undefined) {
      currentX = element.x + (element.width ?? finalConfig.defaultWidth) + finalConfig.horizontalGap;
      return element;
    }

    const positionedElement = {
      ...element,
      x: element.x ?? currentX,
      y: element.y ?? batchStartPosition.y,
    };

    currentX =
      positionedElement.x +
      (positionedElement.width ?? finalConfig.defaultWidth) +
      finalConfig.horizontalGap;

    return positionedElement;
  });
}
```

### 为什么要 currentX

`currentX` 表示下一张图片应该放到哪里。

第一张图片放在：

```ts
x: 100
```

假设第一张图片宽 `300px`，间距是 `40px`，第二张图片就放在：

```ts
x: 100 + 300 + 40
```

这样两张图片之间就不会重叠。

## 第 5 步：修改 workspaceStore

修改文件：

```ts
src/store/workspaceStore.ts
```

顶部加入：

```ts
import { calculateElementsPositions } from '../utils/elementPositionStrategy';
```

然后把原来的：

```ts
addElement(element: CanvasElement) {
  this.elements.push({
    ...element,
    zIndex: element.zIndex ?? this.elements.length + 2,
  });
}
```

改成：

```ts
addElement(element: CanvasElement) {
  return this.addElements([element])[0];
}

addElements(elements: CanvasElement[]) {
  const positionedElements = calculateElementsPositions(elements, this.elements);
  const startIndex = this.elements.length;
  const nextElements = positionedElements.map((element, index) => ({
    ...element,
    zIndex: element.zIndex ?? startIndex + index + 2,
  }));

  this.elements.push(...nextElements);
  return nextElements;
}
```

### 为什么要加 addElements

`addElement` 只能处理一张图片。

多图上传时，如果每次循环调用 `addElement`，每张图片都不知道同一批里其他图片的位置。

`addElements` 可以一次拿到整批图片，然后统一排布。

这和 `ai-design-canvas` 的思路一致。

## 第 6 步：修改 Toolbar 上传逻辑

修改文件：

```ts
src/components/toolbar/Toolbar.tsx
```

把循环里直接 `store.addElement(...)` 的逻辑，改成先生成数组：

```ts
const elements = await Promise.all(
  files.map(async (file) => {
    const src = URL.createObjectURL(file);
    const { width, height } = await getImageSize(src);
    const id = store.generateId();

    return {
      id,
      type: ElementType.IMAGE,
      status: ElementStatus.LOADED,
      file_name: file.name,
      src,
      width,
      height,
    };
  }),
);

store.addElements(elements);
```

### 为什么 Toolbar 不再写 x/y

Toolbar 的职责是“选择图片文件并生成图片元素数据”。

图片应该放在哪里，是画布元素位置策略的职责。

所以这里不再写：

```ts
x: 80 + index * 24,
y: 80 + index * 24,
```

而是交给：

```ts
calculateElementsPositions(...)
```

统一计算。

## 完成后的效果

一次上传多张图片时：

1. 第一张图片放到本批起点。
2. 第二张图片放到第一张图片右侧，并留出 `40px` 间距。
3. 第三张图片放到第二张图片右侧，并留出 `40px` 间距。
4. 如果画布已经有图片，新上传的一批会放到已有元素下方，避免覆盖旧元素。

## 你需要检查什么

运行项目后检查：

1. 一次选择多张图片。
2. 多张图片不应该互相重叠。
3. 图片之间应该有明显间距。
4. 再上传第二批图片时，第二批应该出现在第一批下方。
5. 每张图片仍然可以单独选中、拖动、缩放、删除。
