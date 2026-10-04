import { AppError } from './app-error.js';

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: Insufficient permissions') {
    super(message, 403, true);
  }
}
