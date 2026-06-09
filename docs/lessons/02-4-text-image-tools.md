# Lesson 02.4：左侧工具栏接入文字和图片

## 本节目标

这一节让左侧工具栏的两个按钮真正产生画布内容：

```text
点击 文字 -> 点击画布 -> 画布出现默认文字
点击 图片 -> 选择本地图片 -> 图片出现在画布中心
```

本节仍然不做：

```text
选中
拖拽
缩放
双击编辑文字
右侧属性栏
viewport 平移缩放
```

## 对齐 ai-design-canvas 的地方

本节参考原项目的这条链路：

```text
Toolbar
  -> 修改 store 或添加元素
WorkSpaceStore
  -> 保存 elements 数据
CanvasElements
  -> 根据 element.type 创建 Konva 节点
createTextElement / createImageElement
  -> 封装 new Konva.Text / new Konva.Image
```

参考文件：

```text
/Users/fyy/Desktop/projects/ai-design-canvas/src/components/side-tool-bar/index.tsx
/Users/fyy/Desktop/projects/ai-design-canvas/src/workSpace/CanvasElements.tsx
/Users/fyy/Desktop/projects/ai-design-canvas/src/elements/createTextElement.tsx
/Users/fyy/Desktop/projects/ai-design-canvas/src/elements/createImageElement.tsx
/Users/fyy/Desktop/projects/ai-design-canvas/src/type/element.ts
```

## 本节改动文件

按这个顺序改：

1. `src/store/workspaceStore.ts`
2. `src/elements/createTextElement.ts`
3. `src/elements/createImageElement.ts`
4. `src/canvas/CanvasElements.tsx`
5. `src/canvas/InfiniteCanvas.tsx`
6. `src/components/toolbar/Toolbar.tsx`
7. `src/styles/index.scss`

## 第 1 步：扩展元素数据结构

文件：

```text
src/store/workspaceStore.ts
```

要改什么：

```text
ElementType 增加 IMAGE
ElementStatus 增加 LOADED / FAILED
新增 ImageElementData
CanvasElement 改成 ImageElementData | TextElementData
WorkSpaceStore 增加 generateId / addElement / updateElement
```

为什么：

画布不是直接保存 Konva 节点，而是保存普通数据：

```text
文字元素数据 -> CanvasElements -> Konva.Text
图片元素数据 -> CanvasElements -> Konva.Image
```

这是原项目的核心方式。后面做保存、复制、选择、属性栏时，都要围绕 `elements` 数据做。

## 第 2 步：创建文字节点工厂

新增文件：

```text
src/elements/createTextElement.ts
```

这个文件负责：

```text
createTextNode()  -> new Konva.Text()
updateTextNode()  -> textNode.setAttrs()
```

为什么：

`CanvasElements` 不直接写 `new Konva.Text()`，而是调用工厂函数。

这样分层后：

```text
CanvasElements 管“什么类型用哪个 renderer”
createTextElement 管“Konva.Text 怎么创建和更新”
```

注意这里有一个关键细节：

```ts
if (typeof restConfig.zIndex !== 'number' || Number.isNaN(restConfig.zIndex) || restConfig.zIndex === textNode.zIndex()) {
  delete restConfig.zIndex;
}
```

不要把 `zIndex: undefined` 传给 Konva。否则节点层级可能异常，文字会被背景盖住。

## 第 3 步：创建图片节点工厂

新增文件：

```text
src/elements/createImageElement.ts
```

这个文件负责：

```text
createImageNode()  -> new Konva.Image()
updateImageNode()  -> imageNode.setAttrs()
loadImageDirectly() -> window.Image 加载本地 object URL
```

为什么：

图片和文字一样，都要走“元素数据 -> Konva 节点”的通道。

本节不依赖后端上传，只用：

```ts
URL.createObjectURL(file)
```

生成本地预览地址。

## 第 4 步：让 CanvasElements 渲染图片和文字

文件：

```text
src/canvas/CanvasElements.tsx
```

要改什么：

```text
新增 ImageElementRenderer
新增 TextElementRenderer
CanvasElements 遍历 elements
  type === image -> ImageElementRenderer
  type === text  -> TextElementRenderer
```

为什么：

这一步是 React 和 Konva 的桥。

React 组件本身不显示 DOM 内容，它只负责在 `useEffect` 里创建 Konva 节点：

```text
组件挂载 -> createTextNode / createImageNode
数据变化 -> updateTextNode / updateImageNode
组件卸载 -> node.remove() + node.destroy()
```

注意：`CanvasElements` 必须放在 Konva mount container 外面。

Konva Stage 会接管 `containerRef` 指向的 DOM，如果把 React 子组件放进这个 container 里面，React 子组件可能被 Konva 清掉。

## 第 5 步：InfiniteCanvas 处理点击画布插入文字

文件：

```text
src/canvas/InfiniteCanvas.tsx
```

要改什么：

```text
把 InfiniteCanvas 包成 observer
读取 editMode 和 elements
新增 addTextElementAtStagePoint()
editMode 为 text 时绑定 stage.on('click')
CanvasElements 使用 elements={store.elements.slice()}
```

为什么：

点击 `文字` 后，只是把模式改成：

```ts
store.setEditMode('text');
```

真正创建文字发生在画布点击时：

```text
stage.on('click')
  -> 读取 stage.getPointerPosition()
  -> 把鼠标坐标转换成 canvas/layer 坐标
  -> store.addElement(text)
  -> store.setEditMode('select')
```

这里用：

```ts
const transform = layer.getAbsoluteTransform().copy();
transform.invert();
const position = transform.point(point);
```

这是为了后面接 viewport 缩放、平移时仍然正确。现在看起来像多余代码，但它是画布编辑器必须掌握的坐标转换基础。

## 第 6 步：Toolbar 接入本地图片上传

文件：

```text
src/components/toolbar/Toolbar.tsx
```

要改什么：

```text
新增隐藏 input[type="file"]
点击 图片 -> fileInputRef.current?.click()
选择图片 -> URL.createObjectURL(file)
读取图片原始宽高
按最大 320 x 240 缩放
把 image element 添加到 store.elements
```

为什么：

本节先不依赖后端，所以图片只做本地预览。

上传图片后的数据仍然进入 `store.elements`：

```ts
store.addElement({
  id,
  type: ElementType.IMAGE,
  status: ElementStatus.LOADED,
  file_name: file.name,
  src,
  x,
  y,
  width,
  height,
  opacity: 1,
});
```

然后由 `CanvasElements` 创建 `Konva.Image`。

## 第 7 步：隐藏文件 input

文件：

```text
src/styles/index.scss
```

新增：

```scss
.toolbar-file-input {
  display: none;
}
```

为什么：

用户只需要看到工具栏按钮，不需要看到浏览器原生文件选择控件。

## 本节完成后应该看到

1. 点击 `文字`，按钮变成选中状态。
2. 点击画布，出现 `双击编辑文字`。
3. 插入文字后，`文字` 按钮退出选中状态。
4. 点击 `图片`，浏览器打开本地文件选择。
5. 选择图片后，图片显示在画布中心。

## 本节你要掌握的知识

1. 工具栏按钮不直接操作 Konva 节点，而是修改 store 或添加元素数据。
2. `store.elements` 是画布内容的数据源。
3. `CanvasElements` 是数据和 Konva 节点之间的桥。
4. `createTextElement` / `createImageElement` 是节点创建细节的封装。
5. 坐标转换要用 layer transform，为之后 viewport 缩放/平移做准备。
6. 不能把 `zIndex: undefined` 传给 Konva。

## 验证命令

```bash
cd /Users/fyy/Desktop/projects/canvas-teacher
pnpm typecheck
pnpm build
```
