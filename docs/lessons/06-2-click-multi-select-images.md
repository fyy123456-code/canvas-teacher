# Lesson 06.2：按住辅助键点击多选图片

这一节只做点击多选。

现在画布里可以一次上传多张图片了。下一步要让 `selectedIds` 真正支持多个图片 id。

这一节暂时不做框选、不做多个选中框、不做多元素一起拖动，也不做多元素 Transformer。我们先把多选状态的基础能力做出来。

## 参考 ai-design-canvas 的地方

`ai-design-canvas` 的 store 里有类似这样的选择逻辑：

```ts
selectElement(id: string, multi = false) {
  if (multi) {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter((pid) => pid !== id);
    } else {
      this.selectedIds.push(id);
    }
  } else {
    this.selectedIds = [id];
  }
}
```

核心规则是：

```txt
普通点击：只选中当前元素
多选点击：已选中就取消，未选中就追加
```

我们这一节只实现这个核心规则，不引入参考项目里的组编辑、素材面板等复杂逻辑。

## 第 1 步：修改 store 的 selectElement

修改文件：

```ts
src/store/workspaceStore.ts
```

找到原来的：

```ts
selectElement(id: string) {
  this.setSelectedIds([id]);
}
```

改成：

```ts
selectElement(id: string, multi = false) {
  if (!multi) {
    this.setSelectedIds([id]);
    return;
  }

  if (this.selectedIds.includes(id)) {
    this.setSelectedIds(this.selectedIds.filter((selectedId) => selectedId !== id));
    return;
  }

  this.setSelectedIds([...this.selectedIds, id]);
}
```

### 为什么这样改

`multi = false` 表示普通点击。

普通点击不关心之前选中了谁，直接变成：

```ts
selectedIds = [当前图片 id]
```

`multi = true` 表示多选点击。

如果当前图片已经在 `selectedIds` 里面，就把它移除：

```ts
this.selectedIds.filter((selectedId) => selectedId !== id)
```

如果当前图片还没选中，就追加进去：

```ts
[...this.selectedIds, id]
```

这样 `selectedIds` 就可以保存多个图片 id。

## 第 2 步：让图片节点把点击事件传出去

修改文件：

```ts
src/elements/createImageElement.ts
```

找到 `CreateImageNodeOptions` 里的：

```ts
onSelect?: () => void;
```

改成：

```ts
onSelect?: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
```

然后找到图片点击事件：

```ts
imageNode.on('click tap', (event) => {
  event.cancelBubble = true;
  onSelect?.();
});
```

改成：

```ts
imageNode.on('click tap', (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  event.cancelBubble = true;
  onSelect?.(event);
});
```

### 为什么要把 event 传出去

是否多选，不是图片节点自己决定的。

图片节点只负责告诉外面：

```txt
我被点击了，这是这次点击事件
```

外层的 `CanvasElements` 才根据点击事件判断用户有没有按住：

```txt
Shift
Cmd
Ctrl
```

这也是一种更清晰的分工。

## 第 3 步：CanvasElements 根据辅助键决定是否多选

修改文件：

```ts
src/canvas/CanvasElements.tsx
```

找到创建图片节点时的：

```ts
onSelect: () => {
  if (store.editMode !== "select") {
    return;
  }

  store.selectElement(element.id);
},
```

改成：

```ts
onSelect: (event) => {
  if (store.editMode !== "select") {
    return;
  }

  const isMultiSelect =
    event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey;
  store.selectElement(element.id, isMultiSelect);
},
```

### 为什么判断 shiftKey / metaKey / ctrlKey

这些值来自浏览器原生点击事件：

```ts
event.evt.shiftKey
event.evt.metaKey
event.evt.ctrlKey
```

含义是：

```txt
shiftKey：点击时是否按住 Shift
metaKey：点击时是否按住 Cmd，Mac 上常用
ctrlKey：点击时是否按住 Ctrl，Windows 上常用
```

只要其中一个是 `true`，这次点击就当成多选点击。

## 完成后的行为

普通点击图片：

```txt
selectedIds = [当前图片 id]
```

按住 `Shift` 点击第二张图片：

```txt
selectedIds = [第一张图片 id, 第二张图片 id]
```

再按住 `Shift` 点击已经选中的图片：

```txt
selectedIds` 会移除这张图片 id
```

## 现在为什么视觉上还不明显

当前 Transformer 仍然只绑定第一个选中的图片：

```ts
const selectedId = store.selectedIds[0] ?? null;
```

所以这一节完成后，多选状态已经存在，但是画布上不一定能明显看出所有图片都被选中了。

下一节我们会做：

```txt
多个 selectedIds 都显示选中边框
```

到那一步，多选效果就会非常直观。

## 你需要检查什么

可以临时在浏览器 React DevTools 或代码里观察 `store.selectedIds`。

手动测试流程：

1. 上传至少两张图片。
2. 普通点击第一张图片。
3. 按住 `Shift` 点击第二张图片。
4. `selectedIds` 里应该有两个 id。
5. 再按住 `Shift` 点击第二张图片。
6. `selectedIds` 里应该只剩第一张图片 id。
