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

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      event.preventDefault();
      store.deleteSelectedElements();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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
