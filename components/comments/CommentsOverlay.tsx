"use client";

import { useCallback, useRef } from "react";
import {
  useThreads,
  useUser,
  useEditThreadMetadata,
} from "@liveblocks/react/suspense"; // or "/suspense" if you’re using Suspense
import type { ThreadMetadata } from "@/liveblocks.config";
import {  type ThreadData } from "@liveblocks/client"

import { useMaxZIndex } from "@/lib/useMaxZIndex";
import { PinnedThread } from "./PinnedThread";

type OverlayThreadProps = {
  thread: ThreadData<ThreadMetadata>;   // ✅ use ThreadData here
  maxZIndex: number;
};

export function CommentsOverlay() {
  const { threads = [] } = useThreads();
  const maxZIndex = useMaxZIndex();

  return (
    <div>
      {threads
        .filter((t) => !(t.metadata as ThreadMetadata).resolved)
        .map((t) => (
          <OverlayThread
            key={t.id}
            thread={t as ThreadData<ThreadMetadata>}  // ✅ cast if needed
            maxZIndex={maxZIndex}
          />
        ))}
    </div>
  );
}

function OverlayThread({ thread, maxZIndex }: OverlayThreadProps) {
  const editThreadMetadata = useEditThreadMetadata();
  const firstCommentUserId = thread.comments[0]?.userId;
  const { isLoading } = useUser(firstCommentUserId);

  const threadRef = useRef<HTMLDivElement>(null);

  const handleIncreaseZIndex = useCallback(() => {
    if (thread.metadata.zIndex === maxZIndex) return;
    editThreadMetadata({
      threadId: thread.id,
      metadata: { zIndex: maxZIndex + 1 },
    });
  }, [editThreadMetadata, maxZIndex, thread.id, thread.metadata.zIndex]);

  if (isLoading) return null;

  return (
    <div
      ref={threadRef}
      id={`thread-${thread.id}`}
      className="absolute left-0 top-0 flex gap-5"
      style={{
        transform: `translate(${thread.metadata.x}px, ${thread.metadata.y}px)`,
        zIndex: thread.metadata.zIndex,
      }}
    >
      <PinnedThread thread={thread} onFocus={handleIncreaseZIndex} />
    </div>
  );
}
