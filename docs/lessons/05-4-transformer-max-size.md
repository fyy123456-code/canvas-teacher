# Lesson 05.4：限制 Transformer 最大缩放尺寸

## 本节目标

上一节我们限制了最小尺寸：

```text
图片不能缩得太小
```

这一节继续补完整边界：

```text
图片不能放得无限大
```

本节目标：

```text
图片宽度不能大于 3000
图片高度不能大于 3000
```

## 本节不会做什么

- 不做复杂比例限制
- 不做按图片原始尺寸限制
- 不做多选
- 不做旋转
- 不做历史记录
- 不抽离 constants 文件

本节只做：

```text
boundBoxFunc 增加最大宽高判断
```

## 参考 ai-design-canvas

`ai-design-canvas` 里有图片尺寸上下限：

```ts
export const MAX_IMAGE_ELEMENT_SIZE = 8166;
export const MIN_IMAGE_ELEMENT_SIZE = 6;
```

它的 `boundBoxFunc` 会同时限制最小和最大尺寸。

我们教学项目先用更容易观察的简化值：

```ts
const MIN_TRANSFORM_SIZE = 20;
const MAX_TRANSFORM_SIZE = 3000;
```

## 本节改动文件

只改 1 个文件：

```text
src/canvas/CanvasElements.tsx
```

## 第 1 步：新增最大尺寸常量

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasElements.tsx
```

找到：

```ts
const MIN_TRANSFORM_SIZE = 20;
```

在下面新增：

```ts
const MAX_TRANSFORM_SIZE = 3000;
```

## 为什么这样改

最小尺寸和最大尺寸都属于 Transformer 的边界规则。

放在文件顶部更清晰：

```text
MIN_TRANSFORM_SIZE：不能小于多少
MAX_TRANSFORM_SIZE：不能大于多少
```

## 第 2 步：修改 boundBoxFunc

找到：

```ts
boundBoxFunc: (oldBox, newBox) => {
  if (
    newBox.width < MIN_TRANSFORM_SIZE ||
    newBox.height < MIN_TRANSFORM_SIZE
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

## 为什么这样改

`boundBoxFunc` 的核心规则还是：

```text
return oldBox：拒绝这次变化
return newBox：允许这次变化
```

上一节我们拒绝：

```text
newBox 太小
```

这一节继续拒绝：

```text
newBox 太大
```

也就是：

```ts
newBox.width > MAX_TRANSFORM_SIZE
newBox.height > MAX_TRANSFORM_SIZE
```

只要宽度或高度超过最大值，就返回 `oldBox`，不允许继续放大。

## 本节完成后你应该看到

1. 上传图片。
2. 点击图片选中。
3. 拖动 Transformer 四角控制点放大图片。
4. 放大到一定程度后，不能继续放大。
5. 缩小时仍然不能小于上一节设置的最小尺寸。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
