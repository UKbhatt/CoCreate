import { Canvas, util, type FabricObject } from "fabric";
import { v4 as uuidv4 } from "uuid";

export type CustomFabricObject<T extends FabricObject = FabricObject> = T & {
  objectId: string;
};

export const handleCopy = (canvas: Canvas) => {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length > 0) {
    const serialized = activeObjects.map((o) => o.toObject(["objectId"]));
    localStorage.setItem("clipboard", JSON.stringify(serialized));
  }
  return activeObjects;
};

export const handlePaste = async (
  canvas: Canvas,
  syncShapeInStorage: (shape: FabricObject) => void
) => {
  const clipboardData = localStorage.getItem("clipboard");
  if (!clipboardData) return;

  try {
    const parsedObjects = JSON.parse(clipboardData) as unknown[];

    for (const objData of parsedObjects) {
      const enlivened = await util.enlivenObjects([objData], {});
      for (const obj of enlivened as unknown as FabricObject[]) {
        obj.set({
          left: (obj.left ?? 0) + 20,
          top: (obj.top ?? 0) + 20,
          objectId: uuidv4(),
          ...(("fill" in (obj as any)) ? { fill: (obj as any).fill ?? "#aabbcc" } : {}),
        } as Partial<CustomFabricObject> as any);

        obj.setCoords();
        canvas.add(obj);
        syncShapeInStorage(obj);
      }
    }

    canvas.renderAll();
  } catch (err) {
    console.error("Paste failed:", err);
  }
};

export const handleDelete = (
  canvas: Canvas,
  deleteShapeFromStorage: (id: string) => void
) => {
  const activeObjects = canvas.getActiveObjects();
  if (!activeObjects || activeObjects.length === 0) return;

  activeObjects.forEach((obj) => {
    const o = obj as CustomFabricObject;
    if (!o.objectId) return;
    canvas.remove(o);
    deleteShapeFromStorage(o.objectId);
  });

  canvas.discardActiveObject();
  canvas.requestRenderAll();
};

export const handleKeyDown = ({
  e,
  canvas,
  undo,
  redo,
  syncShapeInStorage,
  deleteShapeFromStorage,
}: {
  e: KeyboardEvent;
  canvas: Canvas;
  undo: () => void;
  redo: () => void;
  syncShapeInStorage: (shape: FabricObject) => void;
  deleteShapeFromStorage: (id: string) => void;
}) => {
  const isMod = e.ctrlKey || e.metaKey;

  switch (e.key.toLowerCase()) {
    case "c": 
      if (isMod) handleCopy(canvas);
      break;

    case "v": 
      if (isMod) void handlePaste(canvas, syncShapeInStorage);
      break;

    case "x": 
      if (isMod) {
        handleCopy(canvas);
        handleDelete(canvas, deleteShapeFromStorage);
      }
      break;

    case "z":
      if (isMod) undo();
      break;

    case "y": 
      if (isMod) redo();
      break;

    case "/": 
      if (!e.shiftKey) {
        e.preventDefault();
      }
      break;

    case "delete":
    case "backspace":
      handleDelete(canvas, deleteShapeFromStorage);
      break;
  }
};
