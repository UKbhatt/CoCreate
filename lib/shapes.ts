import {
  Canvas,
  Rect,
  Triangle,
  Circle,
  Line,
  IText,
  Image as FabricImage,
  type FabricObject,
} from "fabric";
import { v4 as uuidv4 } from "uuid";

declare module "fabric" {
  interface FabricObject {
    objectId?: string;
  }
}

declare module "fabric" {
  interface FabricObject {
    bringToFront(): this;
    sendToBack(): this;
    bringForward(intersectingOnly?: boolean): this;
    sendBackwards(intersectingOnly?: boolean): this;
  }
}


type XY = { x: number; y: number };

export const createRectangle = (pt: XY) => {
  const rect = new Rect({ left: pt.x, top: pt.y, width: 100, height: 100, fill: "#aabbcc" });
  rect.objectId = uuidv4();
  return rect;
};

export const createTriangle = (pt: XY) => {
  const tri = new Triangle({ left: pt.x, top: pt.y, width: 100, height: 100, fill: "#aabbcc" });
  tri.objectId = uuidv4();
  return tri;
};

export const createCircle = (pt: XY) => {
  const circ = new Circle({ left: pt.x, top: pt.y, radius: 100, fill: "#aabbcc" });
  circ.objectId = uuidv4();
  return circ;
};

export const createLine = (pt: XY) => {
  const line = new Line([pt.x, pt.y, pt.x + 100, pt.y + 100], {
    stroke: "#aabbcc",
    strokeWidth: 2,
  });
  line.objectId = uuidv4();
  return line;
};

export const createText = (pt: XY, text: string) => {
  const itext = new IText(text, {
    left: pt.x,
    top: pt.y,
    fill: "#aabbcc",
    fontFamily: "Helvetica",
    fontSize: 36,
    fontWeight: "400",
  });
  itext.objectId = uuidv4();
  return itext;
};

export const createSpecificShape = (shapeType: string, pt: XY) => {
  switch (shapeType) {
    case "rectangle": return createRectangle(pt);
    case "triangle":  return createTriangle(pt);
    case "circle":    return createCircle(pt);
    case "line":      return createLine(pt);
    case "text":      return createText(pt, "Tap to Type");
    default:          return null;
  }
};

export const handleImageUpload = async ({
  file,
  canvas,
  shapeRef,
  syncShapeInStorage,
}: {
  file: File;
  canvas: React.MutableRefObject<Canvas | null>;
  shapeRef: React.MutableRefObject<FabricObject | null>;
  syncShapeInStorage: (shape: FabricObject) => void;
}) => {
  const reader = new FileReader();

  reader.onload = async () => {
    const img = await FabricImage.fromURL(reader.result as string);
    img.scaleToWidth(200);
    img.scaleToHeight(200);

    img.objectId = uuidv4();
    canvas.current!.add(img);
    shapeRef.current = img;
    syncShapeInStorage(img);
    canvas.current!.requestRenderAll();
  };

  reader.readAsDataURL(file);
};

export const createShape = (canvas: Canvas, pt: XY, shapeType: string) => {
  if (shapeType === "freeform") {
    canvas.isDrawingMode = true;
    return null;
  }
  return createSpecificShape(shapeType, pt);
};

export const modifyShape = ({
  canvas,
  property,
  value,
  activeObjectRef,
  syncShapeInStorage,
}: {
  canvas: Canvas;
  property: string;
  value: any;
  activeObjectRef: React.MutableRefObject<FabricObject | null>;
  syncShapeInStorage: (shape: FabricObject) => void;
}) => {
  const selected = canvas.getActiveObject();
  if (!selected || selected.type === "activeSelection") return;

  if (property === "width") {
    selected.set("scaleX", 1);
    selected.set("width", value);
  } else if (property === "height") {
    selected.set("scaleY", 1);
    selected.set("height", value);
  } else {
    if ((selected as any)[property] === value) return;
    selected.set(property as any, value);
  }

  activeObjectRef.current = selected;
  syncShapeInStorage(selected);
};

export const bringElement = ({
  canvas,
  direction,
  syncShapeInStorage,
}: {
  canvas: Canvas;
  direction: "front" | "back";
  syncShapeInStorage: (shape: FabricObject) => void;
}) => {
  const selected = canvas.getActiveObject();
  if (!selected || selected.type === "activeSelection") return;

  if (direction === "front") {
    selected.bringToFront();
  } else {
    selected.sendToBack();
  }

  canvas.requestRenderAll();
  syncShapeInStorage(selected);
};
