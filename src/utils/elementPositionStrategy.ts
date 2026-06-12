import type { CanvasElement } from '../store/workspaceStore';

export interface PositionConfig {
  horizontalGap: number;
  verticalGap: number;
  startX: number;
  startY: number;
  defaultWidth: number;
  defaultHeight: number;
}

export const DEFAULT_POSITION_CONFIG: PositionConfig = {
  horizontalGap: 40,
  verticalGap: 120,
  startX: 100,
  startY: 100,
  defaultWidth: 200,
  defaultHeight: 200,
};

function getElementBounds(element: CanvasElement, config: PositionConfig) {
  const x = element.x ?? 0;
  const y = element.y ?? 0;
  const width = element.width ?? config.defaultWidth;
  const height = element.height ?? config.defaultHeight;

  return {
    x,
    y,
    width,
    height,
    right: x + width,
    bottom: y + height,
  };
}

function getBatchStartPosition(elements: CanvasElement[], config: PositionConfig) {
  if (elements.length === 0) {
    return {
      x: config.startX,
      y: config.startY,
    };
  }

  const maxBottom = elements.reduce((bottom, element) => {
    return Math.max(bottom, getElementBounds(element, config).bottom);
  }, config.startY);

  return {
    x: config.startX,
    y: maxBottom + config.verticalGap,
  };
}

export function calculateElementsPositions(
  newElements: CanvasElement[],
  existingElements: CanvasElement[],
  config: Partial<PositionConfig> = {},
) {
  const finalConfig = {
    ...DEFAULT_POSITION_CONFIG,
    ...config,
  };
  const batchStartPosition = getBatchStartPosition(existingElements, finalConfig);
  let currentX = batchStartPosition.x;

  return newElements.map((element) => {
    if (element.x !== undefined && element.y !== undefined) {
      currentX = element.x + (element.width ?? finalConfig.defaultWidth) + finalConfig.horizontalGap;
      return element;
    }

    const positionedElement = {
      ...element,
      x: element.x ?? currentX,
      y: element.y ?? batchStartPosition.y,
    };

    currentX =
      positionedElement.x +
      (positionedElement.width ?? finalConfig.defaultWidth) +
      finalConfig.horizontalGap;

    return positionedElement;
  });
}
