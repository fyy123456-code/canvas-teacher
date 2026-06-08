# Lesson 02.3：左侧工具栏外壳

## 本节目标

本节只做左侧工具栏外壳。

工具栏只显示两个按钮：

- 图片
- 文字

本节不做真实上传，不创建图片元素，不渲染文字元素。

## 为什么先做工具栏外壳

你看到的 `ai-design-canvas` 画布界面，左侧确实先出现工具栏。

参考原项目：

```text
/Users/fyy/Desktop/projects/ai-design-canvas/src/workSpace/index.tsx
/Users/fyy/Desktop/projects/ai-design-canvas/src/components/side-tool-bar/index.tsx
/Users/fyy/Desktop/projects/ai-design-canvas/src/components/side-tool-bar/tool-bar-config.ts
/Users/fyy/Desktop/projects/ai-design-canvas/src/components/side-tool-bar/index.module.scss
```

原项目里工具栏挂在 `Workspace` 里：

```tsx
<Toolbar toolBarList={store.toolbarList} wrapperClass={store.toolbarWrapperClass} />
```

工具栏按钮点击后会修改 store，比如文字按钮：

```ts
store.setEditMode("text");
```

我们这一节保留这个结构，但只实现最小 UI。

## canvas-teacher 对应 commit

```bash
cd /Users/fyy/Desktop/projects/canvas-teacher
git show <本节 commit>
```

提交后会替换成真实 commit id。

## 本节改动文件

按顺序改：

1. `src/store/workspaceStore.ts`
2. `src/components/toolbar/toolbarConfig.ts`
3. `src/components/toolbar/Toolbar.tsx`
4. `src/components/toolbar/index.ts`
5. `src/canvas/CanvasWorkspace.tsx`
6. `src/styles/index.scss`

## 修改 1：调整 store 的工具栏列表

文件：

```text
src/store/workspaceStore.ts
```

找到：

```ts
export enum ToolBarItemEnum {
  Select = 'Select',
  Hand = 'Hand',
  Text = 'Text',
}
```

改成：

```ts
export enum ToolBarItemEnum {
  UploadImage = 'UploadImage',
  Text = 'Text',
}
```

再找到：

```ts
toolbarList: ToolBarItem[] = [
  { toolName: ToolBarItemEnum.Select },
  { toolName: ToolBarItemEnum.Hand },
  { toolName: ToolBarItemEnum.Text },
];
```

改成：

```ts
toolbarList: ToolBarItem[] = [
  { toolName: ToolBarItemEnum.UploadImage },
  { toolName: ToolBarItemEnum.Text },
];
```

### 为什么这样改

本阶段只做图片和文字两个入口。

Select、Hand 后面做 Viewport 和选择功能时再加回来。

## 修改 2：新增工具栏配置

新增文件：

```text
src/components/toolbar/toolbarConfig.ts
```

写入：

```ts
import { ToolBarItemEnum } from '../../store/workspaceStore';

export interface ToolbarConfigItem {
  toolName: ToolBarItemEnum;
  label: string;
  shortcut: string;
}

export const TOOLBAR_CONFIG: Record<ToolBarItemEnum, ToolbarConfigItem> = {
  [ToolBarItemEnum.UploadImage]: {
    toolName: ToolBarItemEnum.UploadImage,
    label: '图片',
    shortcut: 'I',
  },
  [ToolBarItemEnum.Text]: {
    toolName: ToolBarItemEnum.Text,
    label: '文字',
    shortcut: 'T',
  },
};
```

### 为什么这样写

原项目有 `tool-bar-config.ts`。

它把“工具是什么”和“工具怎么显示”分开。

我们现在没有图标库，所以先用：

```ts
label: '图片'
label: '文字'
```

后面再替换成图标。

## 修改 3：新增 Toolbar 组件

新增文件：

```text
src/components/toolbar/Toolbar.tsx
```

写入：

```tsx
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { ToolBarItemEnum } from '../../store/workspaceStore';
import { TOOLBAR_CONFIG } from './toolbarConfig';

function getToolLabel(toolName: ToolBarItemEnum) {
  return TOOLBAR_CONFIG[toolName]?.label ?? toolName;
}

export const Toolbar = observer(() => {
  const store = useStore();

  const handleToolClick = (toolName: ToolBarItemEnum) => {
    if (toolName === ToolBarItemEnum.Text) {
      store.setEditMode('text');
      return;
    }

    if (toolName === ToolBarItemEnum.UploadImage) {
      console.info('[Toolbar] upload image is not implemented yet.');
    }
  };

  return (
    <div className="toolbar-container" aria-label="Canvas toolbar">
      <div className="toolbar-panel">
        {store.toolbarList.map(({ toolName }) => {
          const isActive = toolName === ToolBarItemEnum.Text && store.editMode === 'text';

          return (
            <button
              key={toolName}
              type="button"
              className={isActive ? 'toolbar-button toolbar-button-active' : 'toolbar-button'}
              title={`${getToolLabel(toolName)} ${TOOLBAR_CONFIG[toolName]?.shortcut ?? ''}`.trim()}
              aria-pressed={isActive}
              onClick={() => handleToolClick(toolName)}
            >
              {getToolLabel(toolName)}
            </button>
          );
        })}
      </div>
    </div>
  );
});
```

### 为什么这样写

`Toolbar` 只做三件事：

1. 从 store 读取 `toolbarList`。
2. 把每个工具渲染成按钮。
3. 点击文字按钮时调用 `store.setEditMode('text')`。

图片按钮现在只打印日志，因为上传图片需要后续的小节继续补：

```text
ImageElementData
addElement
createImageNode
CanvasElements 渲染图片
input file
```

## 修改 4：新增工具栏统一出口

新增文件：

```text
src/components/toolbar/index.ts
```

写入：

```ts
export { Toolbar } from './Toolbar';
export { TOOLBAR_CONFIG } from './toolbarConfig';
```

### 为什么这样写

以后外部只需要：

```ts
import { Toolbar } from '../components/toolbar';
```

不需要知道具体文件名。

## 修改 5：把 Toolbar 挂到工作区

文件：

```text
src/canvas/CanvasWorkspace.tsx
```

在顶部新增 import：

```ts
import { Toolbar } from '../components/toolbar';
```

找到：

```tsx
<section className="workspace-body" aria-label="Canvas workspace">
  <InfiniteCanvas width={stageSize.width} height={stageSize.height} />
</section>
```

改成：

```tsx
<section className="workspace-body" aria-label="Canvas workspace">
  <Toolbar />
  <InfiniteCanvas width={stageSize.width} height={stageSize.height} />
</section>
```

### 为什么这样写

参考原项目，工具栏和 `InfiniteCanvas` 是同一层级。

工具栏是 DOM 浮层，不属于 Konva canvas。

所以它不应该被加到 `Layer` 里，而是放在 React DOM 中，并通过 CSS 定位到画布左侧。

## 修改 6：新增工具栏样式

文件：

```text
src/styles/index.scss
```

在文件底部追加：

```scss
.toolbar-container {
  position: absolute;
  top: 50%;
  left: 16px;
  z-index: 10001;
  transform: translateY(-50%);
}

.toolbar-panel {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #f4f5f7;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 10px rgb(0 8 24 / 8%);
  padding: 6px;
}

.toolbar-button {
  display: flex;
  width: 44px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #111827;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  padding: 0;
}

.toolbar-button:hover,
.toolbar-button-active {
  background: #edeff1;
}
```

### 为什么这样写

参考原项目的工具栏样式：

```scss
position: absolute;
left: 16px;
top: 50%;
transform: translateY(-50%);
z-index: 10001;
```

工具栏是覆盖在画布上的 DOM 浮层，所以需要高 `z-index`。

## 本节完成后应该看到

浏览器左侧中间出现一个白色浮动工具栏。

里面有两个按钮：

```text
图片
文字
```

点击 `文字` 后按钮会出现选中背景。

点击 `图片` 暂时不会上传，只会在控制台打印：

```text
[Toolbar] upload image is not implemented yet.
```

## 本节完成后应该能解释

1. 工具栏为什么是 React DOM，不是 Konva 节点。
2. 为什么工具栏和 `InfiniteCanvas` 是兄弟节点。
3. `toolbarList` 和 `TOOLBAR_CONFIG` 分别负责什么。
4. 为什么文字按钮只调用 `store.setEditMode('text')`。
5. 为什么图片上传不能塞进这一小节。
