import { LiveCursorProps } from "@/types/type";
import Cursor from "./Cursor";
import { COLORS } from "@/constants";

const LiveCursor = ({ others }: LiveCursorProps) => {
  return others.map(({ connectionId, presence }) => {
    if (!presence || !presence.cursor) return null;

    const { x, y } = presence.cursor;
    return (
      <Cursor
        key={connectionId}
        color={COLORS[presence.color ?? 0]}
        x={x}
        y={y}
        message=""
      />
    );
  });
};

export default LiveCursor
