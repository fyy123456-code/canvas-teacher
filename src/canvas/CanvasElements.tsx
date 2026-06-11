import Konva from "konva";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { createImageNode } from "../elements/createImageElement";
import {
  MAX_IMAGE_ELEMENT_SIZE,
  MIN_IMAGE_ELEMENT_SIZE,
} from "../constants/element";
import { useStore } from "../store";
import { ElementType } from "../store/workspaceStore";
import type { CanvasElement } from "../store/workspaceStore";

export interface CanvasElementsProps {
  layer: Konva.Layer | null;
  elements: CanvasElement[];
}

export const CanvasElements = observer(
  ({ layer, elements }: CanvasElementsProps) => {
    const store = useStore();
    const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
    const selectionRectRef = useRef<Konva.Rect | null>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const [selectionUpdateKey, setSelectionUpdateKey] = useState(0);
    const elementSnapshot = elements.slice();
    const isViewportDragMode = store.editMode === "viewport-drag";
    const selectedId = store.selectedIds[0] ?? null;

    useEffect(() => {
      if (!layer) {
        return;
      }

      const nodeMap = nodeMapRef.current;
      const nextElementIds = new Set(
        elementSnapshot.map((element) => element.id),
      );

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
            draggable: !isViewportDragMode,
            onSelect: () => {
              if (store.editMode !== "select") {
                return;
              }

              store.selectElement(element.id);
            },
            onDragEnd: (node) => {
              store.updateElement(element.id, {
                x: node.x(),
                y: node.y(),
              });
              setSelectionUpdateKey((value) => value + 1);
            },
          });

          nodeMap.set(element.id, node);
        }
      });

      layer.batchDraw();
    }, [elementSnapshot, isViewportDragMode, layer, store]);

    useEffect(() => {
      const nodeMap = nodeMapRef.current;
      nodeMap.forEach((node) => {
        node.draggable(!isViewportDragMode);
        node.listening(!isViewportDragMode);
      });
      layer?.batchDraw();
    }, [isViewportDragMode, layer]);

    useEffect(() => {
      if (!layer) {
        return;
      }

      const transformer = new Konva.Transformer({
        boundBoxFunc: (oldBox, newBox) => {
          if (
            newBox.width < MIN_IMAGE_ELEMENT_SIZE ||
            newBox.height < MIN_IMAGE_ELEMENT_SIZE ||
            newBox.width > MAX_IMAGE_ELEMENT_SIZE ||
            newBox.height > MAX_IMAGE_ELEMENT_SIZE
          ) {
            return oldBox;
          }

          return newBox;
        },
        rotateEnabled: false,
        flipEnabled: false,
        borderStroke: "#4C90FF",
        borderStrokeWidth: 2,
        anchorSize: 10,
        anchorStroke: "#d4d6dc",
        anchorStrokeWidth: 2,
        anchorCornerRadius: 5,
        enabledAnchors: [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
      });

      layer.add(transformer);
      transformer.nodes([]);
      transformer.on("mousedown", (event) => {
        event.cancelBubble = true;
      });
      transformer.on("transformend", () => {
        const [node] = transformer.nodes();
        if (!node) {
          return;
        }

        const elementId = node.name();
        if (!elementId) {
          return;
        }

        const nextWidth = node.width() * node.scaleX();
        const nextHeight = node.height() * node.scaleY();
        const nextX = node.x();
        const nextY = node.y();

        node.setAttrs({
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
          scaleX: 1,
          scaleY: 1,
        });

        store.updateElement(elementId, {
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        });
        transformer.forceUpdate();
        setSelectionUpdateKey((value) => value + 1);
        layer.batchDraw();
      });
      transformerRef.current = transformer;
      layer.batchDraw();

      return () => {
        transformer.nodes([]);
        transformer.destroy();
        transformerRef.current = null;
        layer.batchDraw();
      };
    }, [layer]);

    useEffect(() => {
      const transformer = transformerRef.current;
      if (!layer || !transformer) {
        return;
      }

      if (!selectedId || isViewportDragMode) {
        transformer.nodes([]);
        layer.batchDraw();
        return;
      }

      const selectedNode = nodeMapRef.current.get(selectedId);
      if (!selectedNode) {
        transformer.nodes([]);
        layer.batchDraw();
        return;
      }

      transformer.nodes([selectedNode]);
      transformer.moveToTop();
      layer.batchDraw();
    }, [isViewportDragMode, layer, selectedId]);

    useEffect(() => {
      if (!layer) {
        return;
      }

      const updateSelectionBorder = () => {
        setSelectionUpdateKey((value) => value + 1);
      };
      const viewportEvents =
        "xChange.selectionBorder yChange.selectionBorder scaleXChange.selectionBorder scaleYChange.selectionBorder";

      layer.on(viewportEvents, updateSelectionBorder);

      return () => {
        layer.off(viewportEvents);
      };
    }, [layer]);

    useEffect(() => {
      if (!selectedId) {
        return;
      }

      const selectedNode = nodeMapRef.current.get(selectedId);
      if (!selectedNode) {
        return;
      }

      const updateSelectionBorder = () => {
        setSelectionUpdateKey((value) => value + 1);
      };
      const nodeEvents = "xChange.selectionBorder yChange.selectionBorder";

      selectedNode.on(nodeEvents, updateSelectionBorder);

      return () => {
        selectedNode.off(nodeEvents);
      };
    }, [selectedId]);

    useEffect(() => {
      if (!layer || !selectedId || transformerRef.current) {
        selectionRectRef.current?.destroy();
        selectionRectRef.current = null;
        layer?.batchDraw();
        return;
      }

      const selectedNode = nodeMapRef.current.get(selectedId);
      if (!selectedNode) {
        selectionRectRef.current?.destroy();
        selectionRectRef.current = null;
        layer.batchDraw();
        return;
      }

      const rect =
        selectionRectRef.current ??
        new Konva.Rect({
          name: "selection-border",
          listening: false,
          stroke: "#2563eb",
          strokeWidth: 2 / store.viewport.scale,
          dash: [8 / store.viewport.scale, 4 / store.viewport.scale],
        });
      const selectedRect = selectedNode.getClientRect({
        relativeTo: layer,
        skipStroke: true,
        skipShadow: true,
      });

      rect.setAttrs({
        x: selectedRect.x,
        y: selectedRect.y,
        width: selectedRect.width,
        height: selectedRect.height,
        strokeWidth: 2 / store.viewport.scale,
        dash: [8 / store.viewport.scale, 4 / store.viewport.scale],
      });

      if (!selectionRectRef.current) {
        selectionRectRef.current = rect;
        layer.add(rect);
      }

      rect.moveToTop();
      layer.batchDraw();
    }, [layer, selectedId, selectionUpdateKey, store.viewport.scale]);

    useEffect(() => {
      const nodeMap = nodeMapRef.current;

      return () => {
        selectionRectRef.current?.destroy();
        selectionRectRef.current = null;
        transformerRef.current?.destroy();
        transformerRef.current = null;
        nodeMap.forEach((node) => {
          node.destroy();
        });
        nodeMap.clear();
      };
    }, []);

    return null;
  },
);
