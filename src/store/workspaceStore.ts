import Konva from 'konva';
import { makeAutoObservable, observable } from 'mobx';

export type CanvasElement = never;

export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
  elements?: CanvasElement[];
}

export class WorkSpaceStore {
  width: number;
  height: number;
  elements: CanvasElement[];
  stage: Konva.Stage | null = null;
  layer: Konva.Layer | null = null;

  constructor(config: WorkSpaceStoreConfig = {}) {
    this.width = config.width ?? window.innerWidth;
    this.height = config.height ?? window.innerHeight;
    this.elements = config.elements ?? [];

    makeAutoObservable(this, {
      stage: observable.ref,
      layer: observable.ref,
    });
  }

  setStage(stage: Konva.Stage | null) {
    this.stage = stage;
  }

  setLayer(layer: Konva.Layer | null) {
    this.layer = layer;
  }
}

export function createWorkSpaceStore(config: WorkSpaceStoreConfig = {}) {
  return new WorkSpaceStore(config);
}

