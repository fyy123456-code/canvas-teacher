import Konva from 'konva';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store/StoreContext';
import { ElementStatus, ElementType } from '../store/workspaceStore';
import { CANVAS_BACKGROUND_COLOR } from './canvasConfig';
import { CanvasElements } from './CanvasElements';
import type { CanvasSize } from './types';

export interface InfiniteCanvasProps {
  width?: number;
  height?: number;
}

export const InfiniteCanvas = observer(function InfiniteCanvas({
  width = window.innerWidth,
  height = window.innerHeight,
}: InfiniteCanvasProps) {
  const store = useStore();
  const editMode = store.editMode;
  const elements = store.elements.slice();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const interactionLayerRef = useRef<Konva.Layer | null>(null);
  const [layer, setLayer] = useState<Konva.Layer | null>(null);

  const stageSize = useMemo<CanvasSize>(() => ({ width, height }), [width, height]);

  const addTextElementAtStagePoint = useCallback(
    (point: Konva.Vector2d) => {
      const layer = layerRef.current;
      if (!layer) {
        return;
      }

      const transform = layer.getAbsoluteTransform().copy();
      transform.invert();
      const position = transform.point(point);
      const id = store.generateId('text');

      store.addElement({
        id,
        type: ElementType.TEXT,
        status: ElementStatus.SUCCESS,
        file_name: '',
        text: '双击编辑文字',
        x: position.x,
        y: position.y,
        width: 260,
        fontSize: 32,
        fontFamily: 'Arial',
        fill: '#111827',
        opacity: 1,
      });

      store.setEditMode('select');
    },
    [store],
  );

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

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    stage.container().style.cursor = editMode === 'text' ? 'text' : 'default';
  }, [editMode]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || editMode !== 'text') {
      return;
    }

    const handleStageClick = () => {
      const pointer = stage.getPointerPosition();
      if (!pointer) {
        return;
      }

      addTextElementAtStagePoint(pointer);
    };

    stage.on('click', handleStageClick);
    return () => {
      stage.off('click', handleStageClick);
    };
  }, [addTextElementAtStagePoint, editMode]);

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
    <div
      ref={wrapperRef}
      className="canvas-wrapper"
      data-infinite-canvas-wrapper="true"
    >
      <div ref={containerRef} className="canvas-container" data-infinite-canvas-children="true" style={containerStyle} />
      <CanvasElements layer={layer} elements={elements} />
    </div>
  );
});
