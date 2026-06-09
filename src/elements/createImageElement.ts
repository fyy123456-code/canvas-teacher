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
}

function createEmptyImage() {
  return document.createElement('canvas');
}

export function createImageNode({ layer, id, src, x = 0, y = 0, width, height, zIndex }: CreateImageNodeOptions) {
  const imageNode = new Konva.Image({
    image: createEmptyImage(),
    name: id,
    x,
    y,
    width: width ?? 0,
    height: height ?? 0,
    listening: false,
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
