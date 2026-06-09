import Konva from 'konva';
import { GRID_LINE_COLOR, GRID_SIZE } from './canvasConfig';

export interface CreateGridOptions {
  width: number;
  height: number;
}

export function createGridGroup({ width, height }: CreateGridOptions) {
  const gridGroup = new Konva.Group({
    name: 'canvas-grid',
    listening: false,
  });

  for (let x = 0; x <= width; x += GRID_SIZE) {
    gridGroup.add(
      new Konva.Line({
        points: [x, 0, x, height],
        stroke: GRID_LINE_COLOR,
        strokeWidth: 1,
        listening: false,
      }),
    );
  }

  for (let y = 0; y <= height; y += GRID_SIZE) {
    gridGroup.add(
      new Konva.Line({
        points: [0, y, width, y],
        stroke: GRID_LINE_COLOR,
        strokeWidth: 1,
        listening: false,
      }),
    );
  }

  return gridGroup;
}
