import { CursorChatProps } from "@/types/type";
import { CursorMode } from "@/types/type";
import CursorSVG from "@/public/assets/CursorSVG";

// {cursorState.previousMessage && (
//                         <div>{cursorState.previousMessage}</div>
//                     )}

const CursorChat = (
    { cursor, cursorState, setCursorState, updateMyPresence }: CursorChatProps
) => {
    return (
        <div className="absolute top-0 left-0" style={
            { transform: `traslatex(${cursor.x}px) translateY(${cursor.y}px)` }}>
            {cursorState.mode === CursorMode.Chat && (
                <>
                    <CursorSVG color="#000" />
                    <div className="absolute left-2 top-5
                 bg-blue-500 px-4 py-2 text-sm leading-relaxed
                  text-white rounded-[20px]">
                    {cursorState.previousMessage && (
                        <div>{cursorState.previousMessage}</div>
                    )}
                    <input type="text" />
                    </div>
                </>
            )}
        </div>
    )
}

export default CursorChat; 