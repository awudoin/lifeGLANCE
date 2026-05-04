import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { config } from "./config.js";
import { backupRouter } from "./routes/backup.js";
import { bootstrapRouter } from "./routes/bootstrap.js";
import { categoryRouter } from "./routes/categories.js";
import { mediaRouter } from "./routes/media.js";
import { migrationRouter } from "./routes/migrations.js";
import { milestoneRouter } from "./routes/milestones.js";
import { settingRouter } from "./routes/settings.js";

export function createApp(): Express {
    const app: Express = express();

    app.use(cors({ origin: config.corsOrigin }));
    app.use(express.json({ limit: "100mb" }));

    app.get("/api/health", (_request: Request, response: Response) => {
        response.json({ ok: true });
    });

    app.use("/api", bootstrapRouter);
    app.use("/api", milestoneRouter);
    app.use("/api", categoryRouter);
    app.use("/api", settingRouter);
    app.use("/api", mediaRouter);
    app.use("/api", migrationRouter);
    app.use("/api", backupRouter);

    app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
        console.error(error);
        response.status(500).json({
            error: "internal_error",
            message: "The server encountered an unexpected error.",
        });
    });

    return app;
}
