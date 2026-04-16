import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND);
  }
}
