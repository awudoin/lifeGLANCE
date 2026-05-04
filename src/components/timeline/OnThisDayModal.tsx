import { useRef } from "react";
import type { FrontendMilestone } from "../../data/types";
import { useOutsideAlerter } from "../../hooks/useOutsideAlerter";
import { formatDateDisplay } from "../../utils/dates";

interface Props {
    items: FrontendMilestone[];
    onClose: () => void;
    onSelect: (item: FrontendMilestone) => void;
}

export default function OnThisDayModal({ items, onClose, onSelect }: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);
    useOutsideAlerter({ ref: overlayRef, callback: onClose });

    const today = new Date();
    const todayYear = today.getFullYear();

    return (
        // <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="sheet-overlay" ref={overlayRef}>
            <div className="sheet">
                <div className="sheet-header">
                    <span className="sheet-title">on this day</span>
                    <button type="button" className="sheet-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="otd-list">
                    {items.map((m) => {
                        const yearsAgo = todayYear - new Date(m.date).getFullYear();
                        return (
                            <button type="button" key={m.id} className="otd-item" onClick={() => onSelect(m)}>
                                <div className="otd-dot" style={{ background: m.color }} />
                                <div className="otd-content">
                                    <div className="otd-title">{m.title}</div>
                                    <div className="otd-meta">
                                        {formatDateDisplay(m.date, m.date_precision)}
                                        {yearsAgo > 0 && (
                                            <span className="otd-years">
                                                {" "}
                                                · {yearsAgo} year{yearsAgo !== 1 ? "s" : ""} ago
                                            </span>
                                        )}
                                        {m.date_precision === "month" && <span className="otd-approx"> (approx.)</span>}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
