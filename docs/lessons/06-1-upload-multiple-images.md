# Lesson 06.1：一次上传多张图片

这一节只做一个功能：点击左侧「图片」按钮后，可以一次选择多张图片，并把这些图片都添加到画布上。

这一步不做多选、不做框选、不做多个元素一起拖动。我们只是先让画布里可以出现多张图片，为后面的多选功能准备数据。

## 这节要改哪个文件

只改一个文件：

```ts
src/components/toolbar/Toolbar.tsx
```

原因是：上传图片的入口就在工具栏里，当前逻辑也是在这个文件里处理文件选择、读取图片尺寸、创建图片元素。

## 第 1 步：让 input 支持多选文件

找到隐藏的文件输入框：

```tsx
<input
  ref={imageInputRef}
  type="file"
  accept="image/*"
  className="toolbar-file-input"
  onChange={handleImageFileChange}
/>
```

加上 `multiple`：

```tsx
<input
  ref={imageInputRef}
  type="file"
  accept="image/*"
  multiple
  className="toolbar-file-input"
  onChange={handleImageFileChange}
/>
```

### 为什么这样改

浏览器的 `<input type="file" />` 默认只能选择一个文件。

加上 `multiple` 后，系统文件选择窗口才允许你一次选中多张图片。

但是注意：这一步只改变“可以选择多个文件”，还没有把多个文件都添加到画布上。

## 第 2 步：把单文件读取改成多文件读取

找到原来的逻辑：

```ts
const file = event.target.files?.[0];
if (!file) {
  return;
}
```

改成：

```ts
const files = Array.from(event.target.files ?? []);
if (files.length === 0) {
  return;
}
```

### 为什么这样改

`event.target.files` 是 `FileList`，它像数组，但不是真正的数组。

我们后面要循环处理每一张图片，所以先用：

```ts
Array.from(...)
```

把它转成真正的数组。

## 第 3 步：循环创建图片元素

原来只处理一张图片：

```ts
const src = URL.createObjectURL(file);
const { width, height } = await getImageSize(src);
const id = store.generateId();

store.addElement({
  id,
  type: ElementType.IMAGE,
  status: ElementStatus.LOADED,
  file_name: file.name,
  src,
  x: 80,
  y: 80,
  width,
  height,
});
```

现在改成循环：

```ts
for (const [index, file] of files.entries()) {
  const src = URL.createObjectURL(file);
  const { width, height } = await getImageSize(src);
  const id = store.generateId();

  store.addElement({
    id,
    type: ElementType.IMAGE,
    status: ElementStatus.LOADED,
    file_name: file.name,
    src,
    x: 80 + index * 24,
    y: 80 + index * 24,
    width,
    height,
  });
}
```

### 为什么这样改

每一张图片都要做同样的事情：

1. 用 `URL.createObjectURL(file)` 生成浏览器本地图片地址。
2. 用 `getImageSize(src)` 读取图片原始宽高。
3. 用 `store.generateId()` 生成元素 id。
4. 用 `store.addElement(...)` 添加到 MobX 状态。
5. `CanvasElements` 观察到 `store.elements` 变化后，把图片渲染到 Konva 画布。

这里的：

```ts
x: 80 + index * 24,
y: 80 + index * 24,
```

是为了让多张图片有一点错位。

如果所有图片都放在：

```ts
x: 80,
y: 80,
```

它们会完全叠在一起，你可能会误以为只上传了一张。

## 第 4 步：保留清空 input 的逻辑

循环结束后保留：

```ts
event.target.value = '';
```

### 为什么要保留

如果不清空，用户连续两次选择同一批图片时，浏览器可能不会触发 `onChange`。

清空之后，即使再次选择同样的图片，`handleImageFileChange` 也会正常执行。

## 完整流程

现在上传多张图片的流程是：

```txt
点击图片按钮
  -> 打开文件选择窗口
  -> 选择多张图片
  -> files 转成数组
  -> 循环读取每张图片尺寸
  -> 每张图片生成一个 image element
  -> store.elements 变化
  -> CanvasElements 渲染多个 Konva.Image
```

## 你需要检查什么

运行项目后检查：

1. 点击左侧「图片」。
2. 一次选择两张或多张图片。
3. 画布上应该出现多张图片。
4. 多张图片之间应该有一点位置错开。
5. 每张图片都还能单独点击选中、拖动、缩放、删除。

如果这些都正常，说明这一节完成。
