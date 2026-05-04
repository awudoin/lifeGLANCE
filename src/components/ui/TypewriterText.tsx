import { useEffect, useRef } from "react";
import { playKeyClick } from "../../utils/audio";
import { type TypewriterOptions, useTypewriter } from "../../utils/typewriter";

interface TypewriterTextProps {
    text: string;
    className?: string;
    options?: TypewriterOptions;
    showCursor?: boolean;
    hideCursorWhenDone?: boolean;
    onDone?: () => void;
    playSound?: boolean;
}

/**
 * Renders text with a typewriter effect.
 * `showCursor` keeps the blinking cursor visible after typing completes.
 * `hideCursorWhenDone` hides the cursor once typing finishes.
 * `playSound` fires a soft key-click for each character typed.
 */
export default function TypewriterText({
    text,
    className = "",
    options = {},
    showCursor = true,
    hideCursorWhenDone = false,
    onDone,
    playSound = false,
}: TypewriterTextProps) {
    const { displayed, done } = useTypewriter(text, options);
    const prevLenRef = useRef(0);

    useEffect(() => {
        if (done && onDone) onDone();
    }, [done, onDone]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (playSound && displayed.length > prevLenRef.current) {
            playKeyClick();
        }
        prevLenRef.current = displayed.length;
    }, [displayed, playSound]); // eslint-disable-line react-hooks/exhaustive-deps

    const cursorVisible = showCursor && !(hideCursorWhenDone && done);

    return (
        <span className={className}>
            {displayed}
            {cursorVisible && <span className="cursor" />}
        </span>
    );
}
