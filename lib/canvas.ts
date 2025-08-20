// canvas.ts (Fabric v6)

import {
  Canvas,
  Path,
  ActiveSelection,
  util,
  PencilBrush,
  type FabricObject,
  type TEvent,
  type TPointerEvent,
  Point,
  type TMat2D,
} from "fabric";
import { v4 as uuid4 } from "uuid";

type TObjectEvent = TEvent<TPointerEvent> & { target: FabricObject | ActiveSelection | null };
type TSelectionEvent = TEvent<TPointerEvent> & { selected?: (FabricObject | ActiveSelection)[] };

import {
  CanvasMouseDown,
  CanvasMouseMove,
  CanvasMouseUp,
  CanvasObjectModified,
  CanvasObjectScaling,
  CanvasPathCreated,
  CanvasSelectionCreated,
  RenderCanvas,
} from "@/types/type";
import { defaultNavElement } from "@/constants";
import { createSpecificShape } from "./shapes";

/** Initialize Fabric canvas and a default free-drawing brush */
export const initializeFabric = ({
  fabricRef,
  canvasRef,
}: {
  fabricRef: React.MutableRefObject<Canvas | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}) => {
  const hostEl = document.getElementById("canvas") as HTMLCanvasElement | null;

  const canvas = new Canvas(canvasRef.current!, {
    width: hostEl?.clientWidth ?? window.innerWidth,
    height: hostEl?.clientHeight ?? window.innerHeight,
    preserveObjectStacking: true,
    selection: true,
  });

  canvas.freeDrawingBrush ??= new PencilBrush(canvas);

  fabricRef.current = canvas;
  return canvas;
};

/** Pointer down: start drawing or select target */
export const handleCanvasMouseDown = ({
  options,
  canvas,
  selectedShapeRef,
  isDrawing,
  shapeRef,
}: CanvasMouseDown) => {
  const pt = canvas.getPointer(options.e);
  const target = (options as unknown as TObjectEvent).target ?? null;

  canvas.isDrawingMode = false;

  if (selectedShapeRef.current === "freeform") {
    isDrawing.current = true;
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush ??= new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = 5;
    return;
  }

  if (
    target &&
    (target.type === selectedShapeRef.current || target.type === "activeSelection")
  ) {
    isDrawing.current = false;
    canvas.setActiveObject(target as FabricObject);
    (target as FabricObject).setCoords?.();
  } else {
    isDrawing.current = true;
    shapeRef.current = createSpecificShape(selectedShapeRef.current, { x: pt.x, y: pt.y }) as
      | FabricObject
      | null;
    if (shapeRef.current) canvas.add(shapeRef.current);
  }
};

/** Pointer move: resize the shape being drawn */
export const handleCanvaseMouseMove = ({
  options,
  canvas,
  isDrawing,
  selectedShapeRef,
  shapeRef,
  syncShapeInStorage,
}: CanvasMouseMove) => {
  if (!isDrawing.current) return;
  if (selectedShapeRef.current === "freeform") return;

  canvas.isDrawingMode = false;
  const pointer = canvas.getPointer(options.e);

  const left = shapeRef.current?.left ?? 0;
  const top = shapeRef.current?.top ?? 0;

  switch (selectedShapeRef.current) {
    case "rectangle":
    case "triangle": {
      shapeRef.current?.set({
        width: pointer.x - left,
        height: pointer.y - top,
      });
      break;
    }
    case "circle": {
      const w = Math.abs(pointer.x - left);
      const h = Math.abs(pointer.y - top);
      const r = Math.max(w, h) / 2;
      shapeRef.current?.set({ radius: r });
      break;
    }
    case "line": {
      shapeRef.current?.set({ x2: pointer.x, y2: pointer.y });
      break;
    }
    case "image": {
      shapeRef.current?.set({
        width: pointer.x - left,
        height: pointer.y - top,
      });
      break;
    }
    default:
      break;
  }

  canvas.renderAll();

  if (shapeRef.current?.objectId) {
    syncShapeInStorage(shapeRef.current);
  }
};

/** Pointer up: finish drawing and reset UI state */
export const handleCanvasMouseUp = ({
  canvas,
  isDrawing,
  shapeRef,
  activeObjectRef,
  selectedShapeRef,
  syncShapeInStorage,
  setActiveElement,
}: CanvasMouseUp) => {
  isDrawing.current = false;
  if (selectedShapeRef.current === "freeform") return;

  if (shapeRef.current) syncShapeInStorage(shapeRef.current);

  shapeRef.current = null;
  activeObjectRef.current = null;
  selectedShapeRef.current = null;

  if (!canvas.isDrawingMode) {
    setTimeout(() => setActiveElement(defaultNavElement), 700);
  }
};

/** Object modified: sync either the object or each object in an active selection */
export const handleCanvasObjectModified = ({
  options,
  syncShapeInStorage,
}: CanvasObjectModified) => {
  const target = (options as unknown as TObjectEvent).target ?? undefined;
  if (!target) return;

  if (target.type === "activeSelection" && "getObjects" in target) {
    (target as ActiveSelection).getObjects().forEach((obj) => syncShapeInStorage(obj));
  } else {
    syncShapeInStorage(target as FabricObject);
  }
};

/** Freehand path created: assign id & sync */
export const handlePathCreated = ({
  options,
  syncShapeInStorage,
}: CanvasPathCreated) => {
  const path = (options as { path?: Path }).path;
  if (!path) return;

  path.set({ objectId: uuid4() });
  syncShapeInStorage(path);
};

/** Constrain moving objects inside canvas bounds */
export const handleCanvasObjectMoving = ({ options }: { options: TObjectEvent }) => {
  const target = options.target as FabricObject | null;
  const canvas = target?.canvas;
  if (!target || !canvas) return;

  target.setCoords?.();

  const w = (target.getScaledWidth?.() ?? target.width ?? 0) as number;
  const h = (target.getScaledHeight?.() ?? target.height ?? 0) as number;

  const cw = canvas.getWidth();
  const ch = canvas.getHeight();

  const nextLeft = Math.max(0, Math.min(target.left ?? 0, cw - w));
  const nextTop = Math.max(0, Math.min(target.top ?? 0, ch - h));

  target.set({ left: nextLeft, top: nextTop });
};

/** Selection created: surface current attributes in the sidebar */
export const handleCanvasSelectionCreated = ({
  options,
  isEditingRef,
  setElementAttributes,
}: CanvasSelectionCreated) => {
  if (isEditingRef.current) return;

  const selected = (options as unknown as TSelectionEvent).selected;
  if (!selected || selected.length === 0) return;

  const selectedElement = selected[0] as FabricObject;

  if (selectedElement && selected.length === 1) {
    const scaledWidth =
      selectedElement.getScaledWidth?.() ?? (selectedElement.width ?? 0);
    const scaledHeight =
      selectedElement.getScaledHeight?.() ?? (selectedElement.height ?? 0);

    setElementAttributes({
      width: scaledWidth.toFixed(0).toString(),
      height: scaledHeight.toFixed(0).toString(),
      fill: (selectedElement as any)?.fill?.toString() || "",
      stroke: (selectedElement as any)?.stroke || "",
      fontSize: (selectedElement as any)?.fontSize || "",
      fontFamily: (selectedElement as any)?.fontFamily || "",
      fontWeight: (selectedElement as any)?.fontWeight || "",
    });
  }
};

/** While scaling, live-update width/height fields */
export const handleCanvasObjectScaling = ({
  options,
  setElementAttributes,
}: CanvasObjectScaling) => {
  const selectedElement = (options as unknown as TObjectEvent).target as FabricObject | null;
  if (!selectedElement) return;

  const scaledWidth =
    selectedElement.getScaledWidth?.() ?? (selectedElement.width ?? 0);
  const scaledHeight =
    selectedElement.getScaledHeight?.() ?? (selectedElement.height ?? 0);

  setElementAttributes((prev) => ({
    ...prev,
    width: scaledWidth.toFixed(0).toString(),
    height: scaledHeight.toFixed(0).toString(),
  }));
};

/** Rebuild the canvas from serialized objects */
export const renderCanvas = async ({
  fabricRef,
  canvasObjects,
  activeObjectRef,
}: RenderCanvas) => {
  const canvas = fabricRef.current;
  if (!canvas) return;

  canvas.clear();

  for (const [objectId, objectData] of canvasObjects) {
    const [obj] = (await util.enlivenObjects([objectData], {})) as FabricObject[];
    if (!obj) continue;

    if (activeObjectRef.current?.objectId === objectId) {
      canvas.setActiveObject(obj);
    }
    canvas.add(obj);
  }

  canvas.renderAll();
};

/** Resize canvas to host element */
export const handleResize = ({ canvas }: { canvas: Canvas | null }) => {
  const hostEl = document.getElementById("canvas") as HTMLCanvasElement | null;
  if (!hostEl || !canvas) return;

  canvas.setDimensions({
    width: hostEl.clientWidth,
    height: hostEl.clientHeight,
  });

  canvas.renderAll();
};

/** Smooth zoom with clamped bounds & viewport correction */
export const handleCanvasZoom = ({
  options,
  canvas,
}: {
  options: TEvent & { e: WheelEvent };
  canvas: Canvas;
}) => {
  const delta = options.e?.deltaY ?? 0;
  let zoom = canvas.getZoom();

  const minZoom = 0.2;
  const maxZoom = 1.0;
  const zoomStep = 0.001;

  zoom = Math.min(Math.max(minZoom, zoom + delta * zoomStep), maxZoom);

  const point = new Point(options.e.offsetX, options.e.offsetY);
  canvas.zoomToPoint(point, zoom);

  const vpt = canvas.viewportTransform as TMat2D | undefined;
  if (vpt) {
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    vpt[4] = Math.min(0, Math.max(vpt[4], cw - cw * zoom));
    vpt[5] = Math.min(0, Math.max(vpt[5], ch - ch * zoom));
    canvas.setViewportTransform(vpt);
  }

  options.e.preventDefault();
  options.e.stopPropagation();
};
