import Konva from 'konva';

export interface TextElementProps {
  layer: Konva.Layer | Konva.Group | null;
  elementId?: string;
  text: string;
  x?: number;
  y?: number;
  width?: number;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic' | 'bold' | 'bold italic';
  fill?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
  opacity?: number;
  draggable?: boolean;
  zIndex?: number;
}

export function createTextNode({
  layer,
  elementId,
  text,
  x = 0,
  y = 0,
  width,
  fontSize = 32,
  fontFamily = 'Arial',
  fontStyle = 'normal',
  fill = '#111827',
  align = 'left',
  verticalAlign = 'top',
  padding = 0,
  lineHeight = 1,
  letterSpacing = 0,
  opacity = 1,
  draggable = false,
  zIndex,
}: TextElementProps) {
  const textNode = new Konva.Text({
    text,
    x,
    y,
    width,
    fontSize,
    fontFamily,
    fontStyle,
    fill,
    align,
    verticalAlign,
    padding,
    lineHeight,
    letterSpacing,
    opacity,
    draggable,
    name: elementId,
  });

  layer?.add(textNode);

  if (typeof zIndex === 'number' && !Number.isNaN(zIndex)) {
    textNode.zIndex(zIndex);
  }

  layer?.draw();

  return {
    node: textNode,
  };
}

export function updateTextNode(textNode: Konva.Text, config: Konva.TextConfig) {
  const { height: _height, ...restConfig } = config;

  if (typeof restConfig.zIndex !== 'number' || Number.isNaN(restConfig.zIndex) || restConfig.zIndex === textNode.zIndex()) {
    delete restConfig.zIndex;
  }

  textNode.setAttrs({
    ...restConfig,
    height: undefined,
  });

  textNode.getLayer()?.batchDraw();
}
