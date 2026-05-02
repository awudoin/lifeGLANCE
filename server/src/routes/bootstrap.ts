import { Router, type Request, type Response, type NextFunction } from "express";
import { loadBootstrap } from "../repos/bootstrapRepo.js";

export const bootstrapRouter: Router = Router();

bootstrapRouter.get("/bootstrap", async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const payload = await loadBootstrap();
    response.json(payload);
  } catch (error) {
    next(error);
  }
});
