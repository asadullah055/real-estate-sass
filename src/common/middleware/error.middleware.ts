import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ValidationError } from '../errors/ValidationError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { logger } from '../../config/logger.js';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) logger.error('Unexpected AppError', { stack: err.stack });
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    success: false,
    message: 'Internal server error',
  });
}
