import Konva from 'konva';

const DEFAULT_ZOOM_FACTOR = 1.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

export interface ViewportConfig {
  x?: number;
  y?: number;
  scale?: number;
}

export interface ViewportPoint {
  x: number;
  y: number;
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

  moveBy(deltaX: number, deltaY: number) {
    this.setPosition(this.x + deltaX, this.y + deltaY);
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

  zoomAt(screenPoint: ViewportPoint, nextScale: number) {
    const worldPoint = {
      x: (screenPoint.x - this.x) / this.scale,
      y: (screenPoint.y - this.y) / this.scale,
    };

    this.setScale(nextScale);
    this.setPosition(screenPoint.x - worldPoint.x * this.scale, screenPoint.y - worldPoint.y * this.scale);
  }

  zoomInAt(screenPoint: ViewportPoint) {
    this.zoomAt(screenPoint, this.scale * DEFAULT_ZOOM_FACTOR);
  }

  zoomOutAt(screenPoint: ViewportPoint) {
    this.zoomAt(screenPoint, this.scale / DEFAULT_ZOOM_FACTOR);
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
