import { useEffect, useMemo, useState } from 'react';
import { Toolbar } from '../components/toolbar';
import { StoreProvider } from '../store';
import { createWorkSpaceStore } from '../store/workspaceStore';
import { InfiniteCanvas } from './InfiniteCanvas';
import type { CanvasSize } from './types';

function getWindowSize(): CanvasSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function CanvasWorkspace() {
  const [stageSize, setStageSize] = useState<CanvasSize>(() => getWindowSize());

  const store = useMemo(
    () =>
      createWorkSpaceStore({
        width: stageSize.width,
        height: stageSize.height,
      }),
    [],
  );

  useEffect(() => {
    const handleResize = () => {
      setStageSize(getWindowSize());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <StoreProvider store={store}>
      <main className="workspace-container" tabIndex={2}>
        <section className="workspace-body" aria-label="Canvas workspace">
          <Toolbar />
          <InfiniteCanvas width={stageSize.width} height={stageSize.height} />
        </section>
      </main>
    </StoreProvider>
  );
}
