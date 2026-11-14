import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 does not automatically forward rejected promises returned by
 * async route handlers. Preserve each controller's request subtype while
 * adapting it to an Express RequestHandler.
 */
export function asyncHandler<TRequest extends Request = Request>(
  handler: (req: TRequest, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as TRequest, res, next)).catch(next);
  };
}
