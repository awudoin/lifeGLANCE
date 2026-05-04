import { type NextFunction, type Request, type Response, Router } from "express";
import {
    createMilestone,
    deleteMilestoneById,
    deleteMilestonesByRecurrenceId,
    listMilestones,
    replaceAllMilestones,
    updateMilestone,
} from "../repos/milestoneRepo.js";
import type { RestoreMilestoneBody, UpsertMilestoneBody } from "../types.js";
import { sendNotImplemented } from "../utils/http.js";

export const milestoneRouter: Router = Router();

function getSingleParam(value: string | string[] | undefined): string | null {
    return typeof value === "string" ? value : null;
}

function isUpsertMilestoneBody(value: unknown): value is UpsertMilestoneBody {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate: Record<string, unknown> = value as Record<string, unknown>;
    return (
        typeof candidate.title === "string" &&
        typeof candidate.date === "string" &&
        typeof candidate.datePrecision === "string" &&
        typeof candidate.direction === "string" &&
        typeof candidate.categoryId === "string" &&
        typeof candidate.color === "string"
    );
}

function isRestoreMilestoneBody(value: unknown): value is RestoreMilestoneBody {
    if (!isUpsertMilestoneBody(value)) {
        return false;
    }

    const candidate: Record<string, unknown> = value as unknown as Record<string, unknown>;
    const hasValidId = candidate.id === undefined || typeof candidate.id === "string";
    const hasValidCreatedAt =
        candidate.createdAt === undefined || typeof candidate.createdAt === "string";
    const hasValidUpdatedAt =
        candidate.updatedAt === undefined || typeof candidate.updatedAt === "string";

    return hasValidId && hasValidCreatedAt && hasValidUpdatedAt;
}

milestoneRouter.get(
    "/milestones",
    async (_request: Request, response: Response, next: NextFunction) => {
        try {
            response.json(await listMilestones());
        } catch (error) {
            next(error);
        }
    },
);

milestoneRouter.post(
    "/milestones",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            if (!isUpsertMilestoneBody(request.body)) {
                response.status(400).json({
                    error: "invalid_body",
                    message: "Milestone payload is invalid.",
                });
                return;
            }

            const milestone = await createMilestone(request.body);
            response.status(201).json(milestone);
        } catch (error) {
            next(error);
        }
    },
);

milestoneRouter.put(
    "/milestones/:id",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const milestoneId = getSingleParam(request.params.id);
            if (!milestoneId) {
                response.status(400).json({
                    error: "invalid_param",
                    message: "Milestone id is required.",
                });
                return;
            }

            if (!isUpsertMilestoneBody(request.body)) {
                response.status(400).json({
                    error: "invalid_body",
                    message: "Milestone payload is invalid.",
                });
                return;
            }

            const milestone = await updateMilestone(milestoneId, request.body);
            if (!milestone) {
                response.status(404).json({
                    error: "not_found",
                    message: "Milestone was not found.",
                });
                return;
            }

            response.json(milestone);
        } catch (error) {
            next(error);
        }
    },
);

milestoneRouter.delete(
    "/milestones/:id",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const milestoneId = getSingleParam(request.params.id);
            if (!milestoneId) {
                response.status(400).json({
                    error: "invalid_param",
                    message: "Milestone id is required.",
                });
                return;
            }

            const deleted = await deleteMilestoneById(milestoneId);
            if (!deleted) {
                response.status(404).json({
                    error: "not_found",
                    message: "Milestone was not found.",
                });
                return;
            }

            response.status(204).send();
        } catch (error) {
            next(error);
        }
    },
);

milestoneRouter.delete(
    "/recurrences/:recurrenceId",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const recurrenceId = getSingleParam(request.params.recurrenceId);
            if (!recurrenceId) {
                response.status(400).json({
                    error: "invalid_param",
                    message: "Recurrence id is required.",
                });
                return;
            }

            const deletedCount = await deleteMilestonesByRecurrenceId(recurrenceId);
            response.json({ deletedCount });
        } catch (error) {
            next(error);
        }
    },
);

milestoneRouter.post("/milestones/import/ics", (_request: Request, response: Response) => {
    sendNotImplemented(response, "ICS import");
});

milestoneRouter.post(
    "/milestones/restore",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            if (!Array.isArray(request.body) || !request.body.every(isRestoreMilestoneBody)) {
                response.status(400).json({
                    error: "invalid_body",
                    message: "Restore payload must be an array of milestones.",
                });
                return;
            }

            response.json(await replaceAllMilestones(request.body));
        } catch (error) {
            next(error);
        }
    },
);
