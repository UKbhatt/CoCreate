// useMaxZIndex.ts
import { useMemo } from "react";
import { useThreads } from "@liveblocks/react/suspense"; // or "@/liveblocks.config"

// Minimal shape we actually need
type MinimalThread = { metadata?: { zIndex?: number } };

export const useMaxZIndex = () => {
  // make threads always iterable + typed to our minimal shape
  const { threads } = useThreads() as { threads?: MinimalThread[] };
  const list = threads ?? [];

  return useMemo(() => {
    let max = 0;
    for (const t of list) {
      const z = Number(t?.metadata?.zIndex ?? 0);
      if (z > max) max = z;
    }
    return max;
  }, [list]);
};
