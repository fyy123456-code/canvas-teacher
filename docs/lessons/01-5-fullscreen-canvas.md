# Lesson 01.5：把固定尺寸画布改成全屏工作区画布

## 本节目标

把 Lesson 01 的固定 `960 x 540` 画布，改成和 `ai-design-canvas` 一致的全屏工作区画布。

这里的“全屏”指：

- 工作区占满浏览器窗口。
- Konva 容器占满工作区。
- `Konva.Stage` 的宽高来自当前窗口尺寸。
- 浏览器窗口 resize 时，Stage 尺寸跟着更新。

## 本节学习方式

这一节不再靠一篇长文档直接抄最终代码，而是按 3 个微提交学习。

你要按顺序看这 3 个 commit：

```bash
git show 2272a5f
git show 0fedbee
git show dbb8830
```

每个 commit 只表达一个目的：

1. `2272a5f`：`CanvasWorkspace` 开始管理窗口尺寸。
2. `0fedbee`：`InfiniteCanvas` 的 DOM 容器铺满父容器。
3. `dbb8830`：CSS 建立全屏高度链路。

你在 `canvas-student` 里也按这个顺序手写，不要三个文件一起改。

## 对应 ai-design-canvas

先看原项目对应位置：

```text
ai-design-canvas/src/workSpace/index.tsx
ai-design-canvas/src/workSpace/InfiniteCanvas.tsx
ai-design-canvas/src/lib/vue/index.tsx
```

原项目的核心模式是：

```text
Workspace 外层：width 100%, height 100%, overflow hidden
InfiniteCanvas wrapper：width 100%, height 100%
Konva container：position absolute, width 100%, height 100%
Stage：width / height 来自 props
Vue 包装器默认：window.innerWidth / window.innerHeight
```

所以我们自己的项目也保持同一个方向：**DOM 容器铺满父级，Stage 像素尺寸由 props 控制。**

## 微步骤 1：CanvasWorkspace 管理窗口尺寸

### 看这个 commit

```bash
cd /Users/fyy/Desktop/projects/canvas-teacher
git show 2272a5f
```

### 只改这个文件

```text
src/canvas/CanvasWorkspace.tsx
```

### 这一步做了什么

原来是固定尺寸：

```tsx
<InfiniteCanvas width={DEFAULT_STAGE_SIZE.width} height={DEFAULT_STAGE_SIZE.height} />
```

现在改成窗口尺寸：

```tsx
<InfiniteCanvas width={stageSize.width} height={stageSize.height} />
```

### 为什么这样改

`CanvasWorkspace` 对应 `ai-design-canvas/src/workSpace/index.tsx`。

它负责工作区外壳，也负责把画布尺寸传给 `InfiniteCanvas`。真正创建 `Konva.Stage` 的代码仍然留在 `InfiniteCanvas`。

### 你要理解的点

1. `getWindowSize()` 只负责读取当前窗口宽高。
2. `useState` 保存当前 Stage 尺寸。
3. `useEffect` 监听 `resize`，窗口变了就更新 `stageSize`。
4. `resize` 时不重新创建 store，也不直接创建 Stage。
5. `InfiniteCanvas` 收到新的 props 后，自己负责更新 Stage 宽高。

### 你在 canvas-student 里手写后检查

检查这个文件里不应该再有：

```ts
DEFAULT_STAGE_SIZE
```

检查 `InfiniteCanvas` 应该收到：

```tsx
width={stageSize.width}
height={stageSize.height}
```

## 微步骤 2：InfiniteCanvas 容器铺满父级

### 看这个 commit

```bash
cd /Users/fyy/Desktop/projects/canvas-teacher
git show 0fedbee
```

### 只改这个文件

```text
src/canvas/InfiniteCanvas.tsx
```

### 这一步做了什么

这一步不改变 Stage 的创建方式。

仍然是：

```ts
const stage = new Konva.Stage({
  container: containerRef.current,
  width: stageSize.width,
  height: stageSize.height,
});
```

真正变化的是 DOM 容器样式。

原来容器是具体数字尺寸：

```ts
width: stageSize.width,
height: stageSize.height,
position: 'relative',
```

现在容器铺满父级：

```ts
width: '100%',
height: '100%',
position: 'absolute',
top: 0,
left: 0,
```

### 为什么这样改

Konva 有两个尺寸概念：

1. DOM 容器的布局尺寸。
2. Stage 内部绘图使用的像素尺寸。

全屏画布里，DOM 容器应该铺满父级；Stage 的像素尺寸继续用 props 控制。

这和 `ai-design-canvas/src/workSpace/InfiniteCanvas.tsx` 一致。

### 你要理解的点

1. `containerRef` 是 Konva 挂载的真实 DOM。
2. `containerStyle` 控制 DOM 怎么占位。
3. `stage.width()`、`stage.height()` 控制 Konva 内部绘制区域。
4. 这一步不能删除 `stageSize`，因为 Stage 更新仍然依赖它。

### 你在 canvas-student 里手写后检查

检查 `containerStyle` 里应该是：

```ts
width: '100%',
height: '100%',
position: 'absolute',
top: 0,
left: 0,
```

检查 `new Konva.Stage()` 里仍然是：

```ts
width: stageSize.width,
height: stageSize.height,
```

## 微步骤 3：CSS 建立全屏高度链路

### 看这个 commit

```bash
cd /Users/fyy/Desktop/projects/canvas-teacher
git show dbb8830
```

### 只改这个文件

```text
src/styles/index.scss
```

### 这一步做了什么

删除 Lesson 01 的固定画板视觉：

- 顶部标题栏
- 居中布局
- 画板边框
- 圆角
- 阴影
- padding

改成全屏工作区。

### 为什么这样改

`height: 100%` 必须有父级参考。

如果只给 `.canvas-wrapper` 写：

```scss
height: 100%;
```

但 `html`、`body`、`#root` 没有高度，那么这个 `100%` 不能稳定撑满窗口。

所以要建立完整高度链路：

```text
html/body/#root height: 100%
workspace-container height: 100%
workspace-body flex: 1
canvas-wrapper height: 100%
canvas-container inset: 0
```

### 你要理解的点

1. 全屏布局不是只给最后一个容器写 `height: 100%`。
2. `body { overflow: hidden; }` 是为了避免页面滚动条干扰画布。
3. `.workspace-container` 用 `display: flex`，后续左侧工具栏、素材面板也容易放进去。
4. `.canvas-container { inset: 0; }` 配合 `position: absolute` 让 Konva 容器贴满父级。

### 你在 canvas-student 里手写后检查

页面应该满足：

- 没有顶部标题栏。
- 没有居中的小画板。
- 白色画布铺满整个浏览器窗口。
- resize 浏览器窗口时画布也跟着变化。

## 每一步的学习流程

以后每个微步骤都按这个流程来：

1. 先在 `canvas-teacher` 看 commit：

```bash
git show <commit-id>
```

2. 只理解这个 commit 改了什么，不看后面的 commit。

3. 在 `canvas-student` 手写同样的改动。

4. 写完后运行：

```bash
cd /Users/fyy/Desktop/projects/canvas-student
pnpm typecheck
pnpm build
```

5. 让我检查：

```bash
diff teacher 当前步骤 student 当前步骤
```

6. 你用自己的话说清楚这一小步解决了什么问题。

## 本节完成标准

完成这一节后，你应该能解释：

1. 为什么全屏画布要拆成 `CanvasWorkspace`、`InfiniteCanvas`、CSS 三步。
2. 为什么窗口尺寸由 `CanvasWorkspace` 管理。
3. 为什么 Konva DOM 容器用 `100%`，Stage 仍然用数字宽高。
4. 为什么 CSS 需要完整高度链路。
5. 为什么 resize 时更新 Stage，而不是重新创建 Stage。

## 下一节预告

下一节会从最小的图片上传入口开始：先点击按钮拿到本地 `File`，只打印文件信息，不马上渲染到画布。

但下一节也会继续使用同样方法：

1. 先看 `ai-design-canvas` 对应源码。
2. 再做一个微提交。
3. 看 diff。
4. 解释为什么这样写。
5. 你在 `canvas-student` 手写。
6. 我检查一致性。
