import Konva from 'konva';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { createImageNode } from '../elements/createImageElement';
import { ElementType } from '../store/workspaceStore';
import type { CanvasElement } from '../store/workspaceStore';

export interface CanvasElementsProps {
  layer: Konva.Layer | null;
  elements: CanvasElement[];
}

export const CanvasElements = observer(({ layer, elements }: CanvasElementsProps) => {
  const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
  const elementSnapshot = elements.slice();

  useEffect(() => {
    if (!layer) {
      return;
    }

    const nodeMap = nodeMapRef.current;
    const nextElementIds = new Set(elementSnapshot.map((element) => element.id));

    nodeMap.forEach((node, id) => {
      if (!nextElementIds.has(id)) {
        node.destroy();
        nodeMap.delete(id);
      }
    });

    elementSnapshot.forEach((element) => {
      if (nodeMap.has(element.id)) {
        return;
      }

      if (element.type === ElementType.IMAGE) {
        const node = createImageNode({
          layer,
          id: element.id,
          src: element.src,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex,
        });

        nodeMap.set(element.id, node);
      }
    });

    layer.batchDraw();
  }, [elementSnapshot, layer]);

  useEffect(() => {
    const nodeMap = nodeMapRef.current;

    return () => {
      nodeMap.forEach((node) => {
        node.destroy();
      });
      nodeMap.clear();
    };
  }, []);

  return null;
});
