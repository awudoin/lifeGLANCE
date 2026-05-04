// Source - https://stackoverflow.com/a/42234988
// Posted by Ben Bud, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-02, License - CC BY-SA 4.0

import { useEffect } from "react";

/**
 * Hook that alerts clicks outside of the passed ref
 */

interface Props {
    ref: React.RefObject<HTMLElement | null>;
    callback: () => void;
}
export const useOutsideAlerter = ({ ref, callback }: Props) => {
    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && ref.current === event.target) {
                callback();
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
};
