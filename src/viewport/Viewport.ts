import Konva from 'konva';

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
    this.scale = scale;
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
