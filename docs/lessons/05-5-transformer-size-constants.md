# Lesson 05.5：把图片缩放尺寸限制抽成常量

这一节只做一个很小的对齐：把 Transformer 里面写死的最小尺寸、最大尺寸，抽到单独的常量文件里。

这样做是为了和 `ai-design-canvas` 保持一致。参考项目里图片元素尺寸限制放在：

```ts
src/constants/element.ts
```

我们的项目也用同样的位置和同样的常量名。

## 这节要做什么

当前图片选中后，可以拖动四个角进行缩放。之前尺寸限制直接写在：

```ts
src/canvas/CanvasElements.tsx
```

里面：

```ts
const MIN_TRANSFORM_SIZE = 20;
const MAX_TRANSFORM_SIZE = 3000;
```

这样能工作，但不够通用。以后右侧属性面板、快捷键、菜单命令都可能需要知道“一张图片最小能缩到多小、最大能放到多大”。

所以这一节要把它们提取成公共常量。

## 第 1 步：新建常量文件

修改文件：

```ts
src/constants/element.ts
```

如果没有 `constants` 文件夹，就先创建：

```txt
src/constants
```

然后新建 `element.ts`，写入：

```ts
export const MAX_IMAGE_ELEMENT_SIZE = 8166;
export const MIN_IMAGE_ELEMENT_SIZE = 6;
```

### 为什么这样写

`MAX_IMAGE_ELEMENT_SIZE` 表示图片元素允许的最大尺寸。

`MIN_IMAGE_ELEMENT_SIZE` 表示图片元素允许的最小尺寸。

这两个名字和 `ai-design-canvas` 保持一致。之后你看参考项目源码时，会更容易把两个项目里的逻辑对应起来。

## 第 2 步：修改 CanvasElements.tsx 的 import

修改文件：

```ts
src/canvas/CanvasElements.tsx
```

在顶部 import 区域加入：

```ts
import {
  MAX_IMAGE_ELEMENT_SIZE,
  MIN_IMAGE_ELEMENT_SIZE,
} from "../constants/element";
```

### 为什么这样改

`CanvasElements.tsx` 负责创建 Transformer。

Transformer 的 `boundBoxFunc` 需要判断用户缩放后的尺寸是否合法，所以这里要使用图片尺寸常量。

## 第 3 步：删除组件内部写死的尺寸常量

还是修改：

```ts
src/canvas/CanvasElements.tsx
```

删除这两行：

```ts
const MIN_TRANSFORM_SIZE = 20;
const MAX_TRANSFORM_SIZE = 3000;
```

### 为什么要删除

如果这里继续保留本地常量，就会出现两套规则：

```txt
constants/element.ts 里面一套
CanvasElements.tsx 里面一套
```

以后改尺寸限制时，很容易只改一个地方，另一个地方忘了改。

## 第 4 步：修改 boundBoxFunc

找到 `new Konva.Transformer({ ... })` 里面的：

```ts
boundBoxFunc: (oldBox, newBox) => {
  if (
    newBox.width < MIN_TRANSFORM_SIZE ||
    newBox.height < MIN_TRANSFORM_SIZE ||
    newBox.width > MAX_TRANSFORM_SIZE ||
    newBox.height > MAX_TRANSFORM_SIZE
  ) {
    return oldBox;
  }

  return newBox;
},
```

改成：

```ts
boundBoxFunc: (oldBox, newBox) => {
  if (
    newBox.width < MIN_IMAGE_ELEMENT_SIZE ||
    newBox.height < MIN_IMAGE_ELEMENT_SIZE ||
    newBox.width > MAX_IMAGE_ELEMENT_SIZE ||
    newBox.height > MAX_IMAGE_ELEMENT_SIZE
  ) {
    return oldBox;
  }

  return newBox;
},
```

### 为什么判断 newBox

`oldBox` 是缩放前的框。

`newBox` 是用户这一次拖拽之后，Konva 计算出来的新框。

我们要判断的是“用户想变成的新尺寸是否合法”，所以必须判断 `newBox`。

如果判断 `oldBox`，就会出现一个问题：图片缩到最小尺寸以后，继续拖动时 `oldBox` 已经很小，后续就可能一直被挡住，导致无法再放大。

## 这一节完成后的效果

画布功能看起来不会有明显变化。

但是代码结构更接近 `ai-design-canvas`：

```txt
src/constants/element.ts
  管图片尺寸规则

src/canvas/CanvasElements.tsx
  管图片节点和 Transformer 的画布行为
```

这就是一个更合理的边界：规则放到 constants，画布行为放到 canvas。

## 你需要检查什么

运行：

```bash
pnpm typecheck
```

然后在页面里检查：

1. 上传一张图片。
2. 点击图片选中。
3. 拖动四个角缩小图片。
4. 图片不能无限缩小。
5. 缩到很小之后，还可以再拖大。

如果这些都正常，说明这一节完成。
