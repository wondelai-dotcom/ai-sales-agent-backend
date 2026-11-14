import { NextFunction, Request, Response, RequestHandler } from "express";

/**
 * Express 4 does not automatically forward rejected promises returned by
 * async route handlers. Wrap every async controller so failures reach the
 * centralized error handler instead of becoming unhandled rejections.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
