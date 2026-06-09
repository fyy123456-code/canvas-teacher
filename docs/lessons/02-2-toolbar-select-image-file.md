# Lesson 02.2：点击图片按钮选择本地图片文件

## 本节目标

本节只做一件事：点击工具栏里的“图片”按钮后，打开系统文件选择器，并拿到用户选择的图片 `File`。

这一步仍然不做这些事情：

- 不把图片渲染到画布上
- 不创建图片元素类型
- 不修改 `workspaceStore.ts`
- 不上传到后端
- 不保存图片数据

原因是：图片进入画布可以拆成几步：

1. 先从本地电脑选到一个 `File`。
2. 再把 `File` 转成浏览器可预览的本地 URL。
3. 再设计图片元素的数据结构。
4. 再用 Konva 把图片画到画布上。

本节只完成第 1 步。

## 本节参考 ai-design-canvas 的哪里

原项目上传图片入口在：

```text
ai-design-canvas/src/components/side-tool-bar/index.tsx
```

里面的核心思路是：

```ts
const input = document.createElement("input");
input.type = "file";
input.accept = "image/*";
input.onchange = async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
};
input.click();
```

我们这一节不直接照搬 `document.createElement("input")`，而是在 React 组件里提前放一个隐藏的 `<input type="file" />`，再用 `ref` 触发它。

两种方式本质一样：都是通过浏览器原生文件选择器拿到 `File`。

## 本节改动文件

只改 2 个文件：

```text
src/components/toolbar/Toolbar.tsx
src/styles/index.scss
```

你在 `canvas-student` 里也按这个顺序手写。

## 第 1 步：修改 `src/components/toolbar/Toolbar.tsx`

### 修改位置 1：文件顶部新增导入

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/components/toolbar/Toolbar.tsx
```

在文件第一行新增：

```tsx
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
```

为什么这样改：

- `useRef` 用来保存隐藏文件输入框的 DOM 节点。
- `ChangeEvent` 用来给 `onChange` 事件加 TypeScript 类型。

### 修改位置 2：在 `TOOLBAR_ITEMS` 后面新增类型

找到：

```tsx
] as const;
```

在它下面新增：

```tsx
type ToolbarItemId = (typeof TOOLBAR_ITEMS)[number]['id'];
```

为什么这样改：

`TOOLBAR_ITEMS` 里现在有两个 id：

```text
upload-image
text
```

这个类型会自动从配置里推导出：

```ts
'upload-image' | 'text'
```

后面 `handleToolClick` 接收的参数就不会写成随便一个字符串。

### 修改位置 3：在 `Toolbar` 函数开头新增 ref 和事件函数

找到：

```tsx
export function Toolbar() {
  return (
```

改成：

```tsx
export function Toolbar() {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    console.info('[Toolbar] selected image file', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    event.target.value = '';
  };

  const handleToolClick = (itemId: ToolbarItemId) => {
    if (itemId === 'upload-image') {
      handleImageButtonClick();
    }
  };

  return (
```

为什么这样改：

- `imageInputRef` 保存隐藏 input。
- `handleImageButtonClick` 负责点击“图片”按钮后触发 input。
- `handleImageFileChange` 负责读取用户选择的文件。
- `event.target.files?.[0]` 表示只取第一个文件。
- `event.target.value = ''` 是为了允许连续选择同一张图片时也能再次触发 `onChange`。
- `handleToolClick` 先只处理 `upload-image`，文字按钮暂时没有逻辑。

### 修改位置 4：在 toolbar 容器里新增隐藏 input

找到：

```tsx
return (
  <div className="toolbar-container" aria-label="Canvas toolbar">
    <div className="toolbar-panel">
```

改成：

```tsx
return (
  <div className="toolbar-container" aria-label="Canvas toolbar">
    <input
      ref={imageInputRef}
      type="file"
      accept="image/*"
      className="toolbar-file-input"
      onChange={handleImageFileChange}
    />
    <div className="toolbar-panel">
```

为什么这样改：

- `type="file"` 表示这是文件选择输入框。
- `accept="image/*"` 表示只选择图片类型文件。
- `ref={imageInputRef}` 让按钮点击时可以调用它的 `.click()`。
- `onChange={handleImageFileChange}` 在用户选中文件后触发。
- `className="toolbar-file-input"` 用来通过 CSS 隐藏这个 input。

### 修改位置 5：给按钮绑定点击事件

找到：

```tsx
<button key={item.id} type="button" className="toolbar-button" title={item.title}>
  {item.label}
</button>
```

改成：

```tsx
<button
  key={item.id}
  type="button"
  className="toolbar-button"
  title={item.title}
  onClick={() => handleToolClick(item.id)}
>
  {item.label}
</button>
```

为什么这样改：

现在每个按钮点击时都会把自己的 `id` 传给 `handleToolClick`。

当前只有 `upload-image` 会执行打开文件选择器。`text` 传进去后不会做任何事，这是本节的预期结果。

## 第 2 步：修改 `src/styles/index.scss`

### 修改位置 1：把按钮鼠标样式改成可点击

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/styles/index.scss
```

找到 `.toolbar-button` 里的：

```scss
cursor: default;
```

改成：

```scss
cursor: pointer;
```

为什么这样改：

上一节按钮只是 UI，所以是 `default`。这一节图片按钮已经可以触发文件选择器，所以鼠标应该表现为可点击。

### 修改位置 2：在 `.toolbar-button` 后面新增 hover 样式

在 `.toolbar-button` 代码块后面新增：

```scss
.toolbar-button:hover {
  background: #edeff1;
}
```

为什么这样改：

hover 效果让用户知道这个按钮可以操作，也和 `ai-design-canvas` 左侧工具栏的反馈接近。

### 修改位置 3：新增隐藏 input 样式

在 hover 样式后面继续新增：

```scss
.toolbar-file-input {
  display: none;
}
```

为什么这样改：

文件 input 是浏览器原生控件，默认样式很难统一。

我们的交互是：用户点击自定义的“图片”按钮，然后代码触发隐藏 input。这样 UI 保持和工具栏一致。

## 本节完成后你应该看到

页面视觉上和上一节几乎一样。

变化是：

1. 鼠标移到按钮上有 hover 背景。
2. 点击“图片”会打开系统文件选择器。
3. 选择图片后，浏览器控制台会打印：

```text
[Toolbar] selected image file
```

并带上：

```text
name
type
size
```

点击“文字”暂时没有效果，这是正确的。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。

## 本节你需要理解

1. 为什么先拿到 `File`，不马上渲染图片。
2. 为什么用隐藏 input，而不是把原生 file input 直接显示在页面上。
3. `useRef<HTMLInputElement>(null)` 保存的是什么。
4. `accept="image/*"` 只能限制选择器展示，不等于完整的文件安全校验。
5. 为什么选择完文件后要把 `event.target.value` 清空。
