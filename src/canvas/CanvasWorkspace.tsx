import { useMemo } from 'react';
import { StoreProvider } from '../store';
import { createWorkSpaceStore } from '../store/workspaceStore';
import { InfiniteCanvas } from './InfiniteCanvas';
import { DEFAULT_STAGE_SIZE } from './canvasConfig';

export function CanvasWorkspace() {
  const store = useMemo(
    () =>
      createWorkSpaceStore({
        width: DEFAULT_STAGE_SIZE.width,
        height: DEFAULT_STAGE_SIZE.height,
      }),
    [],
  );

  return (
    <StoreProvider store={store}>
      <main className="workspace-container">
        <header className="workspace-header">
          <div>
            <p className="lesson-label">Lesson 01</p>
            <h1>命令式 Konva Stage</h1>
          </div>
          <div className="stage-meta">
            {DEFAULT_STAGE_SIZE.width} x {DEFAULT_STAGE_SIZE.height}
          </div>
        </header>

        <section className="workspace-body" aria-label="Canvas workspace">
          <InfiniteCanvas width={DEFAULT_STAGE_SIZE.width} height={DEFAULT_STAGE_SIZE.height} />
        </section>
      </main>
    </StoreProvider>
  );
}
