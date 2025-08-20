"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  useMyPresence,
  useOthers,
} from "../liveblocks.config";
import { useEventListener,useBroadcastEvent } from "@liveblocks/react/suspense";

import useInterval from "@/hooks/useInterval";
import { CursorMode, type CursorState, type Reaction, type ReactionEvent } from "@/types/type";
import { shortcuts } from "@/constants";

import { Comments } from "./comments/Comments";
import { CursorChat, FlyingReaction, LiveCursors, ReactionSelector } from "./index";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";

type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  undo: () => void;
  redo: () => void;
};

const Live: React.FC<Props> = ({ canvasRef, undo, redo }) => {
  // Other users in the room
  const others = useOthers();

  // My presence (typed by your liveblocks.config generics)
  // We assume presence has { cursor: {x,y} | null; message?: string }
  const [{ cursor }, updateMyPresence] = useMyPresence() as unknown as [
    { cursor: { x: number; y: number } | null; message?: string },
    (patch: Partial<{ cursor: { x: number; y: number } | null; message?: string }>) => void
  ];

  const broadcast = useBroadcastEvent();

  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [cursorState, setCursorState] = useState<CursorState>({ mode: CursorMode.Hidden });

  // choose a reaction emoji
  const setReaction = useCallback((reaction: string) => {
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  // periodically drop expired reactions (older than 4s)
  useInterval(() => {
    const cutoff = Date.now() - 4000;
    setReactions((prev) => prev.filter((r) => r.timestamp > cutoff));
  }, 1000);

  // while pressed in Reaction mode, emit & show reactions
  useInterval(() => {
    if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
      const newItem: Reaction = {
        point: { x: cursor.x, y: cursor.y },
        value: cursorState.reaction,
        timestamp: Date.now(),
      };
      setReactions((prev) => prev.concat([newItem]));
      broadcast({
          x: newItem.point.x, y: newItem.point.y, value: newItem.value,
          type: "REACTION"
      });
    }
  }, 100);

  // listen for other users' reaction events
  useEventListener((eventData) => {
    const event = eventData.event as ReactionEvent;
    setReactions((prev) =>
      prev.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ])
    );
  });

  // keyboard shortcuts
  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "/") {
        setCursorState({ mode: CursorMode.Chat, previousMessage: null, message: "" });
      } else if (e.key === "Escape") {
        updateMyPresence({ message: "" }); // prefer empty string over null
        setCursorState({ mode: CursorMode.Hidden });
      } else if (e.key === "e") {
        setCursorState({ mode: CursorMode.ReactionSelector });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") e.preventDefault();
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence]);

  // pointer move -> update my cursor (unless reaction selector is open)
  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      if (cursorState.mode === CursorMode.ReactionSelector) return;

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.x;
      const y = event.clientY - rect.y;

      updateMyPresence({ cursor: { x, y } });
    },
    [cursorState.mode, updateMyPresence]
  );

  // leave -> hide cursor & clear message
  const handlePointerLeave = useCallback(() => {
    setCursorState({ mode: CursorMode.Hidden });
    updateMyPresence({ cursor: null, message: "" });
  }, [updateMyPresence]);

  // down -> update position & start reaction press if in Reaction mode
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.x;
      const y = event.clientY - rect.y;
      updateMyPresence({ cursor: { x, y } });

      setCursorState((prev) =>
        prev.mode === CursorMode.Reaction ? { ...prev, isPressed: true } : prev
      );
    },
    [updateMyPresence]
  );

  // up -> stop reaction press
  const handlePointerUp = useCallback(() => {
    setCursorState((prev) =>
      prev.mode === CursorMode.Reaction ? { ...prev, isPressed: false } : prev
    );
  }, []);

  // context menu actions
  const handleContextMenuClick = useCallback(
    (key: string) => {
      switch (key) {
        case "Chat":
          setCursorState({ mode: CursorMode.Chat, previousMessage: null, message: "" });
          break;
        case "Reactions":
          setCursorState({ mode: CursorMode.ReactionSelector });
          break;
        case "Undo":
          undo();
          break;
        case "Redo":
          redo();
          break;
        default:
          break;
      }
    },
    [redo, undo]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className="relative flex h-full w-full flex-1 items-center justify-center"
        id="canvas"
        style={{ cursor: cursorState.mode === CursorMode.Chat ? "none" : "auto" }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <canvas ref={canvasRef} />

        {/* Flying emoji bursts */}
        {reactions.map((r) => (
          <FlyingReaction
            key={`${r.timestamp}-${r.value}`}
            x={r.point.x}
            y={r.point.y}
            timestamp={r.timestamp}
            value={r.value}
          />
        ))}

        {/* Chat bubble at my cursor */}
        {cursor && (
          <CursorChat
            cursor={cursor}
            cursorState={cursorState}
            setCursorState={setCursorState}
            updateMyPresence={updateMyPresence}
          />
        )}

        {/* Emoji picker */}
        {cursorState.mode === CursorMode.ReactionSelector && (
          <ReactionSelector setReaction={setReaction} />
        )}

        {/* Other users' cursors */}
        <LiveCursors others={others} />

        {/* Threaded comments */}
        <Comments />
      </ContextMenuTrigger>

      <ContextMenuContent className="right-menu-content">
        {shortcuts.map((item) => (
          <ContextMenuItem
            key={item.key}
            className="right-menu-item"
            onClick={() => handleContextMenuClick(item.name)}
          >
            <p>{item.name}</p>
            <p className="text-xs text-primary-grey-300">{item.shortcut}</p>
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default Live;
