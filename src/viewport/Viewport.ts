import Konva from 'konva';

const DEFAULT_ZOOM_FACTOR = 1.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
const WHEEL_ZOOM_FACTOR = 0.02;
const MAX_WHEEL_DELTA = 5;

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
  private stage: Konva.Stage | null = null;
  private layer: Konva.Layer | null = null;
  private viewportDragMode = false;
  private isDragging = false;
  private lastPointer: ViewportPoint | null = null;
  private onTransformChange: (() => void) | null = null;

  constructor(config: ViewportConfig = {}) {
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.scale = config.scale ?? 1;
  }

  attach(stage: Konva.Stage, layer: Konva.Layer, onTransformChange?: () => void) {
    this.destroy();
    this.stage = stage;
    this.layer = layer;
    this.onTransformChange = onTransformChange ?? null;
    this.applyToLayer(layer);

    stage.container().addEventListener('wheel', this.handleWheel, {
      passive: false,
    });
    stage.on('mousedown', this.handleStageMouseDown);
    window.addEventListener('mousemove', this.handleWindowMouseMove);
    window.addEventListener('mouseup', this.handleWindowMouseUp);
  }

  destroy() {
    this.stage?.container().removeEventListener('wheel', this.handleWheel);
    this.stage?.off('mousedown', this.handleStageMouseDown);
    window.removeEventListener('mousemove', this.handleWindowMouseMove);
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
    this.stage = null;
    this.layer = null;
    this.onTransformChange = null;
    this.isDragging = false;
    this.lastPointer = null;
  }

  setViewportDragMode(status: boolean) {
    this.viewportDragMode = status;

    if (!status && this.isDragging) {
      this.endDrag();
      return;
    }

    this.setCursor(status ? 'grab' : 'default');
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.syncLayer();
  }

  moveBy(deltaX: number, deltaY: number) {
    this.setPosition(this.x + deltaX, this.y + deltaY);
  }

  setScale(scale: number) {
    this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    this.syncLayer();
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

    this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    this.x = screenPoint.x - worldPoint.x * this.scale;
    this.y = screenPoint.y - worldPoint.y * this.scale;
    this.syncLayer();
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

  private handleStageMouseDown = () => {
    if (!this.viewportDragMode) {
      return;
    }

    this.startDrag();
  };

  private handleWindowMouseMove = (event: MouseEvent) => {
    if (!this.isDragging || !this.stage) {
      return;
    }

    const rect = this.stage.container().getBoundingClientRect();
    this.doDrag({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  private handleWindowMouseUp = () => {
    this.endDrag();
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      this.handleWheelZoom(event);
      return;
    }

    this.moveBy(-event.deltaX * 0.8, -event.deltaY * 0.8);
  };

  private handleWheelZoom(event: WheelEvent) {
    if (!this.stage) {
      return;
    }

    const pointer = this.stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    const clampedDelta = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, event.deltaY));
    const nextScale = this.scale * Math.pow(2, -clampedDelta * WHEEL_ZOOM_FACTOR);

    this.zoomAt(pointer, nextScale);
  }

  private startDrag() {
    if (!this.stage) {
      return;
    }

    this.isDragging = true;
    this.lastPointer = this.stage.getPointerPosition();
    this.setCursor('grabbing');
  }

  private doDrag(pointer: ViewportPoint) {
    if (!this.lastPointer) {
      return;
    }

    const deltaX = pointer.x - this.lastPointer.x;
    const deltaY = pointer.y - this.lastPointer.y;

    this.moveBy(deltaX, deltaY);
    this.lastPointer = pointer;
  }

  private endDrag() {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.lastPointer = null;
    this.setCursor(this.viewportDragMode ? 'grab' : 'default');
  }

  private setCursor(cursor: string) {
    if (!this.stage) {
      return;
    }

    this.stage.container().style.cursor = cursor;
  }

  private syncLayer() {
    if (!this.layer) {
      return;
    }

    this.applyToLayer(this.layer);
    this.onTransformChange?.();
  }
}
