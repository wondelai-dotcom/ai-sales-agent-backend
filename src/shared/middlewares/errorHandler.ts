import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details ?? null },
    });
  }
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "I dati inviati non sono validi",
        details: err.issues.map((issue) => ({ path: issue.path, message: issue.message })),
      },
    });
  }
  // Do not log request bodies, authorization headers, cookies, or token values.
  console.error("Unhandled request error", {
    method: req.method,
    path: req.path,
    errorName: err instanceof Error ? err.name : "UnknownError",
    errorMessage: err instanceof Error ? err.message : "Unknown error",
  });
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Errore interno del server" },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Risorsa non trovata" } });
}
