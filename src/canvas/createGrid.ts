import Konva from 'konva';
import type { Viewport } from '../viewport';
import { GRID_LINE_COLOR, GRID_SIZE } from './canvasConfig';

export interface CreateGridOptions {
  width: number;
  height: number;
  viewport: Viewport;
}

function getStartLine(value: number) {
  return Math.floor(value / GRID_SIZE) * GRID_SIZE;
}

export function createGridGroup({ width, height, viewport }: CreateGridOptions) {
  const gridGroup = new Konva.Group({
    name: 'canvas-grid',
    listening: false,
  });

  const worldLeft = (0 - viewport.x) / viewport.scale;
  const worldTop = (0 - viewport.y) / viewport.scale;
  const worldRight = (width - viewport.x) / viewport.scale;
  const worldBottom = (height - viewport.y) / viewport.scale;
  const startX = getStartLine(worldLeft) - GRID_SIZE;
  const endX = getStartLine(worldRight) + GRID_SIZE;
  const startY = getStartLine(worldTop) - GRID_SIZE;
  const endY = getStartLine(worldBottom) + GRID_SIZE;

  for (let x = startX; x <= endX; x += GRID_SIZE) {
    gridGroup.add(
      new Konva.Line({
        points: [x, startY, x, endY],
        stroke: GRID_LINE_COLOR,
        strokeWidth: 1 / viewport.scale,
        listening: false,
      }),
    );
  }

  for (let y = startY; y <= endY; y += GRID_SIZE) {
    gridGroup.add(
      new Konva.Line({
        points: [startX, y, endX, y],
        stroke: GRID_LINE_COLOR,
        strokeWidth: 1 / viewport.scale,
        listening: false,
      }),
    );
  }

  return gridGroup;
}
