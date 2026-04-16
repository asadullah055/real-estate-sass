import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/ValidationError.js';

export function validate(
  schema: ZodSchema,
  target: 'body' | 'query' | 'params' = 'body',
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.errors.forEach(({ path, message }) => {
          const key = path.join('.') || 'value';
          (errors[key] ??= []).push(message);
        });
        next(new ValidationError(errors));
      } else {
        next(err);
      }
    }
  };
}
