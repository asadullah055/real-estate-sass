import type { Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus.js';

interface ApiResponseOptions<T> {
  res: Response;
  message?: string;
  data?: T;
  meta?: object;
  statusCode?: number;
}

export function sendSuccess<T>({
  res,
  message = 'Success',
  data,
  meta,
  statusCode = HTTP_STATUS.OK,
}: ApiResponseOptions<T>) {
  return res.status(statusCode).json({ success: true, message, data, meta });
}

export function sendCreated<T>({
  res,
  message = 'Created successfully',
  data,
  meta,
}: Omit<ApiResponseOptions<T>, 'statusCode'>) {
  return res.status(HTTP_STATUS.CREATED).json({ success: true, message, data, meta });
}
