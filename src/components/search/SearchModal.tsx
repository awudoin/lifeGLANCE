import { useEffect, useRef, useState } from "react";
import type { FrontendMilestone } from "../../data/types";
import { useOutsideAlerter } from "../../hooks/useOutsideAlerter";
import { formatDateDisplay, relativeLabel } from "../../utils/dates";

interface Props {
    milestones: FrontendMilestone[];
    onSelect: (milestone: FrontendMilestone) => void;
    onClose: () => void;
}

export default function SearchModal({ milestones, onSelect, onClose }: Props) {
    const [query, setQuery] = useState("");
    const [highlighted, setHighlighted] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    useOutsideAlerter({ ref: overlayRef, callback: onClose });

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const trimmed = query.trim().toLowerCase();
    const results = trimmed
        ? milestones
              .filter((m) => m.title.toLowerCase().includes(trimmed) || m.note?.toLowerCase().includes(trimmed))
              .slice(0, 8)
        : [];

    useEffect(() => {
        setHighlighted(results.length > 0 ? 0 : -1);
    }, [results]);

    function handleKeyDown(e) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            if (results[highlighted]) onSelect(results[highlighted]);
        } else if (e.key === "Escape") {
            onClose();
        }
    }

    return (
        // <div className="search-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="search-overlay" ref={overlayRef}>
            <div className="search-palette">
                <div className="search-input-row">
                    <span className="search-prompt">›</span>
                    <input
                        ref={inputRef}
                        className="search-input"
                        placeholder="search milestones..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {query && (
                        <button
                            type="button"
                            className="search-clear"
                            onClick={() => {
                                setQuery("");
                                inputRef.current?.focus();
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {results.length > 0 && (
                    <div className="search-results">
                        {results.map((m, i) => (
                            // <div
                            <button
                                type="button"
                                key={m.id}
                                className={`search-result ${i === highlighted ? "active" : ""}`}
                                onClick={() => onSelect(m)}
                                onMouseEnter={() => setHighlighted(i)}
                            >
                                <div className="search-result-dot" style={{ background: m.color }} />
                                <div className="search-result-body">
                                    <span className="search-result-title">{m.title}</span>
                                    <span className="search-result-meta">
                                        {formatDateDisplay(m.date, m.date_precision)}
                                        <span className="search-result-sep">·</span>
                                        {relativeLabel(m.date, m.date_precision)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {trimmed && results.length === 0 && <div className="search-empty">no results</div>}
            </div>
        </div>
    );
}
