import { useEffect, useMemo, useState } from 'react';
import { Toolbar } from '../components/toolbar';
import { ZoomTools } from '../components/zoom-tools';
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
      const nextSize = getWindowSize();
      store.setSize(nextSize.width, nextSize.height);
      setStageSize(nextSize);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [store]);

  return (
    <StoreProvider store={store}>
      <main className="workspace-container" tabIndex={2}>
        <section className="workspace-body" aria-label="Canvas workspace">
          <Toolbar />
          <InfiniteCanvas width={stageSize.width} height={stageSize.height} />
          <ZoomTools />
        </section>
      </main>
    </StoreProvider>
  );
}
