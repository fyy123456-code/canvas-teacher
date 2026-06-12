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

function isKonvaNode(node: Konva.Node | undefined): node is Konva.Node {
  return Boolean(node);
}

export const CanvasElements = observer(
  ({ layer, elements }: CanvasElementsProps) => {
    const store = useStore();
    const nodeMapRef = useRef<Map<string, Konva.Node>>(new Map());
    const selectionBordersRef = useRef<Map<string, Konva.Rect>>(new Map());
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const [selectionUpdateKey, setSelectionUpdateKey] = useState(0);
    const elementSnapshot = elements.slice();
    const isViewportDragMode = store.editMode === "viewport-drag";
    const selectedIds = store.selectedIds.slice();
    const selectedIdsKey = selectedIds.join("|");

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
            onSelect: (event) => {
              if (store.editMode !== "select") {
                return;
              }

              const isMultiSelect =
                event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey;
              if (!isMultiSelect && store.selectedIds.includes(element.id)) {
                return;
              }

              store.selectElement(element.id, isMultiSelect);
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
        const nodes = transformer.nodes();
        if (nodes.length === 0) {
          return;
        }

        nodes.forEach((node) => {
          if (!(node instanceof Konva.Image)) {
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

          node.x(nextX);
          node.y(nextY);
          node.width(nextWidth);
          node.height(nextHeight);
          node.scaleX(1);
          node.scaleY(1);

          store.updateElement(elementId, {
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight,
          });
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

      if (selectedIds.length === 0 || isViewportDragMode) {
        transformer.nodes([]);
        layer.batchDraw();
        return;
      }

      const selectedNodes = selectedIds
        .map((id) => nodeMapRef.current.get(id))
        .filter(isKonvaNode);
      if (selectedNodes.length === 0) {
        transformer.nodes([]);
        layer.batchDraw();
        return;
      }

      transformer.nodes(selectedNodes);
      transformer.moveToTop();
      layer.batchDraw();
    }, [isViewportDragMode, layer, selectedIdsKey]);

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
      if (selectedIds.length === 0) {
        return;
      }

      const selectedNodes = selectedIds
        .map((id) => nodeMapRef.current.get(id))
        .filter(isKonvaNode);
      if (selectedNodes.length === 0) {
        return;
      }

      const updateSelectionBorder = () => {
        setSelectionUpdateKey((value) => value + 1);
      };
      const nodeEvents = "xChange.selectionBorder yChange.selectionBorder";

      selectedNodes.forEach((node) => {
        node.on(nodeEvents, updateSelectionBorder);
      });

      return () => {
        selectedNodes.forEach((node) => {
          node.off(nodeEvents);
        });
      };
    }, [selectedIdsKey]);

    useEffect(() => {
      const selectionBorders = selectionBordersRef.current;
      selectionBorders.forEach((rect) => {
        rect.destroy();
      });
      selectionBorders.clear();

      if (!layer || selectedIds.length <= 1 || isViewportDragMode) {
        layer?.batchDraw();
        return;
      }

      selectedIds.forEach((id) => {
        const selectedNode = nodeMapRef.current.get(id);
        if (!selectedNode) {
          return;
        }

        const selectedRect = selectedNode.getClientRect({
          relativeTo: layer,
          skipStroke: true,
          skipShadow: true,
        });
        const rect = new Konva.Rect({
          name: `selection-border-${id}`,
          listening: false,
          stroke: "#4C90FF",
          x: selectedRect.x,
          y: selectedRect.y,
          width: selectedRect.width,
          height: selectedRect.height,
          strokeWidth: 2 / store.viewport.scale,
        });

        layer.add(rect);
        selectionBorders.set(id, rect);
      });

      transformerRef.current?.moveToTop();
      layer.batchDraw();

      return () => {
        selectionBorders.forEach((rect) => {
          rect.destroy();
        });
        selectionBorders.clear();
        layer.batchDraw();
      };
    }, [
      isViewportDragMode,
      layer,
      selectedIdsKey,
      selectionUpdateKey,
      store.viewport.scale,
    ]);

    useEffect(() => {
      const nodeMap = nodeMapRef.current;
      const selectionBorders = selectionBordersRef.current;

      return () => {
        selectionBorders.forEach((rect) => {
          rect.destroy();
        });
        selectionBorders.clear();
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
