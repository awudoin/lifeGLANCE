import { useRef, useState } from "react";
import type { FrontendMilestone } from "../../data/types";
import { formatDateDisplay } from "../../utils/dates";
import AnimatedRelLabel from "../ui/AnimatedRelLabel";
import TypewriterText from "../ui/TypewriterText";

interface StatMilestoneProps {
    m: FrontendMilestone;
    align: "left" | "right";
}

function StatMilestone({ m, align }: StatMilestoneProps) {
    const dateStr = formatDateDisplay(m.date, m.date_precision);
    const k = m.id + (m.updated_at || "");

    // Only show the animated label after the date typewriter finishes.
    // Tracking the key (not a boolean) means it resets instantly when the
    // milestone changes — no stale flash between navigating.
    const [readyForKey, setReadyForKey] = useState<string | null>(null);
    const labelReady = readyForKey === k;

    return (
        <div className={`stat-milestone ${align === "right" ? "stat-milestone-right" : ""}`}>
            <div className="stat-milestone-title">
                <TypewriterText
                    key={`${k}title`}
                    text={m.title}
                    options={{ delay: 18, jitter: 10 }}
                    showCursor={false}
                />
            </div>
            <div className="stat-milestone-date">
                <TypewriterText
                    key={`${k}date`}
                    text={dateStr}
                    options={{ delay: 14, jitter: 6, startDelay: 180 }}
                    showCursor={false}
                    onDone={() => setReadyForKey(k)}
                />
            </div>
            <div className="stat-milestone-rel">
                {labelReady && <AnimatedRelLabel key={k} dateStr={m.date} />}
            </div>
        </div>
    );
}

// flip=true for past panel: ← goes to higher idx (older), → goes to lower idx (more recent)
interface NavRowProps {
    idx: number;
    total: number;
    onChange: (index: number) => void;
    align: "left" | "right";
    flip?: boolean;
}

function NavRow({ idx, total, onChange, align, flip = false }: NavRowProps) {
    if (total <= 1) return null;
    const prev = flip ? (idx + 1) % total : (idx - 1 + total) % total;
    const next = flip ? (idx - 1 + total) % total : (idx + 1) % total;
    return (
        <div className={`stat-nav-row ${align === "right" ? "stat-nav-row-right" : ""}`}>
            <button type="button" className="stat-nav-btn" onClick={() => onChange(prev)}>
                ←
            </button>
            <span className="stat-nav-pos">
                {idx + 1}/{total}
            </span>
            <button type="button" className="stat-nav-btn" onClick={() => onChange(next)}>
                →
            </button>
        </div>
    );
}

interface StatsPanelProps {
    past: FrontendMilestone[];
    future: FrontendMilestone[];
    pastIdx: number;
    futureIdx: number;
    onPastChange: (index: number) => void;
    onFutureChange: (index: number) => void;
    viewMode?: "all" | "past" | "future";
    compact?: boolean;
}

export default function StatsPanel({
    past,
    future,
    pastIdx,
    futureIdx,
    onPastChange,
    onFutureChange,
    viewMode = "all",
    compact = false,
}: StatsPanelProps) {
    const pastSwipeX = useRef<number | null>(null);
    const futureSwipeX = useRef<number | null>(null);
    const [pastOpen, setPastOpen] = useState(false);
    const [futureOpen, setFutureOpen] = useState(false);
    const SWIPE = 40; // min px to register a swipe

    const showPast = viewMode !== "future";
    const showFuture = viewMode !== "past";

    if (compact) {
        return (
            <div
                className="stat-panels"
                style={viewMode === "future" ? { justifyContent: "flex-end" } : undefined}
            >
                {showPast && (
                    <div className="stat-pill-wrap">
                        <button
                            type="button"
                            className={`stat-pill${pastOpen ? " stat-pill-active" : ""}`}
                            onClick={() => setPastOpen((o) => !o)}
                        >
                            ← past
                        </button>
                        {pastOpen && (
                            <div
                                className="stat-panel stat-panel-popup"
                                onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    if (touch) pastSwipeX.current = touch.clientX;
                                }}
                                onTouchEnd={(e) => {
                                    if (pastSwipeX.current === null || past.length <= 1) return;
                                    const touch = e.changedTouches[0];
                                    if (!touch) return;
                                    const dx = touch.clientX - pastSwipeX.current;
                                    if (dx < -SWIPE) onPastChange((pastIdx + 1) % past.length);
                                    else if (dx > SWIPE)
                                        onPastChange((pastIdx - 1 + past.length) % past.length);
                                    pastSwipeX.current = null;
                                }}
                            >
                                <div className="stat-panel-count">
                                    {past.length} milestone
                                    {past.length !== 1 ? "s" : ""}
                                </div>
                                <NavRow
                                    idx={pastIdx}
                                    total={past.length}
                                    onChange={onPastChange}
                                    align="left"
                                    flip
                                />
                                {past[pastIdx] && <StatMilestone m={past[pastIdx]} align="left" />}
                            </div>
                        )}
                    </div>
                )}
                {showFuture && (
                    <div className="stat-pill-wrap stat-pill-wrap-right">
                        <button
                            type="button"
                            className={`stat-pill${futureOpen ? " stat-pill-active" : ""}`}
                            onClick={() => setFutureOpen((o) => !o)}
                        >
                            future →
                        </button>
                        {futureOpen && (
                            <div
                                className="stat-panel stat-panel-right stat-panel-popup"
                                onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    if (touch) futureSwipeX.current = touch.clientX;
                                }}
                                onTouchEnd={(e) => {
                                    if (futureSwipeX.current === null || future.length <= 1) return;
                                    const touch = e.changedTouches[0];
                                    if (!touch) return;
                                    const dx = touch.clientX - futureSwipeX.current;
                                    if (dx < -SWIPE)
                                        onFutureChange((futureIdx + 1) % future.length);
                                    else if (dx > SWIPE)
                                        onFutureChange(
                                            (futureIdx - 1 + future.length) % future.length,
                                        );
                                    futureSwipeX.current = null;
                                }}
                            >
                                <div className="stat-panel-count">
                                    {future.length} milestone
                                    {future.length !== 1 ? "s" : ""}
                                </div>
                                <NavRow
                                    idx={futureIdx}
                                    total={future.length}
                                    onChange={onFutureChange}
                                    align="right"
                                />
                                {future[futureIdx] && (
                                    <StatMilestone m={future[futureIdx]} align="right" />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="stat-panels"
            style={viewMode === "future" ? { justifyContent: "flex-end" } : undefined}
        >
            {/* Left — past */}
            {showPast && (
                <div
                    className="stat-panel"
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        if (touch) pastSwipeX.current = touch.clientX;
                    }}
                    onTouchEnd={(e) => {
                        if (pastSwipeX.current === null || past.length <= 1) return;
                        const touch = e.changedTouches[0];
                        if (!touch) return;
                        const dx = touch.clientX - pastSwipeX.current;
                        // swipe left = older (higher idx); swipe right = more recent (lower idx)
                        if (dx < -SWIPE) onPastChange((pastIdx + 1) % past.length);
                        else if (dx > SWIPE)
                            onPastChange((pastIdx - 1 + past.length) % past.length);
                        pastSwipeX.current = null;
                    }}
                >
                    <div className="stat-panel-label">← past</div>
                    <div className="stat-panel-count">
                        {past.length} milestone{past.length !== 1 ? "s" : ""}
                    </div>
                    <NavRow
                        idx={pastIdx}
                        total={past.length}
                        onChange={onPastChange}
                        align="left"
                        flip
                    />
                    {past[pastIdx] && <StatMilestone m={past[pastIdx]} align="left" />}
                </div>
            )}

            {/* Right — future */}
            {showFuture && (
                <div
                    className="stat-panel stat-panel-right"
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        if (touch) futureSwipeX.current = touch.clientX;
                    }}
                    onTouchEnd={(e) => {
                        if (futureSwipeX.current === null || future.length <= 1) return;
                        const touch = e.changedTouches[0];
                        if (!touch) return;
                        const dx = touch.clientX - futureSwipeX.current;
                        // swipe left = further future (higher idx); swipe right = nearer (lower idx)
                        if (dx < -SWIPE) onFutureChange((futureIdx + 1) % future.length);
                        else if (dx > SWIPE)
                            onFutureChange((futureIdx - 1 + future.length) % future.length);
                        futureSwipeX.current = null;
                    }}
                >
                    <div className="stat-panel-label">future →</div>
                    <div className="stat-panel-count">
                        {future.length} milestone
                        {future.length !== 1 ? "s" : ""}
                    </div>
                    <NavRow
                        idx={futureIdx}
                        total={future.length}
                        onChange={onFutureChange}
                        align="right"
                    />
                    {future[futureIdx] && <StatMilestone m={future[futureIdx]} align="right" />}
                </div>
            )}
        </div>
    );
}
