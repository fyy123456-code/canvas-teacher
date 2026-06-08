export function App() {
  return (
    <main className="app-shell">
      <section className="intro-panel">
        <p className="lesson-label">Lesson 00</p>
        <h1>Canvas Teacher</h1>
        <p className="intro-text">
          这是一个从零手写画布编辑器的学习项目。当前小节只完成 React、TypeScript、Vite、Konva、
          MobX 和 SCSS 的基础工程环境。
        </p>
        <div className="next-step">
          下一节会渲染第一个空白 Konva Stage，开始真正进入画布坐标系。
        </div>
      </section>
    </main>
  );
}

