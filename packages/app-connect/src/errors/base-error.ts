import { randomUUID } from 'node:crypto';
import type { ErrorDetails, GoDaddyError } from '../types/error-schema';

/**
 * Base class for all verification errors that follow GoDaddy's error schema
 */
export class VerificationError extends Error implements GoDaddyError {
  name: string;
  correlationId: string;
  details?: ErrorDetails[];
  informationLink?: string;

  constructor(options: {
    name: string;
    message: string;
    correlationId?: string;
    details?: ErrorDetails[];
    informationLink?: string;
  }) {
    super(options.message);
    this.name = options.name;
    this.correlationId = options.correlationId || randomUUID();
    this.details = options.details;
    this.informationLink = options.informationLink;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error to a JSON representation that follows the GoDaddy error schema
   */
  toJSON(): GoDaddyError {
    return {
      name: this.name,
      correlationId: this.correlationId,
      message: this.message,
      ...(this.informationLink && { informationLink: this.informationLink }),
      ...(this.details && { details: this.details }),
    };
  }
}
