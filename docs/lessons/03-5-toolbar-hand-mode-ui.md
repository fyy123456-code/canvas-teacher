# Lesson 03.5：在左侧工具栏加入手型拖拽入口

## 本节目标

本节只做一件事：在左侧工具栏加入“手型拖拽”按钮，并把当前编辑模式切换成：

```ts
viewport-drag
```

本节只做 UI 和状态，不做真正拖动画布。

真正的拖动画布会在下一节做。

## 本节为什么先不做拖拽

手型拖拽可以拆成两步：

```text
1. 工具栏有一个 hand 按钮，可以切换模式
2. InfiniteCanvas 根据这个模式处理鼠标拖拽，移动 viewport.x / y
```

如果两个一起做，你会分不清：

```text
是 toolbar 控制模式
还是 stage 处理拖拽
```

所以本节只做第 1 步。

## 本节改动文件

按顺序改 3 个文件：

```text
src/store/workspaceStore.ts
src/components/toolbar/Toolbar.tsx
src/styles/index.scss
```

## 第 1 步：修改 `src/store/workspaceStore.ts`

### 修改位置 1：新增 EditMode 类型

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/workspaceStore.ts
```

找到：

```ts
export type CanvasElement = ImageElementData;
```

在下面新增：

```ts
export type EditMode = 'select' | 'viewport-drag';
```

### 为什么这样改

`EditMode` 表示当前画布处于什么编辑模式。

现在先只有两个模式：

```text
select：默认选择模式
viewport-drag：手型拖动画布模式
```

后面做文字工具时，会继续加：

```ts
'text'
```

### 修改位置 2：给 store 增加 editMode

找到：

```ts
elements: CanvasElement[];
viewport: Viewport;
```

改成：

```ts
elements: CanvasElement[];
editMode: EditMode = 'select';
viewport: Viewport;
```

### 为什么这样改

`editMode` 是全局画布状态。

左侧工具栏、画布拖拽、元素交互都要根据它判断当前应该做什么。

### 修改位置 3：新增 setEditMode 方法

找到：

```ts
setSize(width: number, height: number) {
  this.width = width;
  this.height = height;
}
```

在它下面新增：

```ts
setEditMode(mode: EditMode) {
  this.editMode = mode;
}
```

### 为什么这样改

修改模式应该通过 store 方法完成，而不是在组件里直接写：

```ts
store.editMode = 'viewport-drag'
```

这样后续加逻辑时入口统一。

## 第 2 步：修改 `src/components/toolbar/Toolbar.tsx`

### 修改位置 1：给工具列表增加 hand

找到：

```ts
const TOOLBAR_ITEMS = [
  {
    id: 'upload-image',
```

改成：

```ts
const TOOLBAR_ITEMS = [
  {
    id: 'hand',
    label: '手',
    title: '拖动画布',
  },
  {
    id: 'upload-image',
```

### 为什么这样改

工具栏最上面先放手型工具。

当前项目没有图标库，所以先用文字“手”代替手型 icon。后面如果引入图标库，可以把 label 换成图标组件。

### 修改位置 2：在 `handleToolClick` 里处理 hand

找到：

```ts
const handleToolClick = (itemId: ToolbarItemId) => {
  if (itemId === 'upload-image') {
    handleImageButtonClick();
  }
};
```

改成：

```ts
const handleToolClick = (itemId: ToolbarItemId) => {
  if (itemId === 'hand') {
    store.setEditMode(store.editMode === 'viewport-drag' ? 'select' : 'viewport-drag');
    return;
  }

  if (itemId === 'upload-image') {
    handleImageButtonClick();
  }
};
```

### 为什么这样改

点击手型按钮时：

```text
如果当前不是 hand 模式 -> 切到 viewport-drag
如果当前已经是 hand 模式 -> 切回 select
```

这样你可以反复点击按钮观察 active 状态变化。

### 修改位置 3：给按钮增加 active 状态

找到：

```tsx
{TOOLBAR_ITEMS.map((item) => (
  <button
    key={item.id}
    type="button"
    className="toolbar-button"
    title={item.title}
    onClick={() => handleToolClick(item.id)}
  >
    {item.label}
  </button>
))}
```

改成：

```tsx
{TOOLBAR_ITEMS.map((item) => {
  const isActive = item.id === 'hand' && store.editMode === 'viewport-drag';

  return (
    <button
      key={item.id}
      type="button"
      className={isActive ? 'toolbar-button toolbar-button-active' : 'toolbar-button'}
      title={item.title}
      aria-pressed={isActive}
      onClick={() => handleToolClick(item.id)}
    >
      {item.label}
    </button>
  );
})}
```

### 为什么这样改

`isActive` 用来判断当前 hand 按钮是否处于激活状态。

`aria-pressed` 是按钮可访问性状态，表示这个按钮是否被按下。

## 第 3 步：修改 `src/styles/index.scss`

### 修改位置

找到：

```scss
.toolbar-button:hover {
  background: #edeff1;
}
```

改成：

```scss
.toolbar-button:hover,
.toolbar-button-active {
  background: #edeff1;
}
```

### 为什么这样改

hover 表示鼠标移上去的状态。

active 表示当前工具被选中的状态。

手型模式开启后，即使鼠标不悬停，按钮也要保持灰色背景。

## 本节完成后你应该看到

左侧工具栏多一个按钮：

```text
手
图片
文字
```

点击“手”后，它会变成 active 状态。

再次点击“手”，它会回到普通状态。

但现在还不能拖动画布，这是正确的。

## 下一节做什么

下一节会让 `InfiniteCanvas` 根据：

```ts
store.editMode === 'viewport-drag'
```

处理鼠标拖拽，然后更新：

```ts
viewport.x
viewport.y
```

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
