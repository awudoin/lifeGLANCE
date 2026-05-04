import { type NextFunction, type Request, type Response, Router } from "express";
import { listCategories, replaceCategories } from "../repos/categoryRepo.js";
import type { CategoryInput } from "../types.js";

export const categoryRouter: Router = Router();

function isCategoryInput(value: unknown): value is CategoryInput {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.id === "string" &&
        typeof candidate.label === "string" &&
        typeof candidate.color === "string"
    );
}

categoryRouter.get(
    "/categories",
    async (_request: Request, response: Response, next: NextFunction) => {
        try {
            response.json(await listCategories());
        } catch (error) {
            next(error);
        }
    },
);

categoryRouter.put(
    "/categories",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            if (!Array.isArray(request.body) || !request.body.every(isCategoryInput)) {
                response.status(400).json({
                    error: "invalid_body",
                    message: "Category payload must be an array of categories.",
                });
                return;
            }

            response.json(await replaceCategories(request.body));
        } catch (error) {
            next(error);
        }
    },
);
