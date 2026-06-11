# Lesson 05.3：限制 Transformer 最小缩放尺寸

## 本节目标

上一节我们完成了：

```text
Transformer 缩放图片
transformend 后保存 width / height
重置 scaleX / scaleY
```

这一节处理一个真实编辑器必须有的限制：

```text
图片不能被缩到太小
```

本节目标：

```text
图片宽度不能小于 20
图片高度不能小于 20
```

## 本节不会做什么

- 不限制最大尺寸
- 不做等比缩放
- 不做多选
- 不做旋转
- 不做不同元素类型的尺寸规则

本节只做：

```text
boundBoxFunc 限制最小宽高
```

## 参考 ai-design-canvas

`ai-design-canvas` 的 Transformer 里也使用了：

```ts
boundBoxFunc
```

它会根据图片节点计算最小/最大缩放范围。

我们现在项目还很简单，所以先做最小版：

```ts
if (newBox.width < 20 || newBox.height < 20) {
  return oldBox;
}
return newBox;
```

## 本节改动文件

只改 1 个文件：

```text
src/canvas/CanvasElements.tsx
```

## 第 1 步：新增最小尺寸常量

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasElements.tsx
```

找到 import 区域下面：

```ts
import { ElementType } from '../store/workspaceStore';
import type { CanvasElement } from '../store/workspaceStore';
```

在下面新增：

```ts
const MIN_TRANSFORM_SIZE = 20;
```

## 为什么这样改

不要把 `20` 直接写在 `boundBoxFunc` 里。

单独定义常量有两个好处：

```text
1. 看到名字就知道含义
2. 后面改最小尺寸只改一个地方
```

## 第 2 步：给 Transformer 增加 boundBoxFunc

找到：

```ts
const transformer = new Konva.Transformer({
  rotateEnabled: false,
  flipEnabled: false,
```

改成：

```ts
const transformer = new Konva.Transformer({
  boundBoxFunc: (oldBox, newBox) => {
    if (newBox.width < MIN_TRANSFORM_SIZE || newBox.height < MIN_TRANSFORM_SIZE) {
      return oldBox;
    }

    return newBox;
  },
  rotateEnabled: false,
  flipEnabled: false,
```

## 为什么这样改

`boundBoxFunc` 是 Konva Transformer 提供的边界控制函数。

它接收两个参数：

```ts
oldBox
newBox
```

可以理解成：

```text
oldBox：当前还没缩放前的框
newBox：用户这次拖动后想变成的框
```

如果你返回：

```ts
return newBox;
```

表示允许这次变化。

如果你返回：

```ts
return oldBox;
```

表示拒绝这次变化，保持原来的框。

所以这里写：

```ts
if (newBox.width < MIN_TRANSFORM_SIZE || newBox.height < MIN_TRANSFORM_SIZE) {
  return oldBox;
}
```

意思是：

```text
如果用户想把图片缩到宽度小于 20
或者高度小于 20
就不允许继续缩
```

## 为什么限制最小尺寸

如果图片太小，会出现这些问题：

```text
图片几乎看不见
Transformer 控制点重叠
很难再次选中
后面属性面板和导出数据容易出现异常值
```

所以真实编辑器都会限制最小尺寸。

## 本节完成后你应该看到

1. 上传图片。
2. 点击图片选中。
3. 拖动 Transformer 四角控制点缩小图片。
4. 缩到一定程度后，不能继续缩小。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
