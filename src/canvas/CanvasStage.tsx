import { Layer, Rect, Stage } from 'react-konva';
import {
  CANVAS_BACKGROUND_COLOR,
  CANVAS_LAYER_IDS,
  DEFAULT_STAGE_SIZE,
} from './canvasConfig';
import type { CanvasSize } from './types';

export interface CanvasStageProps {
  size?: CanvasSize;
}

export function CanvasStage({ size = DEFAULT_STAGE_SIZE }: CanvasStageProps) {
  return (
    <div className="canvas-stage-shell">
      <Stage width={size.width} height={size.height} className="canvas-stage">
        <Layer id={CANVAS_LAYER_IDS.backgroundLayer} listening={false}>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill={CANVAS_BACKGROUND_COLOR}
          />
        </Layer>
        <Layer id={CANVAS_LAYER_IDS.sceneLayer} />
        <Layer id={CANVAS_LAYER_IDS.interactionLayer} />
      </Stage>
    </div>
  );
}

