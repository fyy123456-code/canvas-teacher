import Konva from 'konva';

const DEFAULT_ZOOM_FACTOR = 1.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

export interface ViewportConfig {
  x?: number;
  y?: number;
  scale?: number;
}

export class Viewport {
  x: number;
  y: number;
  scale: number;

  constructor(config: ViewportConfig = {}) {
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.scale = config.scale ?? 1;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setScale(scale: number) {
    this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  }

  zoomIn() {
    this.setScale(this.scale * DEFAULT_ZOOM_FACTOR);
  }

  zoomOut() {
    this.setScale(this.scale / DEFAULT_ZOOM_FACTOR);
  }

  applyToLayer(layer: Konva.Layer) {
    layer.position({
      x: this.x,
      y: this.y,
    });
    layer.scale({
      x: this.scale,
      y: this.scale,
    });
    layer.batchDraw();
  }
}
