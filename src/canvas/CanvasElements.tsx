import type Konva from 'konva';
import type { CanvasElement } from '../store/workspaceStore';

export interface CanvasElementsProps {
  layer: Konva.Layer | null;
  elements: CanvasElement[];
}

export function CanvasElements(_props: CanvasElementsProps) {
  return null;
}

