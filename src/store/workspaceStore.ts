import Konva from 'konva';
import { makeAutoObservable, observable } from 'mobx';
import { Viewport } from '../viewport';

export const ElementType = {
  IMAGE: 'image',
} as const;

export enum ElementStatus {
  LOADED = 'loaded',
}

export type ElementType = (typeof ElementType)[keyof typeof ElementType];

export interface BaseElementData {
  id: string;
  file_name: string;
  type: ElementType;
  status: ElementStatus;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  opacity?: number;
}

export interface ImageElementData extends BaseElementData {
  type: typeof ElementType.IMAGE;
  src: string;
}

export type CanvasElement = ImageElementData;

export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
  elements?: CanvasElement[];
  viewport?: Viewport;
}

export class WorkSpaceStore {
  width: number;
  height: number;
  elements: CanvasElement[];
  viewport: Viewport;
  stage: Konva.Stage | null = null;
  layer: Konva.Layer | null = null;
  refreshGrid: (() => void) | null = null;

  constructor(config: WorkSpaceStoreConfig = {}) {
    this.width = config.width ?? window.innerWidth;
    this.height = config.height ?? window.innerHeight;
    this.elements = config.elements ?? [];
    this.viewport =
      config.viewport ??
      new Viewport({
        x: 0,
        y: 0,
        scale: 1,
      });

    makeAutoObservable(this, {
      viewport: observable.ref,
      stage: observable.ref,
      layer: observable.ref,
      refreshGrid: observable.ref,
    });
  }

  setStage(stage: Konva.Stage | null) {
    this.stage = stage;
  }

  setLayer(layer: Konva.Layer | null) {
    this.layer = layer;
  }

  setRefreshGrid(callback: (() => void) | null) {
    this.refreshGrid = callback;
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  applyViewport() {
    if (!this.layer) {
      return;
    }

    this.viewport.applyToLayer(this.layer);
    this.refreshGrid?.();
  }

  zoomInViewport() {
    this.viewport.zoomInAt({
      x: this.width / 2,
      y: this.height / 2,
    });
    this.applyViewport();
  }

  zoomOutViewport() {
    this.viewport.zoomOutAt({
      x: this.width / 2,
      y: this.height / 2,
    });
    this.applyViewport();
  }

  generateId() {
    return `element-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  addElement(element: CanvasElement) {
    this.elements.push({
      ...element,
      zIndex: element.zIndex ?? this.elements.length + 2,
    });
  }

  updateElement(id: string, patch: Partial<CanvasElement>) {
    const element = this.elements.find((item) => item.id === id);
    if (!element) {
      return;
    }

    Object.assign(element, patch);
  }
}

export function createWorkSpaceStore(config: WorkSpaceStoreConfig = {}) {
  return new WorkSpaceStore(config);
}
