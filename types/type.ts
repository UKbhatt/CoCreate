// types.ts — Fabric v6 compatible (no namespace import)

import type {
  Canvas,
  FabricObject,
  Pattern,
  Path,
  Gradient,
  TEvent,
} from "fabric";
type AnyGradient = Gradient<"linear" | "radial", any>;
import type { BaseUserMeta, User } from "@liveblocks/client";


/* ───────────────────────── Cursor / Presence ───────────────────────── */

export enum CursorMode {
  Hidden,
  Chat,
  ReactionSelector,
  Reaction,
}

export type CursorState =
  | { mode: CursorMode.Hidden }
  | { mode: CursorMode.Chat; message: string; previousMessage: string | null }
  | { mode: CursorMode.ReactionSelector }
  | { mode: CursorMode.Reaction; reaction: string; isPressed: boolean };

export type Reaction = {
  value: string;
  timestamp: number;
  point: { x: number; y: number };
};

export type ReactionEvent = { x: number; y: number; value: string };

export type Presence = any;

export type LiveCursorProps = {
  others: readonly User<Presence, BaseUserMeta>[];
};

/* ───────────────── Canvas object data & attributes ─────────────────── */

export type ShapeData = {
  type: string;
  width: number;
  height: number;
  fill: string | Pattern | AnyGradient;
  left: number;
  top: number;
  objectId?: string;
};

export type Attributes = {
  width: string;
  height: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  stroke: string;
};

export type ActiveElement =
  | { name: string; value: string; icon: string }
  | null;

/** Extend any Fabric object with our custom metadata */
export interface CustomFabricObject<T extends FabricObject> extends FabricObject {
  objectId?: string;
}

/* ─────────────────────────── Actions / helpers ─────────────────────── */

export type ModifyShape = {
  canvas: Canvas;
  property: string;
  value: any;
  activeObjectRef: React.MutableRefObject<FabricObject | null>;
  syncShapeInStorage: (shape: FabricObject) => void;
};

export type ElementDirection = {
  canvas: Canvas;
  direction: string;
  syncShapeInStorage: (shape: FabricObject) => void;
};

export type ImageUpload = {
  file: File;
  canvas: React.MutableRefObject<Canvas | null>;
  shapeRef: React.MutableRefObject<FabricObject | null>;
  syncShapeInStorage: (shape: FabricObject) => void;
};

/* ───────────────────────────── UI props ────────────────────────────── */

export type RightSidebarProps = {
  elementAttributes: Attributes;
  setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
  fabricRef: React.RefObject<Canvas | null>;
  activeObjectRef: React.RefObject<FabricObject | null>;
  isEditingRef: React.MutableRefObject<boolean>;
  syncShapeInStorage: (obj: FabricObject) => void;
};

export type NavbarProps = {
  activeElement: ActiveElement;
  imageInputRef: React.MutableRefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleActiveElement: (element: ActiveElement) => void;
};

export type ShapesMenuProps = {
  item: { name: string; icon: string; value: Array<ActiveElement> };
  activeElement: ActiveElement;
  handleActiveElement: (el: ActiveElement) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageInputRef: React.MutableRefObject<HTMLInputElement | null>;
};

/* ─────────────── Fabric v6 event payloads (typed) ──────────────────── */

export type CanvasMouseDown = {
  options: TEvent<any>;
  canvas: Canvas;
  selectedShapeRef: React.MutableRefObject<any>;
  isDrawing: React.MutableRefObject<boolean>;
  shapeRef: React.MutableRefObject<FabricObject | null>;
};

export type CanvasMouseMove = {
  options: TEvent<any>;
  canvas: Canvas;
  isDrawing: React.MutableRefObject<boolean>;
  selectedShapeRef: React.MutableRefObject<any>;
  shapeRef: React.MutableRefObject<FabricObject | null>;
  syncShapeInStorage: (shape: FabricObject) => void;
};

export type CanvasMouseUp = {
  canvas: Canvas;
  isDrawing: React.MutableRefObject<boolean>;
  shapeRef: React.MutableRefObject<FabricObject | null>;
  activeObjectRef: React.MutableRefObject<FabricObject | null>;
  selectedShapeRef: React.MutableRefObject<any>;
  syncShapeInStorage: (shape: FabricObject) => void;
  setActiveElement: (el: ActiveElement) => void;
};

export type CanvasObjectModified = {
  options: TEvent<any>;
  syncShapeInStorage: (shape: FabricObject) => void;
};

export type CanvasPathCreated = {
  options: (TEvent<any> & { path: CustomFabricObject<Path> }) | any;
  syncShapeInStorage: (shape: FabricObject) => void;
};

export type CanvasSelectionCreated = {
  options: TEvent<any>;
  isEditingRef: React.MutableRefObject<boolean>;
  setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
};

export type CanvasObjectScaling = {
  options: TEvent<any>;
  setElementAttributes: React.Dispatch<React.SetStateAction<Attributes>>;
};

export type RenderCanvas = {
  fabricRef: React.MutableRefObject<Canvas | null>;
  canvasObjects: any;
  activeObjectRef: React.MutableRefObject<FabricObject | null>;
};

export type CursorChatProps = {
  cursor: { x: number; y: number };
  cursorState: CursorState;
  setCursorState: (cursorState: CursorState) => void;
  updateMyPresence: (
    presence: Partial<{
      cursor: { x: number; y: number };
      cursorColor: string;
      message: string;
    }>
  ) => void;
};
