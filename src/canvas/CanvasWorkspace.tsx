import { CanvasStage } from './CanvasStage';
import { DEFAULT_STAGE_SIZE } from './canvasConfig';

export function CanvasWorkspace() {
  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="lesson-label">Lesson 01</p>
          <h1>空白 Konva Stage</h1>
        </div>
        <div className="stage-meta">
          {DEFAULT_STAGE_SIZE.width} x {DEFAULT_STAGE_SIZE.height}
        </div>
      </header>

      <section className="workspace-body" aria-label="Canvas workspace">
        <CanvasStage size={DEFAULT_STAGE_SIZE} />
      </section>
    </main>
  );
}

