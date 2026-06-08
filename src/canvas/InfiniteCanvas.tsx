import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store/StoreContext';
import { CANVAS_BACKGROUND_COLOR, DEFAULT_STAGE_SIZE } from './canvasConfig';
import { CanvasElements } from './CanvasElements';
import type { CanvasSize } from './types';

export interface InfiniteCanvasProps {
  width?: number;
  height?: number;
}

export function InfiniteCanvas({
  width = DEFAULT_STAGE_SIZE.width,
  height = DEFAULT_STAGE_SIZE.height,
}: InfiniteCanvasProps) {
  const store = useStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const interactionLayerRef = useRef<Konva.Layer | null>(null);
  const [layer, setLayer] = useState<Konva.Layer | null>(null);

  const stageSize = useMemo<CanvasSize>(() => ({ width, height }), [width, height]);

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

    layer.add(background);
    stage.add(layer);
    stage.add(interactionLayer);

    stageRef.current = stage;
    layerRef.current = layer;
    interactionLayerRef.current = interactionLayer;
    store.setStage(stage);
    store.setLayer(layer);
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

    layer.batchDraw();
  }, [stageSize.height, stageSize.width]);

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      width: stageSize.width,
      height: stageSize.height,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: CANVAS_BACKGROUND_COLOR,
    }),
    [stageSize.height, stageSize.width],
  );

  return (
    <div ref={wrapperRef} className="canvas-wrapper" data-infinite-canvas-wrapper="true">
      <div ref={containerRef} className="canvas-container" data-infinite-canvas-children="true" style={containerStyle}>
        <CanvasElements layer={layer} elements={store.elements} />
      </div>
    </div>
  );
}
