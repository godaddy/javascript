/**
 * Typed failures for the Commerce routes and helpers.
 *
 * Domain code throws these; `commerceRoute` is the only place that turns them into HTTP
 * responses. `message` is internal and only logged. `publicMessage` is safe to show a shopper;
 * when it is absent the route's failure label is used instead.
 */

export type CommerceErrorCode =
  | 'invalid_request'
  | 'scope_mismatch'
  | 'not_found'
  | 'not_configured'
  | 'upstream_unauthorized'
  | 'upstream_error'
  | 'internal_error';

export interface CommerceErrorOptions {
  cause?: unknown;
  publicMessage?: string;
  /** Internal diagnostics for the server log. Never sent to the browser. */
  details?: Record<string, unknown>;
}

export class CommerceError extends Error {
  readonly httpStatus: number;
  readonly code: CommerceErrorCode;
  readonly publicMessage?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    httpStatus: number,
    code: CommerceErrorCode,
    message: string,
    options: CommerceErrorOptions = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CommerceError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.publicMessage = options.publicMessage;
    this.details = options.details;
  }
}

export interface ClientErrorOptions extends Omit<CommerceErrorOptions, 'publicMessage'> {
  /** Internal message for in-process callers; defaults to the public message. */
  message?: string;
}

export class InvalidRequestError extends CommerceError {
  constructor(publicMessage: string, { message = publicMessage, ...options }: ClientErrorOptions = {}) {
    super(400, 'invalid_request', message, { ...options, publicMessage });
    this.name = 'InvalidRequestError';
  }
}

export class ScopeMismatchError extends CommerceError {
  constructor() {
    const publicMessage = 'The connected store changed. Reload the page before continuing.';
    super(409, 'scope_mismatch', publicMessage, { publicMessage });
    this.name = 'ScopeMismatchError';
  }
}

export class NotFoundError extends CommerceError {
  constructor(publicMessage: string, { message = publicMessage, ...options }: ClientErrorOptions = {}) {
    super(404, 'not_found', message, { ...options, publicMessage });
    this.name = 'NotFoundError';
  }
}

export class CommerceNotConfiguredError extends CommerceError {
  constructor(
    message: string,
    {
      publicMessage = 'Commerce configuration is unavailable. Complete the store connection before continuing.',
      ...options
    }: CommerceErrorOptions = {},
  ) {
    super(503, 'not_configured', message, { ...options, publicMessage });
    this.name = 'CommerceNotConfiguredError';
  }
}

export interface UpstreamErrorOptions extends Omit<CommerceErrorOptions, 'publicMessage'> {
  /** The upstream rejected this server's own credentials (OAuth client or scope). */
  unauthorized?: boolean;
}

/**
 * Commerce returned a failure, an unexpected response, or could not be reached. Always 502:
 * even an upstream 401/403 concerns this server's client credentials, not the caller, and
 * answering 401 would collide with the host's own authentication handling.
 */
export class UpstreamError extends CommerceError {
  constructor(message: string, { unauthorized = false, ...options }: UpstreamErrorOptions = {}) {
    super(502, unauthorized ? 'upstream_unauthorized' : 'upstream_error', message, options);
    this.name = 'UpstreamError';
  }
}
