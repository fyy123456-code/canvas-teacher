import Konva from 'konva';
import { makeAutoObservable, observable } from 'mobx';

export const ElementType = {
  TEXT: 'text',
} as const;

export enum ElementStatus {
  SUCCESS = 'success',
}

export type ElementType = (typeof ElementType)[keyof typeof ElementType];

export type EditMode = 'select' | 'viewport-drag' | 'text';

export enum ToolBarItemEnum {
  UploadImage = 'UploadImage',
  Text = 'Text',
}

export interface ToolBarItem {
  toolName: ToolBarItemEnum;
}

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

export interface TextElementData extends BaseElementData {
  type: typeof ElementType.TEXT;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic' | 'bold' | 'bold italic';
  fill?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export type CanvasElement = TextElementData;

export interface WorkSpaceStoreConfig {
  width?: number;
  height?: number;
  elements?: CanvasElement[];
}

export class WorkSpaceStore {
  width: number;
  height: number;
  elements: CanvasElement[];
  editMode: EditMode = 'select';
  toolbarList: ToolBarItem[] = [
    { toolName: ToolBarItemEnum.UploadImage },
    { toolName: ToolBarItemEnum.Text },
  ];
  toolbarWrapperClass = '';
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

  setEditMode(mode: EditMode) {
    this.editMode = mode;
  }
}

export function createWorkSpaceStore(config: WorkSpaceStoreConfig = {}) {
  return new WorkSpaceStore(config);
}
