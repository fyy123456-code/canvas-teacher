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

## 逐文件手写步骤

下面这部分是你在 `canvas-student` 中手写 Lesson 00 时的操作顺序。每一步只改一个文件，按顺序写。

### 第 1 步：创建 `.gitignore`

这个文件负责告诉 Git 哪些文件不需要提交。

写入：

```gitignore
node_modules/
dist/
.DS_Store
*.local
*.tsbuildinfo
```

为什么先写它：后面安装依赖和构建时会生成 `node_modules/`、`dist/`，先忽略可以避免误提交。

写完后检查：确认这 5 行都存在。

### 第 2 步：创建 `package.json`

这个文件负责声明项目名称、脚本和依赖。

写入：

```json
{
  "name": "canvas-student",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "pnpm typecheck && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.node.json"
  },
  "dependencies": {
    "konva": "^9.3.18",
    "mobx": "^6.13.7",
    "mobx-react-lite": "^4.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-konva": "^18.2.10"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "sass": "^1.83.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  }
}
```

为什么这样写：`scripts` 定义开发、类型检查、构建入口；依赖提前包含后续画布要用的 Konva、React-Konva、MobX。

写完后检查：确认 `typecheck` 脚本里有两个配置文件：`tsconfig.json` 和 `tsconfig.node.json`。

### 第 3 步：创建 `index.html`

这个文件是 Vite 应用的 HTML 入口。

写入：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Canvas Student</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

为什么这样写：`#root` 是 React 的挂载点，`/src/main.tsx` 是应用入口。

写完后检查：确认 `id="root"` 和 `/src/main.tsx` 都没有拼错。

### 第 4 步：创建 `vite.config.ts`

这个文件负责 Vite 配置。

写入：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

为什么这样写：React 项目需要 `@vitejs/plugin-react` 处理 JSX 和 React Refresh。

写完后检查：确认导入路径是 `@vitejs/plugin-react`。

### 第 5 步：创建 `tsconfig.json`

这个文件负责浏览器端 TypeScript 配置。

写入：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

为什么这样写：`strict` 能让错误尽早暴露；`jsx: react-jsx` 让 TypeScript 支持 React JSX。

写完后检查：确认 `include` 指向 `src`。

### 第 6 步：创建 `tsconfig.node.json`

这个文件负责检查 `vite.config.ts`。

写入：

```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

为什么这样写：应用代码和 Vite 配置运行环境不同，所以分开检查更清晰。

写完后检查：确认 `include` 是 `vite.config.ts`。

### 第 7 步：创建 `src/main.tsx`

这个文件负责把 React 应用挂载到 `#root`。

写入：

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

为什么这样写：`main.tsx` 是 React 应用的真正入口，全局样式也从这里引入。

写完后检查：确认 `./App` 和 `./styles/index.scss` 路径正确。

### 第 8 步：创建 `src/App.tsx`

这个文件暂时作为应用壳。

写入：

```tsx
export function App() {
  return (
    <main className="app-shell">
      <section className="intro-panel">
        <p className="lesson-label">Lesson 00</p>
        <h1>Canvas Student</h1>
        <p className="intro-text">
          这是你的手写练习项目。当前小节只完成 React、TypeScript、Vite、Konva、MobX 和 SCSS
          的基础工程环境。
        </p>
        <div className="next-step">
          下一节会渲染第一个空白 Konva Stage，开始真正进入画布坐标系。
        </div>
      </section>
    </main>
  );
}
```

为什么这样写：当前还没有画布功能，先确认 React 页面能正常显示。

写完后检查：确认组件名是 `App`，并且用了具名导出 `export function App()`。

### 第 9 步：创建 `src/styles/index.scss`

这个文件负责全局样式。

可以先写最小样式：

```scss
:root {
  color: #1f2937;
  background: #f4f7fb;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}

body {
  min-height: 100vh;
}

.app-shell {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
```

为什么这样写：Lesson 00 的样式只服务于项目壳，Lesson 01 会替换成画布工作区布局。

写完后检查：确认页面没有明显样式错乱。

### 第 10 步：安装并验证

运行：

```bash
pnpm install
pnpm typecheck
pnpm build
```

为什么最后运行：此时配置、入口、样式都已经存在，验证结果更有意义。

写完后检查：三条命令都成功后，Lesson 00 才算完成。

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
