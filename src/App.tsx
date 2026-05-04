import { useEffect, useRef, useState } from "react";
import Onboarding from "./components/onboarding/Onboarding";
import TimelineView from "./components/timeline/TimelineView";
import { fetchBootstrap } from "./data/bootstrapApi";
import { initDB } from "./data/db";
import {
    clearLocalMigrationPromptDismissal,
    collectLocalMigrationBundle,
    dismissLocalMigrationPrompt,
    isLocalMigrationPromptDismissed,
} from "./data/localMigration";
import { fetchLocalMigrationStatus, importLocalMigrationBundle } from "./data/migrationApi";
import { loadMilestones } from "./data/milestones";
import type { FrontendMilestone } from "./data/types";

export default function App() {
    const [screen, setScreen] = useState("loading"); // loading | onboarding | timeline
    const [milestones, setMilestones] = useState<FrontendMilestone[]>([]);
    const [portraitWarn, setPortraitWarn] = useState(
        () => window.matchMedia("(orientation: portrait) and (max-width: 1024px)").matches,
    );
    const migrationCheckedRef = useRef(false);

    useEffect(() => {
        const mq = window.matchMedia("(orientation: portrait) and (max-width: 1024px)");
        const handler = (e: MediaQueryListEvent) => setPortraitWarn(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        initDB()
            .then(() => {
                navigator.storage?.persist?.();
                return loadMilestones();
            })
            .then((all) => {
                setMilestones(all);
                setScreen(all.length === 0 ? "onboarding" : "timeline");
            })
            .catch((err) => {
                console.error("App bootstrap failed:", err);
                setScreen("onboarding");
            });
    }, []);

    useEffect(() => {
        if (screen === "loading" || migrationCheckedRef.current) return;
        migrationCheckedRef.current = true;

        void (async () => {
            try {
                if (isLocalMigrationPromptDismissed()) return;

                const [{ bundle, hasData }, status, bootstrap] = await Promise.all([
                    collectLocalMigrationBundle(),
                    fetchLocalMigrationStatus(),
                    fetchBootstrap(),
                ]);

                if (!hasData || status.completed || bootstrap.milestones.length > 0) return;

                const shouldImport = window.confirm(
                    "Import your existing browser-stored lifeGLANCE data into the new backend now? This is a one-time migration for milestones, media, categories, and settings.",
                );
                if (!shouldImport) {
                    dismissLocalMigrationPrompt();
                    return;
                }

                await importLocalMigrationBundle(bundle);
                clearLocalMigrationPromptDismissal();
                const all = await loadMilestones();
                setMilestones(all);
                setScreen(all.length === 0 ? "onboarding" : "timeline");
            } catch (error) {
                console.error("Local migration check failed:", error);
            }
        })();
    }, [screen]);

    function handleOnboardingComplete(initial: FrontendMilestone[]) {
        setMilestones(initial);
        setScreen("timeline");
    }

    const content =
        screen === "loading" ? (
            <div className="app-loading">
                <span
                    className="cursor"
                    style={{ width: "8px", height: "8px", borderRadius: "50%" }}
                />
            </div>
        ) : screen === "onboarding" ? (
            <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
            <TimelineView milestones={milestones} setMilestones={setMilestones} />
        );

    return (
        <>
            {content}
            {portraitWarn && (
                <div className="portrait-overlay">
                    <div className="logo">
                        <span className="logo-life">life</span>
                        <span className="logo-glance">GLANCE</span>
                    </div>
                    <div className="portrait-rotate-icon">↺</div>
                    <div className="portrait-message">
                        please rotate your device
                        <br />
                        for the best experience
                    </div>
                </div>
            )}
        </>
    );
}
