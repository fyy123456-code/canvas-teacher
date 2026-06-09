# Lesson 02.1：只新增左侧 Toolbar UI

## 本节目标

本节只做一件事：在画布左侧显示一个静态工具栏 UI。

这一步只做 UI，不做逻辑：

- 不写点击事件
- 不打开文件选择器
- 不新增 `ToolBarItemEnum`
- 不新增 `store.toolbarList`
- 不修改 `workspaceStore.ts`
- 不添加图片或文字元素

原因是：工具栏可以拆成两层学习。第一层是“UI 怎么挂到画布工作区”；第二层才是“点击按钮后怎么触发功能”。如果现在把 UI 和逻辑一起写，你很难分清每一段代码的职责。

## 本节参考 ai-design-canvas 的哪里

先看原项目：

```text
ai-design-canvas/src/workSpace/index.tsx
ai-design-canvas/src/components/side-tool-bar/index.tsx
ai-design-canvas/src/components/side-tool-bar/index.module.scss
```

原项目的 toolbar 是：

```text
Workspace
  Toolbar
  InfiniteCanvas
```

它的样式核心是：

```text
position: absolute
left: 16px
top: 50%
transform: translateY(-50%)
z-index: 10001
```

所以我们这一节也采用同样的放置方式：让 toolbar 悬浮在画布左侧中间。

## 本节改动文件

只改 teacher 项目里的 4 个文件：

```text
src/components/toolbar/Toolbar.tsx
src/components/toolbar/index.ts
src/canvas/CanvasWorkspace.tsx
src/styles/index.scss
```

你在 `canvas-student` 里也按这个顺序手写。

## 第 1 步：创建 `src/components/toolbar/Toolbar.tsx`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/components/toolbar/Toolbar.tsx
```

### 写入代码

```tsx
const TOOLBAR_ITEMS = [
  {
    id: 'upload-image',
    label: '图片',
    title: '上传图片',
  },
  {
    id: 'text',
    label: '文字',
    title: '添加文字',
  },
] as const;

export function Toolbar() {
  return (
    <div className="toolbar-container" aria-label="Canvas toolbar">
      <div className="toolbar-panel">
        {TOOLBAR_ITEMS.map((item) => (
          <button key={item.id} type="button" className="toolbar-button" title={item.title}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 为什么这样写

`TOOLBAR_ITEMS` 先放在组件内部，因为现在只有 UI，没有业务状态。

这里没有写 `onClick`，是故意的。本节只负责让按钮显示出来，不负责按钮能做什么。

`as const` 的作用是让 TypeScript 把 `id`、`label`、`title` 推断成更精确的只读字面量。当前不是必须，但它能让这份配置更稳定，后续加类型时更自然。

## 第 2 步：创建 `src/components/toolbar/index.ts`

### 修改位置

新建文件：

```text
/Users/fyy/Desktop/projects/canvas-student/src/components/toolbar/index.ts
```

### 写入代码

```ts
export { Toolbar } from './Toolbar';
```

### 为什么这样写

这是组件目录的统一出口。

之后外部使用 toolbar 时写：

```ts
import { Toolbar } from '../components/toolbar';
```

不用写：

```ts
import { Toolbar } from '../components/toolbar/Toolbar';
```

这样以后 `toolbar` 目录里新增配置文件、类型文件时，外部导入路径不用频繁变化。

## 第 3 步：修改 `src/canvas/CanvasWorkspace.tsx`

### 修改位置 1：文件顶部新增导入

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasWorkspace.tsx
```

在第一行 `react` 导入下面，新增：

```ts
import { Toolbar } from '../components/toolbar';
```

修改后文件顶部应该是：

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Toolbar } from '../components/toolbar';
import { StoreProvider } from '../store';
```

### 修改位置 2：在画布前挂载 Toolbar

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

`CanvasWorkspace` 是工作区外壳，对应 `ai-design-canvas/src/workSpace/index.tsx`。

Toolbar 和 InfiniteCanvas 是同级关系：

```text
workspace-body
  Toolbar
  InfiniteCanvas
```

这样 toolbar 可以通过绝对定位悬浮在画布上方，而不是成为 Konva Stage 内部的节点。

## 第 4 步：修改 `src/styles/index.scss`

### 修改位置

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/styles/index.scss
```

在文件最后，也就是 `.canvas-container` 之后，追加下面样式。

### 追加代码

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
  cursor: default;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  padding: 0;
}
```

### 为什么这样写

`.toolbar-container` 负责位置：

- `position: absolute`：让工具栏脱离普通布局，悬浮在画布上。
- `left: 16px`：对齐 `ai-design-canvas` 的左侧距离。
- `top: 50%` + `transform: translateY(-50%)`：让工具栏垂直居中。
- `z-index: 10001`：确保它在画布上方。

`.toolbar-panel` 负责白色面板样式。

`.toolbar-button` 负责按钮尺寸。这里先写 `cursor: default`，因为本节按钮还不能点击执行功能。下一节加点击逻辑时再改成 `cursor: pointer`。

## 本节完成后你应该看到

页面左侧中间出现一个白色竖向工具栏，里面有两个按钮：

```text
图片
文字
```

点击按钮暂时没有任何效果，这是正确的。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。

## 本节你需要理解

1. Toolbar 为什么是 React DOM，不是 Konva 节点。
2. Toolbar 为什么挂在 `CanvasWorkspace`，不是挂在 `InfiniteCanvas`。
3. 为什么本节不修改 `workspaceStore.ts`。
4. 为什么按钮现在没有 `onClick`。
5. 为什么样式里要用 `absolute` 和 `z-index`。
