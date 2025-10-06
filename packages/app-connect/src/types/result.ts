import type { GoDaddyError } from './error-schema';

/**
 * A Result type that represents either a successful operation or an error
 */
export interface Result<T> {
  success: boolean;
  error?: GoDaddyError;
  value?: T;
}

/**
 * Creates a successful result
 */
export function ok<T>(value?: T): Result<T> {
  return {
    success: true,
    value,
  };
}

/**
 * Creates an error result
 */
export function error<T>(err: GoDaddyError): Result<T> {
  return {
    success: false,
    error: err,
  };
}
