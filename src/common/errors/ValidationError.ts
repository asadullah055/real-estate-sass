import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message = 'Validation failed') {
    super(message, HTTP_STATUS.BAD_REQUEST);
    this.errors = errors;
  }
}
