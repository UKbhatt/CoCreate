"use client";

import { useEffect, useRef, useState } from "react";
import { useUndo, useRedo } from "@liveblocks/react";
import type { Canvas, FabricObject, TPointerEvent, TEvent } from "fabric";

type SelectionCreatedEvent = TEvent<TPointerEvent> & {
    selected?: FabricObject[];
};

import { useMutation, useStorage } from "@/liveblocks.config";
import {
    handleCanvaseMouseMove,
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    handleCanvasObjectModified,
    handleCanvasObjectMoving,
    handleCanvasObjectScaling,
    handleCanvasZoom,
    handlePathCreated,
    handleResize,
    initializeFabric,
    renderCanvas,
} from "@/lib/canvas";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { LeftSidebar, Live, Navbar, RightSidebar } from "@/components/index";
import { handleImageUpload } from "@/lib/shapes";
import { defaultNavElement } from "@/constants";
import { ActiveElement, Attributes } from "@/types/type";

export const handleCanvasSelectionCreated = ({
    options,
    isEditingRef,
    setElementAttributes,
}: {
    options: SelectionCreatedEvent;
    isEditingRef: React.MutableRefObject<boolean>;
    setElementAttributes: (attrs: any) => void;
}) => {
    if (isEditingRef.current) return;
    if (!options?.selected || options.selected.length === 0) return;

    const selectedElement = options.selected[0] as FabricObject;

    if (selectedElement && options.selected.length === 1) {
        const scaledWidth = selectedElement?.scaleX
            ? (selectedElement?.width ?? 0) * (selectedElement?.scaleX ?? 1)
            : selectedElement?.width;

        const scaledHeight = selectedElement?.scaleY
            ? (selectedElement?.height ?? 0) * (selectedElement?.scaleY ?? 1)
            : selectedElement?.height;

        setElementAttributes({
            width: scaledWidth?.toFixed(0).toString() || "",
            height: scaledHeight?.toFixed(0).toString() || "",
            fill: (selectedElement as any)?.fill?.toString() || "",
            stroke: (selectedElement as any)?.stroke || "",
            fontSize: (selectedElement as any)?.fontSize || "",
            fontFamily: (selectedElement as any)?.fontFamily || "",
            fontWeight: (selectedElement as any)?.fontWeight || "",
        });
    }
};


const Home = () => {
    /* Liveblocks undo/redo */
    const undo = useUndo();
    const redo = useRedo();

    /* Live storage: serialized canvas objects Map<objectId, json> */
    const canvasObjects = useStorage((root) => root.canvasObjects);

    /* DOM <canvas> element ref & Fabric canvas ref */
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);

    /* Drawing state */
    const isDrawing = useRef<boolean>(false);
    const shapeRef = useRef<FabricObject | null>(null);
    const selectedShapeRef = useRef<string | null>(null);

    /* Track active Fabric object across re-renders */
    const activeObjectRef = useRef<FabricObject | null>(null);
    const isEditingRef = useRef<boolean>(false);

    /* Image input for uploads */
    const imageInputRef = useRef<HTMLInputElement>(null);

    /* Navbar state */
    const [activeElement, setActiveElement] = useState<ActiveElement>({
        name: "",
        value: "",
        icon: "",
    });

    /* Right sidebar attributes */
    const [elementAttributes, setElementAttributes] = useState<Attributes>({
        width: "",
        height: "",
        fontSize: "",
        fontFamily: "",
        fontWeight: "",
        fill: "#aabbcc",
        stroke: "#aabbcc",
    });

    /* Liveblocks mutations */
    const deleteShapeFromStorage = useMutation(({ storage }, shapeId: string) => {
        const map = storage.get("canvasObjects");
        map.delete(shapeId);
    }, []);

    const deleteAllShapes = useMutation(({ storage }) => {
        const map = storage.get("canvasObjects");
        if (!map || map.size === 0) return true;
        for (const [key] of map.entries()) map.delete(key);
        return map.size === 0;
    }, []);

    const syncShapeInStorage = useMutation(({ storage }, object: any) => {
        if (!object) return;
        const { objectId } = object;
        const shapeData = object.toJSON();
        shapeData.objectId = objectId;
        const map = storage.get("canvasObjects");
        map.set(objectId, shapeData);
    }, []);

    /* Navbar action handler */
    const handleActiveElement = (elem: ActiveElement) => {
        setActiveElement(elem);

        switch (elem?.value) {
            case "reset":
                deleteAllShapes();
                fabricRef.current?.clear();
                setActiveElement(defaultNavElement);
                break;

            case "delete":
                handleDelete(fabricRef.current as any, deleteShapeFromStorage);
                setActiveElement(defaultNavElement);
                break;

            case "image":
                imageInputRef.current?.click();
                isDrawing.current = false;
                if (fabricRef.current) fabricRef.current.isDrawingMode = false;
                break;

            case "comments":
                break;

            default:
                selectedShapeRef.current = elem?.value as string;
                break;
        }
    };

    /* Set up Fabric and window listeners */
    useEffect(() => {
        const canvas = initializeFabric({ canvasRef, fabricRef });

        // Fabric canvas events
        canvas.on("mouse:down", (options) =>
            handleCanvasMouseDown({ options, canvas, selectedShapeRef, isDrawing, shapeRef })
        );

        canvas.on("mouse:move", (options) =>
            handleCanvaseMouseMove({
                options,
                canvas,
                isDrawing,
                selectedShapeRef,
                shapeRef,
                syncShapeInStorage,
            })
        );

        canvas.on("mouse:up", () =>
            handleCanvasMouseUp({
                canvas,
                isDrawing,
                shapeRef,
                activeObjectRef,
                selectedShapeRef,
                syncShapeInStorage,
                setActiveElement,
            })
        );

        canvas.on("path:created", (options) =>
            handlePathCreated({ options, syncShapeInStorage })
        );

        type ObjectModifiedEvent = TEvent<TPointerEvent> & {
            target?: FabricObject;
        };
        canvas.on("object:modified", (options) =>
            handleCanvasObjectModified({
                options: options as unknown as ObjectModifiedEvent,
                syncShapeInStorage,
            })
        );



        canvas.on("object:moving", (options) =>
            handleCanvasObjectMoving({ options } as any)
        );

        canvas.on("selection:created", (options) =>
            handleCanvasSelectionCreated({
                options: options as unknown as SelectionCreatedEvent,  
                isEditingRef,
                setElementAttributes,
            })
        );

        canvas.on("object:scaling", (options) =>
            handleCanvasObjectScaling({ options, setElementAttributes })
        );

        canvas.on("mouse:wheel", (options) =>
            handleCanvasZoom({ options: options as any, canvas })
        );

        // Window events — define handlers so we can remove them later
        const resizeHandler = () => handleResize({ canvas: fabricRef.current });
        const keydownHandler = (e: KeyboardEvent) =>
            handleKeyDown({
                e,
                canvas: fabricRef.current!,
                undo,
                redo,
                syncShapeInStorage,
                deleteShapeFromStorage,
            });

        window.addEventListener("resize", resizeHandler);
        window.addEventListener("keydown", keydownHandler);

        return () => {
            canvas.dispose();
            window.removeEventListener("resize", resizeHandler);
            window.removeEventListener("keydown", keydownHandler);
        };
    }, [canvasRef, deleteShapeFromStorage, redo, syncShapeInStorage, undo]);

    /* Re-render Fabric when shared storage changes */
    useEffect(() => {
        renderCanvas({ fabricRef, canvasObjects, activeObjectRef });
    }, [canvasObjects]);

    return (
        <main className="h-screen overflow-hidden">
            <Navbar
                imageInputRef={imageInputRef}
                activeElement={activeElement}
                handleImageUpload={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.stopPropagation();
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleImageUpload({
                        file,
                        canvas: fabricRef,
                        shapeRef,
                        syncShapeInStorage,
                    });
                }}
                handleActiveElement={handleActiveElement}
            />

            <section className="flex h-full flex-row">
                <LeftSidebar allShapes={Array.from(canvasObjects?.entries?.() ?? [])} />

                <Live canvasRef={canvasRef} undo={undo} redo={redo} />

                <RightSidebar
                    elementAttributes={elementAttributes}
                    setElementAttributes={setElementAttributes}
                    fabricRef={fabricRef}
                    isEditingRef={isEditingRef}
                    activeObjectRef={activeObjectRef}
                    syncShapeInStorage={syncShapeInStorage}
                />
            </section>
        </main>
    );
};

export default Home;
