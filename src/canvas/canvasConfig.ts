import type { CanvasLayerId, CanvasSize } from './types';

export const DEFAULT_STAGE_SIZE: CanvasSize = {
  width: 960,
  height: 540,
};

export const CANVAS_BACKGROUND_COLOR = '#ffffff';

export const CANVAS_LAYER_IDS: Record<CanvasLayerId, CanvasLayerId> = {
  backgroundLayer: 'backgroundLayer',
  sceneLayer: 'sceneLayer',
  interactionLayer: 'interactionLayer',
};

