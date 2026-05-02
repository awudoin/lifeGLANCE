import { Router, type NextFunction, type Request, type Response } from "express";
import { listSettings, replaceSettings } from "../repos/settingRepo.js";
import type { SettingInput } from "../types.js";

export const settingRouter: Router = Router();

function isSettingInput(value: unknown): value is SettingInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.key === "string" && typeof candidate.value === "string";
}

settingRouter.get("/settings", async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.json(await listSettings());
  } catch (error) {
    next(error);
  }
});

settingRouter.put("/settings", async (request: Request, response: Response, next: NextFunction) => {
  try {
    if (!Array.isArray(request.body) || !request.body.every(isSettingInput)) {
      response.status(400).json({ error: "invalid_body", message: "Settings payload must be an array of settings." });
      return;
    }

    response.json(await replaceSettings(request.body));
  } catch (error) {
    next(error);
  }
});
