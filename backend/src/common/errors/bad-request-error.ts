import { AppError } from './app-error.js';

export class BadRequestError extends AppError {
  constructor(message: string, errors?: unknown[]) {
    super(message, 400, true, errors);
  }
}
