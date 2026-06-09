import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store/StoreContext';
import { CANVAS_BACKGROUND_COLOR } from './canvasConfig';
import { CanvasElements } from './CanvasElements';
import { createGridGroup } from './createGrid';
import type { CanvasSize } from './types';

export interface InfiniteCanvasProps {
  width?: number;
  height?: number;
}

export function InfiniteCanvas({
  width = window.innerWidth,
  height = window.innerHeight,
}: InfiniteCanvasProps) {
  const store = useStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const interactionLayerRef = useRef<Konva.Layer | null>(null);
  const [layer, setLayer] = useState<Konva.Layer | null>(null);

  const stageSize = useMemo<CanvasSize>(() => ({ width, height }), [width, height]);
  const stageSizeRef = useRef<CanvasSize>(stageSize);

  useEffect(() => {
    stageSizeRef.current = stageSize;
  }, [stageSize]);

  useEffect(() => {
    if (!containerRef.current || stageRef.current) {
      return;
    }

    const stage = new Konva.Stage({
      container: containerRef.current,
      width: stageSize.width,
      height: stageSize.height,
    });

    const layer = new Konva.Layer();
    store.viewport.applyToLayer(layer);

    const interactionLayer = new Konva.Layer();
    const background = new Konva.Rect({
      name: 'canvas-background',
      x: 0,
      y: 0,
      width: stageSize.width,
      height: stageSize.height,
      fill: CANVAS_BACKGROUND_COLOR,
      listening: false,
    });
    const grid = createGridGroup({
      width: stageSize.width,
      height: stageSize.height,
      viewport: store.viewport,
    });

    layer.add(background);
    layer.add(grid);
    stage.add(layer);
    stage.add(interactionLayer);

    stageRef.current = stage;
    layerRef.current = layer;
    interactionLayerRef.current = interactionLayer;
    store.setStage(stage);
    store.setLayer(layer);
    store.setRefreshGrid(() => {
      const currentLayer = layerRef.current;
      if (!currentLayer) {
        return;
      }

      const currentGrid = currentLayer.findOne('.canvas-grid');
      currentGrid?.destroy();
      const currentStageSize = stageSizeRef.current;
      const nextGrid = createGridGroup({
        width: currentStageSize.width,
        height: currentStageSize.height,
        viewport: store.viewport,
      });
      currentLayer.add(nextGrid);
      nextGrid.zIndex(1);
      currentLayer.batchDraw();
    });
    setLayer(layer);

    layer.draw();
    interactionLayer.draw();

    return () => {
      stage.destroy();
      stageRef.current = null;
      layerRef.current = null;
      interactionLayerRef.current = null;
      store.setStage(null);
      store.setLayer(null);
      store.setRefreshGrid(null);
      setLayer(null);
    };
  }, [store]);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) {
      return;
    }

    stage.width(stageSize.width);
    stage.height(stageSize.height);

    const background = layer.findOne('.canvas-background');
    background?.setAttrs({
      width: stageSize.width,
      height: stageSize.height,
    });

    const grid = layer.findOne('.canvas-grid');
    grid?.destroy();
    const nextGrid = createGridGroup({
      width: stageSize.width,
      height: stageSize.height,
      viewport: store.viewport,
    });
    layer.add(nextGrid);
    nextGrid.zIndex(1);

    layer.batchDraw();
  }, [stageSize.height, stageSize.width, store.viewport]);

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      overflow: 'hidden',
      backgroundColor: CANVAS_BACKGROUND_COLOR,
    }),
    [],
  );

  return (
    <div ref={wrapperRef} className="canvas-wrapper" data-infinite-canvas-wrapper="true">
      <div ref={containerRef} className="canvas-container" data-infinite-canvas-children="true" style={containerStyle}>
        <CanvasElements layer={layer} elements={store.elements} />
      </div>
    </div>
  );
}
