import Konva from 'konva';

export interface CreateImageNodeOptions {
  layer: Konva.Layer;
  id: string;
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  draggable?: boolean;
  onDragEnd?: (node: Konva.Image) => void;
}

function createEmptyImage() {
  return document.createElement('canvas');
}

export function createImageNode({
  layer,
  id,
  src,
  x = 0,
  y = 0,
  width,
  height,
  zIndex,
  draggable = false,
  onDragEnd,
}: CreateImageNodeOptions) {
  const imageNode = new Konva.Image({
    image: createEmptyImage(),
    name: id,
    x,
    y,
    width: width ?? 0,
    height: height ?? 0,
    draggable,
    listening: draggable,
  });

  imageNode.on('dragend', () => {
    onDragEnd?.(imageNode);
  });

  layer.add(imageNode);

  if (typeof zIndex === 'number') {
    imageNode.zIndex(zIndex);
  }

  const image = new Image();

  image.onload = () => {
    imageNode.image(image);
    imageNode.width(width ?? image.naturalWidth);
    imageNode.height(height ?? image.naturalHeight);
    layer.batchDraw();
  };

  image.src = src;

  return imageNode;
}
