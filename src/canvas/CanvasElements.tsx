import type Konva from 'konva';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { createImageNode, updateImageNode } from '../elements/createImageElement';
import { createTextNode, updateTextNode } from '../elements/createTextElement';
import { ElementStatus, ElementType } from '../store/workspaceStore';
import type { CanvasElement, ImageElementData, TextElementData } from '../store/workspaceStore';

export interface CanvasElementsProps {
  layer: Konva.Layer | null;
  elements: CanvasElement[];
}

export interface TextElementRendererProps {
  layer: Konva.Layer | null;
  element: TextElementData;
}

export interface ImageElementRendererProps {
  layer: Konva.Layer | null;
  element: ImageElementData;
}

const ImageElementRenderer = observer(({ layer, element }: ImageElementRendererProps) => {
  const imageNodeRef = useRef<Konva.Image | null>(null);
  const isCreatedRef = useRef(false);

  useEffect(() => {
    if (!layer || isCreatedRef.current) {
      return;
    }

    const result = createImageNode({
      layer,
      elementId: element.id,
      src: element.src,
      imageElement: element.imageElement,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      opacity: element.opacity,
      zIndex: element.zIndex,
      onImageLoaded: (image) => {
        if (!element.width || !element.height) {
          element.width = image.width;
          element.height = image.height;
        }
        element.status = ElementStatus.LOADED;
      },
    });

    imageNodeRef.current = result.node;
    isCreatedRef.current = true;
  }, [element.id, layer]);

  useEffect(() => {
    const node = imageNodeRef.current;
    if (!node) {
      return;
    }

    updateImageNode(
      node,
      {
        x: element.x ?? 0,
        y: element.y ?? 0,
        width: element.width,
        height: element.height,
        opacity: element.opacity,
        zIndex: element.zIndex,
      },
      element.src,
      (image) => {
        if (!element.width || !element.height) {
          element.width = image.width;
          element.height = image.height;
        }
        element.status = ElementStatus.LOADED;
      },
    );
  }, [element.height, element.opacity, element.src, element.width, element.x, element.y, element.zIndex]);

  useEffect(() => {
    return () => {
      imageNodeRef.current?.off();
      imageNodeRef.current?.remove();
      imageNodeRef.current?.destroy();
      imageNodeRef.current = null;
      isCreatedRef.current = false;
    };
  }, []);

  return null;
});

const TextElementRenderer = observer(({ layer, element }: TextElementRendererProps) => {
  const textNodeRef = useRef<Konva.Text | null>(null);
  const isCreatedRef = useRef(false);

  useEffect(() => {
    if (!layer || isCreatedRef.current) {
      return;
    }

    const result = createTextNode({
      layer,
      elementId: element.id,
      text: element.text,
      x: element.x,
      y: element.y,
      width: element.width,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fontStyle: element.fontStyle,
      fill: element.fill,
      align: element.align,
      verticalAlign: element.verticalAlign,
      padding: element.padding,
      lineHeight: element.lineHeight,
      letterSpacing: element.letterSpacing,
      opacity: element.opacity,
      zIndex: element.zIndex,
    });

    textNodeRef.current = result.node;
    isCreatedRef.current = true;
  }, [element.id, layer]);

  useEffect(() => {
    const node = textNodeRef.current;
    if (!node) {
      return;
    }

    updateTextNode(node, {
      text: element.text,
      x: element.x ?? 0,
      y: element.y ?? 0,
      width: element.width,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fontStyle: element.fontStyle,
      fill: element.fill,
      align: element.align,
      verticalAlign: element.verticalAlign,
      padding: element.padding,
      lineHeight: element.lineHeight,
      letterSpacing: element.letterSpacing,
      opacity: element.opacity,
      zIndex: element.zIndex,
    });
  }, [
    element.align,
    element.fill,
    element.fontFamily,
    element.fontSize,
    element.fontStyle,
    element.letterSpacing,
    element.lineHeight,
    element.opacity,
    element.padding,
    element.text,
    element.verticalAlign,
    element.width,
    element.x,
    element.y,
    element.zIndex,
  ]);

  useEffect(() => {
    return () => {
      textNodeRef.current?.off();
      textNodeRef.current?.remove();
      textNodeRef.current?.destroy();
      textNodeRef.current = null;
      isCreatedRef.current = false;
    };
  }, []);

  return null;
});

export const CanvasElements = observer(({ layer, elements }: CanvasElementsProps) => {
  return (
    <>
      {elements.map((element) => {
        if (element.type === ElementType.IMAGE) {
          return <ImageElementRenderer key={element.id} layer={layer} element={element} />;
        }

        if (element.type === ElementType.TEXT) {
          return <TextElementRenderer key={element.id} layer={layer} element={element} />;
        }

        return null;
      })}
    </>
  );
});
