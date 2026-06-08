# Lesson 02.1：定义最小文本元素类型

## 本节目标

本节只做一件事：把 `CanvasElement = never` 改成一个可以描述文本元素的数据类型。

本节不渲染元素，不创建 Konva.Text，不处理拖拽，不处理选中。

## 参考 ai-design-canvas

先看原项目：

```text
/Users/fyy/Desktop/projects/ai-design-canvas/src/type/element.ts
```

原项目里元素类型的核心结构是：

```ts
export const ElementType = {
  IMAGE: "image",
  TEXT: "text",
  GROUP: "group",
} as const;

export enum ElementStatus {
  SUCCESS = "success",
}

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

export interface TextElementData extends BaseElementData {
  type: typeof ElementType.TEXT;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
}
```

原项目还支持 image、group、富文本、字体加载、拖拽回调等复杂字段。我们这一节先只保留文本渲染需要的字段。

## canvas-teacher 对应 commit

```bash
cd /Users/fyy/Desktop/projects/canvas-teacher
git show f90e21c
```

## 你要改哪个文件

只改这个文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/workspaceStore.ts
```

不要改：

- `CanvasElements.tsx`
- `InfiniteCanvas.tsx`
- `CanvasWorkspace.tsx`
- `index.scss`

## 修改位置

找到这一行：

```ts
export type CanvasElement = never;
```

把它替换成下面这整段：

```ts
export const ElementType = {
  TEXT: 'text',
} as const;

export enum ElementStatus {
  SUCCESS = 'success',
}

export type ElementType = (typeof ElementType)[keyof typeof ElementType];

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

export interface TextElementData extends BaseElementData {
  type: typeof ElementType.TEXT;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic' | 'bold' | 'bold italic';
  fill?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export type CanvasElement = TextElementData;
```

## 为什么这样改

之前是：

```ts
export type CanvasElement = never;
```

意思是：当前画布不允许有任何元素。

这在 Lesson 01 是合理的，因为我们只创建空 Stage。

但是 Lesson 02 要开始渲染元素，`store.elements` 必须有真实类型。我们先定义文本元素，因为文本不需要图片加载、上传、跨域和后端接口，最适合作为第一条元素渲染链路。

## 为什么字段要这样设计

### `ElementType`

```ts
export const ElementType = {
  TEXT: 'text',
} as const;
```

参考原项目的 `ElementType.TEXT`。

以后加图片时扩展成：

```ts
IMAGE: 'image'
```

以后加分组时扩展成：

```ts
GROUP: 'group'
```

### `ElementStatus`

```ts
export enum ElementStatus {
  SUCCESS = 'success',
}
```

参考原项目的 `ElementStatus`。

文本元素现在没有加载过程，所以只保留 `SUCCESS`。图片元素以后会需要 `LOADED`、`FAILED` 等状态。

### `BaseElementData`

```ts
id
file_name
type
status
x
y
width
height
zIndex
opacity
```

这些是图片、文本、分组都可能共用的基础字段。

其中：

- `id`：用来找到元素，也会对应 Konva node 的 `name`。
- `type`：让 `CanvasElements` 知道该创建文本节点还是图片节点。
- `x/y`：元素在画布坐标系里的位置。
- `width/height`：元素尺寸。
- `zIndex`：元素层级。
- `opacity`：透明度。

### `TextElementData`

```ts
text
fontSize
fontFamily
fontStyle
fill
align
verticalAlign
padding
lineHeight
letterSpacing
```

这些字段会在下一小节传给 `createTextNode()`，最终变成 `Konva.Text` 的配置。

## 本节完成后应该能解释

1. 为什么 `CanvasElement = never` 代表当前没有元素能力。
2. 为什么第一种元素先选 text，而不是 image。
3. `BaseElementData` 和 `TextElementData` 的关系。
4. `type: typeof ElementType.TEXT` 为什么能让 TypeScript 识别这是文本元素。
5. 这些字段下一步会如何传给 `Konva.Text`。
