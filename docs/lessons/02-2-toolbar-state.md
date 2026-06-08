# Lesson 02.2：给工具栏准备编辑模式和配置

## 本节目标

本节只做一件事：在 store 里增加左侧工具栏需要的最小状态。

本节不做工具栏 UI，不写按钮，不画图标。

## 为什么不直接先写工具栏 UI

参考 `ai-design-canvas`，工具栏不是孤立的 UI。

工具栏按钮点击以后，核心动作是修改 store：

```text
选择工具 -> store.setEditMode("select")
手型工具 -> store.setEditMode("viewport-drag")
文字工具 -> store.setEditMode("text")
```

所以在写 UI 之前，store 里必须先有：

```text
editMode
setEditMode
toolbarList
```

否则按钮即使画出来，也没有地方保存当前模式。

## 参考 ai-design-canvas

看这几个位置：

```text
/Users/fyy/Desktop/projects/ai-design-canvas/src/store/workSpaceStore.ts
/Users/fyy/Desktop/projects/ai-design-canvas/src/components/side-tool-bar/index.tsx
/Users/fyy/Desktop/projects/ai-design-canvas/src/components/side-tool-bar/tool-bar-config.ts
```

原项目 store 里有：

```ts
export type EditMode = "select" | "viewport-drag" | "inpainting" | "redraw" | "clip" | "text" | "annotation";

editMode: "select" as EditMode,

toolbarList: toolbar.toolBarList,
toolbarWrapperClass: toolbar.wrapperClass,

setEditMode(mode: EditMode) {
  this.editMode = mode;
}
```

原项目工具栏配置里有：

```ts
ToolBarItemEnum.Select
ToolBarItemEnum.Hand
ToolBarItemEnum.Text
```

我们这一节只保留最小版本。

## canvas-teacher 对应 commit

```bash
cd /Users/fyy/Desktop/projects/canvas-teacher
git show <本节 commit>
```

提交后会替换成真实 commit id。

## 你要改哪个文件

只改这个文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/workspaceStore.ts
```

不要改：

- `CanvasWorkspace.tsx`
- `InfiniteCanvas.tsx`
- `CanvasElements.tsx`
- `styles/index.scss`

## 修改 1：在元素类型后面增加工具栏相关类型

找到这行：

```ts
export type ElementType = (typeof ElementType)[keyof typeof ElementType];
```

在它下面新增：

```ts
export type EditMode = 'select' | 'viewport-drag' | 'text';

export enum ToolBarItemEnum {
  Select = 'Select',
  Hand = 'Hand',
  Text = 'Text',
}

export interface ToolBarItem {
  toolName: ToolBarItemEnum;
}
```

### 为什么这样改

`EditMode` 表示当前画布处于什么操作模式。

现在先支持 3 个模式：

- `select`：选择模式
- `viewport-drag`：拖动画布模式
- `text`：添加文字模式

`ToolBarItemEnum` 表示工具栏上有哪些按钮。

现在先支持 3 个按钮：

- Select
- Hand
- Text

这对应原项目工具栏的最小可学习版本。

## 修改 2：在 WorkSpaceStore 里新增状态字段

找到：

```ts
export class WorkSpaceStore {
  width: number;
  height: number;
  elements: CanvasElement[];
```

在 `elements` 后面新增：

```ts
  editMode: EditMode = 'select';
  toolbarList: ToolBarItem[] = [
    { toolName: ToolBarItemEnum.Select },
    { toolName: ToolBarItemEnum.Hand },
    { toolName: ToolBarItemEnum.Text },
  ];
  toolbarWrapperClass = '';
```

### 为什么这样改

`editMode` 保存当前工具模式。

`toolbarList` 决定工具栏显示哪些按钮。

`toolbarWrapperClass` 是参考原项目保留的扩展点。现在先给空字符串，后面如果要支持外部传入样式类，可以继续扩展。

## 修改 3：新增 setEditMode 方法

找到：

```ts
  setLayer(layer: Konva.Layer | null) {
    this.layer = layer;
  }
```

在它下面新增：

```ts
  setEditMode(mode: EditMode) {
    this.editMode = mode;
  }
```

### 为什么这样改

工具栏按钮不要直接修改：

```ts
store.editMode = 'text';
```

而是统一调用：

```ts
store.setEditMode('text');
```

这样以后我们可以在 `setEditMode` 里继续加逻辑，比如：

- 切换到手型工具时取消选中
- 切换到文字工具时改变鼠标
- 切换模式时通知外部
- 切换模式时关闭某些面板

原项目也是这样做的。

## 本节完成后应该能解释

1. 工具栏为什么需要 store 状态。
2. `editMode` 是什么。
3. `toolbarList` 是什么。
4. 为什么按钮点击应该调用 `setEditMode`。
5. 为什么这一节先不做 UI。
