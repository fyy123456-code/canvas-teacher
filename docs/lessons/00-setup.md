# Lesson 00：创建画布编辑器学习项目

## 本节目标

本节只做一件事：从零创建一个最小可运行的 React + TypeScript + Vite 项目，并提前安装后续画布编辑器会用到的核心依赖。

这一节不写任何 Konva 画布代码。先把工程环境弄清楚，后面每一节再逐步加入画布能力。

## 本节知识点

1. Vite 项目的入口结构。
2. React 应用如何挂载到 HTML 节点。
3. TypeScript 配置文件的职责。
4. 为什么提前安装 Konva、MobX、SCSS。
5. 如何用 `typecheck` 和 `build` 判断项目是否健康。

## 改动文件

- `.gitignore`：忽略 `node_modules/`、`dist/`、`.DS_Store` 等不需要提交的文件。
- `package.json`：声明项目脚本和依赖。
- `pnpm-lock.yaml`：锁定依赖版本，保证不同机器安装结果一致。
- `index.html`：Vite 的 HTML 入口。
- `vite.config.ts`：Vite 配置，启用 React 插件。
- `tsconfig.json`：浏览器端 TypeScript 配置。
- `tsconfig.node.json`：Vite 配置文件的 TypeScript 配置。
- `src/main.tsx`：React 应用挂载入口。
- `src/App.tsx`：当前阶段的应用壳。
- `src/styles/index.scss`：全局样式入口。

## 关键代码解释

### `index.html`

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

`root` 是 React 要挂载的 DOM 节点。`/src/main.tsx` 是 Vite 的模块入口，浏览器会从这里开始加载应用代码。

### `src/main.tsx`

```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

这段代码做两件事：

1. 找到 HTML 里的 `#root` 节点。
2. 把 `App` 组件渲染到这个节点里。

后续我们写的画布组件，最终都会从 `App` 这条链路渲染出来。

### `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "pnpm typecheck && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.node.json"
  }
}
```

- `pnpm dev`：启动本地开发服务。
- `pnpm typecheck`：只检查 TypeScript 类型，不生成页面，也不生成配置文件编译产物。
- `pnpm build`：先做类型检查，再构建生产产物。
- `pnpm preview`：预览构建后的 `dist/`。

## 依赖角色

- `react`、`react-dom`：负责 UI 组件渲染。
- `vite`：负责开发服务器和打包。
- `typescript`：提供类型系统。
- `konva`：画布渲染引擎。
- `react-konva`：让 Konva 可以用 React 组件方式写。
- `mobx`、`mobx-react-lite`：后续用于管理画布元素、选中状态、缩放状态等。
- `sass`：让项目可以写 SCSS 样式。

## 学生手写任务

在你的项目 `/Users/fyy/Desktop/projects/canvas-student` 中手写同样的结构。

建议你不要复制粘贴，按下面顺序手写：

1. 创建 `package.json`，先写 `scripts`，再写依赖。
2. 创建 `index.html`，写 `#root` 和 `/src/main.tsx`。
3. 创建 `vite.config.ts`，接入 React 插件。
4. 创建 `tsconfig.json` 和 `tsconfig.node.json`。
5. 创建 `src/main.tsx`。
6. 创建 `src/App.tsx`。
7. 创建 `src/styles/index.scss`。
8. 运行 `pnpm install`。
9. 运行 `pnpm typecheck`。
10. 运行 `pnpm build`。

## 常见错误

### 忘记安装 `@vitejs/plugin-react`

如果 `vite.config.ts` 里写了：

```ts
import react from '@vitejs/plugin-react';
```

但是没有安装这个依赖，启动或构建时会报找不到模块。

### `index.html` 入口路径写错

必须写：

```html
<script type="module" src="/src/main.tsx"></script>
```

如果路径写成相对路径或文件名写错，页面不会加载 React 应用。

### `#root` 节点不存在

`src/main.tsx` 会查找：

```ts
document.getElementById('root')
```

如果 `index.html` 里没有 `<div id="root"></div>`，React 没有地方挂载。

## 小练习

完成 `canvas-student` 后，尝试修改 `src/App.tsx`：

1. 把标题改成你的项目名。
2. 把下一节提示改成“准备渲染第一个 Konva Stage”。
3. 重新运行 `pnpm typecheck` 和 `pnpm build`。

如果两条命令都通过，说明你的基础项目已经可以进入 Lesson 01。
