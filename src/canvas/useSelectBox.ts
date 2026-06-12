import Konva from 'konva';
import { useEffect, useRef } from 'react';
import type { Viewport } from '../viewport';

export interface UseSelectBoxOptions {
  stage: Konva.Stage | null;
  interactionLayer: Konva.Layer | null;
  viewport: Viewport;
  enabled: boolean;
}

interface Point {
  x: number;
  y: number;
}

function createSelectRect() {
  return new Konva.Rect({
    name: 'select-box',
    fill: 'rgba(76, 144, 255, 0.12)',
    stroke: '#4C90FF',
    strokeWidth: 1,
    listening: false,
    visible: false,
  });
}

function getRectFromPoints(start: Point, end: Point) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return {
    x,
    y,
    width,
    height,
  };
}

export function useSelectBox({ stage, interactionLayer, viewport, enabled }: UseSelectBoxOptions) {
  const selectRectRef = useRef<Konva.Rect | null>(null);
  const startPointRef = useRef<Point | null>(null);
  const screenRectRef = useRef<ReturnType<typeof getRectFromPoints> | null>(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    if (!interactionLayer || selectRectRef.current) {
      return;
    }

    const selectRect = createSelectRect();
    interactionLayer.add(selectRect);
    selectRectRef.current = selectRect;
    interactionLayer.batchDraw();

    return () => {
      selectRect.destroy();
      selectRectRef.current = null;
      interactionLayer.batchDraw();
    };
  }, [interactionLayer]);

  useEffect(() => {
    if (!stage || !interactionLayer) {
      return;
    }

    const handleMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
      if (!enabled || event.target !== stage) {
        return;
      }

      const pointer = stage.getPointerPosition();
      const selectRect = selectRectRef.current;
      if (!pointer || !selectRect) {
        return;
      }

      startPointRef.current = pointer;
      isSelectingRef.current = true;
      selectRect.setAttrs({
        x: pointer.x,
        y: pointer.y,
        width: 0,
        height: 0,
        visible: true,
      });
      selectRect.moveToTop();
      interactionLayer.batchDraw();
    };

    const handleMouseMove = () => {
      if (!isSelectingRef.current) {
        return;
      }

      const startPoint = startPointRef.current;
      const pointer = stage.getPointerPosition();
      const selectRect = selectRectRef.current;
      if (!startPoint || !pointer || !selectRect) {
        return;
      }

      const screenRect = getRectFromPoints(startPoint, pointer);
      screenRectRef.current = screenRect;
      selectRect.setAttrs(screenRect);
      interactionLayer.batchDraw();
    };

    const handleMouseUp = () => {
      if (!isSelectingRef.current) {
        return;
      }

      const selectRect = selectRectRef.current;
      const screenRect = screenRectRef.current;
      isSelectingRef.current = false;
      startPointRef.current = null;
      screenRectRef.current = null;

      if (selectRect) {
        selectRect.visible(false);
        interactionLayer.batchDraw();
      }

      if (screenRect) {
        const worldRect = viewport.screenRectToWorldRect(screenRect);
        console.log('[select-box]', {
          screenRect,
          worldRect,
        });
      }
    };

    stage.on('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      stage.off('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, interactionLayer, stage, viewport]);
}
