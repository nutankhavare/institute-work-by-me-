import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Global error handling middleware
 * Should be used as the last middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  console.error("[ERROR]", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
    return;
  }

  // Handle PostgreSQL errors
  if ((err as any).code === "UNIQUE_VIOLATION") {
    res.status(409).json({
      success: false,
      error: "Duplicate record",
      details: (err as any).detail,
    });
    return;
  }

  if ((err as any).code === "FOREIGN_KEY_VIOLATION") {
    res.status(422).json({
      success: false,
      error: "Invalid reference",
      details: (err as any).detail,
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};

/**
 * Not found handler middleware
 * Should be used before the error handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
};
