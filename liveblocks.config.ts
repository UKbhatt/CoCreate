// liveblocks.config.ts
import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

/** Presence broadcast (what changes in real time per user) */
type Presence = {
  cursor: { x: number; y: number } | null;
  message?: string;
};

/** Shared persistent storage in the room */
type Storage = {
  // Map<objectId, fabricJSON>
  canvasObjects: LiveMap<string, any>;
};

/** Optional static user info (from your auth backend, if any) */
type UserMeta = {
  id?: string;
  info?: { name?: string; avatar?: string };
};

/** Optional custom events */
type RoomEvent =
  | { type: "REACTION"; x: number; y: number; value: string }
  | { type: "CHAT"; message: string };

/** If you use Comments, thread metadata lives here */
export type ThreadMetadata = {
  resolved: boolean;
  zIndex: number;
  time?: number;
  x: number;
  y: number;
};

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
  throttle: 16,
});

/** Core Liveblocks hooks/context */
const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useStorage,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useMutation,
  useStatus,
  useLostConnectionListener,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client);

export {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useStorage,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useMutation,
  useStatus,
  useLostConnectionListener,
  LiveMap, 
};
