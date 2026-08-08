export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthorized(message = "Non autorizzato") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Accesso negato") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(message = "Risorsa non trovata") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static conflict(message = "Conflitto sulla risorsa") {
    return new AppError(message, 409, "CONFLICT");
  }

  static validation(message = "Dati non validi", details?: unknown) {
    return new AppError(message, 422, "VALIDATION_ERROR", details);
  }
}
