# Lesson 04.3：按 Delete / Backspace 删除选中图片

## 本节目标

上一节我们已经有了选中系统：

```text
selectedIds
selectElement
clearSelection
```

这一节做选中后的第一个编辑能力：

```text
选中图片
按 Delete 或 Backspace
删除图片
清空选中
```

## 本节不会做什么

- 不做复制粘贴
- 不做撤销重做
- 不做删除确认弹窗
- 不做多选删除的 UI
- 不做历史记录

本节只做最小闭环：

```text
删除当前 selectedIds 里的元素
```

## 为什么键盘事件放在 CanvasWorkspace

删除不是图片节点自己的能力。

它是整个画布工作区的快捷键能力。

所以我们放在：

```text
src/canvas/CanvasWorkspace.tsx
```

`ai-design-canvas` 也是在 workspace 层监听 `keydown`，再调用 store 的删除方法。

## 本节改动文件

按顺序改 2 个文件：

```text
src/store/workspaceStore.ts
src/canvas/CanvasWorkspace.tsx
```

## 第 1 步：修改 `src/store/workspaceStore.ts`

### 修改位置：新增 deleteSelectedElements

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/store/workspaceStore.ts
```

找到：

```ts
clearSelection() {
  this.setSelectedIds([]);
}
```

在它下面新增：

```ts
deleteSelectedElements() {
  if (this.selectedIds.length === 0) {
    return;
  }

  const selectedIdSet = new Set(this.selectedIds);
  this.elements = this.elements.filter((element) => !selectedIdSet.has(element.id));
  this.clearSelection();
}
```

## 为什么这样改

删除元素本质上是删除数据：

```ts
this.elements
```

我们用：

```ts
this.elements.filter(...)
```

保留没有被选中的元素，过滤掉被选中的元素。

注意：`InfiniteCanvas` 需要是 `observer`，这样 `this.elements` 替换成新数组后，`InfiniteCanvas` 会重新渲染并把新的 `elements` 传给 `CanvasElements`。

这里先把 `selectedIds` 转成：

```ts
new Set(this.selectedIds)
```

是为了判断更清楚：

```ts
selectedIdSet.has(element.id)
```

删除后调用：

```ts
this.clearSelection();
```

原因是被选中的元素已经不存在了，选中状态也应该清空。

## 第 2 步：修改 `src/canvas/CanvasWorkspace.tsx`

### 修改位置 1：新增 isEditableTarget

打开：

```text
/Users/fyy/Desktop/projects/canvas-student/src/canvas/CanvasWorkspace.tsx
```

找到：

```ts
function getWindowSize(): CanvasSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
```

在它下面新增：

```ts
function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}
```

## 为什么这样改

以后项目里会有输入框，比如：

```text
上传 input
文字编辑器
属性面板输入框
```

如果用户正在输入框里按 Backspace，应该是删除文字，不应该删除画布元素。

所以键盘快捷键要先判断事件来源是不是可编辑区域。

## 第 3 步：在 CanvasWorkspace 里监听键盘

找到已有的 resize effect：

```ts
useEffect(() => {
  const handleResize = () => {
    const nextSize = getWindowSize();
    store.setSize(nextSize.width, nextSize.height);
    setStageSize(nextSize);
  };

  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, [store]);
```

在它下面新增：

```ts
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    if (event.key !== 'Delete' && event.key !== 'Backspace') {
      return;
    }

    event.preventDefault();
    store.deleteSelectedElements();
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [store]);
```

## 为什么这样改

这段代码做三件事：

第一，输入框里不处理：

```ts
if (isEditableTarget(event.target)) {
  return;
}
```

第二，只处理删除键：

```ts
if (event.key !== 'Delete' && event.key !== 'Backspace') {
  return;
}
```

第三，真正删除选中元素：

```ts
store.deleteSelectedElements();
```

`CanvasElements` 已经会根据 `store.elements` 渲染节点。

所以元素数据被删除后，`CanvasElements` 会自动销毁对应的 Konva 节点。

## 本节完成后你应该看到

1. 上传一张图片。
2. 点击图片，出现蓝色虚线描边。
3. 按 Delete 或 Backspace。
4. 图片从画布消失。
5. 选中描边也消失。

## 检查命令

在 student 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
```

然后让我检查 teacher 和 student 是否一致。
