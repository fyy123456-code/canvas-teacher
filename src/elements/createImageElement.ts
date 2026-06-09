import Konva from 'konva';

export interface ImageElementProps {
  layer: Konva.Layer | Konva.Group;
  elementId?: string | number;
  src?: string;
  imageElement?: HTMLImageElement | HTMLCanvasElement;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  zIndex?: number;
  draggable?: boolean;
  onImageLoaded?: (image: HTMLImageElement | HTMLCanvasElement) => void;
}

export function createImageNode({
  layer,
  elementId,
  src,
  imageElement,
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  opacity = 1,
  zIndex,
  draggable = true,
  onImageLoaded,
}: ImageElementProps) {
  const imageNode = new Konva.Image({
    image: imageElement,
    x,
    y,
    width,
    height,
    opacity,
    draggable,
    name: elementId?.toString(),
  });

  layer.add(imageNode);

  if (typeof zIndex === 'number' && !Number.isNaN(zIndex)) {
    imageNode.zIndex(zIndex);
  }

  layer.draw();

  if (src && !imageElement) {
    loadImageDirectly(imageNode, src, onImageLoaded);
  }

  return {
    node: imageNode,
  };
}

export function updateImageNode(
  imageNode: Konva.Image,
  config: Partial<Omit<Konva.ImageConfig, 'image'>>,
  src?: string,
  onImageLoaded?: (image: HTMLImageElement | HTMLCanvasElement) => void,
) {
  const { ...nextConfig } = config;

  if (typeof nextConfig.zIndex !== 'number' || Number.isNaN(nextConfig.zIndex) || nextConfig.zIndex === imageNode.zIndex()) {
    delete nextConfig.zIndex;
  }

  imageNode.setAttrs(nextConfig as Konva.ImageConfig);

  if (src && src !== imageNode.getAttr('src')) {
    imageNode.setAttr('src', src);
    loadImageDirectly(imageNode, src, onImageLoaded);
  }

  imageNode.getLayer()?.batchDraw();
}

function loadImageDirectly(
  imageNode: Konva.Image,
  src: string,
  onImageLoaded?: (image: HTMLImageElement | HTMLCanvasElement) => void,
) {
  const image = new window.Image();
  image.crossOrigin = 'anonymous';

  image.onload = () => {
    imageNode.setAttrs({
      image,
      width: imageNode.width() || image.width,
      height: imageNode.height() || image.height,
    });
    imageNode.getLayer()?.batchDraw();
    onImageLoaded?.(image);
  };

  image.onerror = () => {
    imageNode.getLayer()?.batchDraw();
  };

  image.src = src;
}
