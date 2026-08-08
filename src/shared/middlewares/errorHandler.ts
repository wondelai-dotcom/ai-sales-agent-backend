import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

// Middleware centralizzato di gestione errori.
// Ogni modulo lancia AppError (o subclass) invece di rispondere direttamente:
// questo mantiene i controller sottili e il formato di errore uniforme su tutte le API.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details ?? null },
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Errore interno del server" },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `Route non trovata: ${req.method} ${req.path}` } });
}
