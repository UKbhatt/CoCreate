"use client";
import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
const ApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ;

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={ApiKey!}>
      <RoomProvider id="my-room">
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}