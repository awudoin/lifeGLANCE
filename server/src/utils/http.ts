import type { Response } from "express";

export function sendNotImplemented(response: Response, feature: string): void {
  response.status(501).json({
    error: "not_implemented",
    message: `${feature} is planned but not implemented yet.`,
  });
}
