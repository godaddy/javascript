// SERVER ONLY: uses node:crypto.
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { CommerceError, type CommerceErrorCode, UpstreamError } from './errors';

export interface CommerceErrorLogContext {
  requestId: string;
  method: string;
  path: string;
  httpStatus: number;
  code: CommerceErrorCode;
  details?: Record<string, unknown>;
  error: unknown;
}

/** Receives server-side failure detail that is never sent to the browser. */
export interface CommerceLogger {
  error(message: string, context: CommerceErrorLogContext): void;
}

export const consoleCommerceLogger: CommerceLogger = {
  error: (message, context): void => console.error(message, context),
};

/** Returns the host's id for this request (for example one set by its load balancer), if any. */
export type CommerceRequestIdResolver = (req: Request) => string | undefined;

// Ids are echoed into logs and response bodies, so reject anything that could forge either.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

/** What `createCommerceRouter` stores in `res.locals` for its routes. */
export interface CommerceObservabilityLocals {
  commerceLogger?: CommerceLogger;
  commerceRequestIdResolver?: CommerceRequestIdResolver;
  commerceRequestId?: string;
}

function observabilityLocals(res: Response): CommerceObservabilityLocals {
  return res.locals as CommerceObservabilityLocals;
}

export function resolveRequestId(req: Request, resolver?: CommerceRequestIdResolver): string {
  let supplied: string | undefined;
  // A failing host resolver must not prevent the failure response.
  try {
    supplied = resolver?.(req);
  } catch {
    supplied = undefined;
  }
  return typeof supplied === 'string' && REQUEST_ID_PATTERN.test(supplied) ? supplied : randomUUID();
}

// Resolved only when a failure body needs it, and at most once per request.
function requestIdFor(req: Request, res: Response): string {
  const locals = observabilityLocals(res);
  locals.commerceRequestId ??= resolveRequestId(req, locals.commerceRequestIdResolver);
  return locals.commerceRequestId;
}

/**
 * The single place Commerce failures become HTTP responses. Typed errors keep their status and
 * public message; unmapped upstream failures are 502 and anything else is 500. 5xx detail goes
 * to the configured logger, never into the body.
 */
export function sendCommerceError(
  req: Request,
  res: Response,
  label: string,
  error: unknown,
  { failureFields = {}, classifyUpstreamError }: CommerceRouteOptions = {},
): void {
  const resolved: CommerceError | undefined =
    error instanceof UpstreamError
      ? (classifyUpstreamError?.(error) ?? error)
      : error instanceof CommerceError
        ? error
        : undefined;
  const httpStatus = resolved?.httpStatus ?? 500;
  const code: CommerceErrorCode = resolved?.code ?? 'internal_error';
  const requestId = requestIdFor(req, res);

  if (httpStatus >= 500) {
    const context: CommerceErrorLogContext = {
      requestId,
      method: req.method,
      path: req.path,
      httpStatus,
      code,
      ...(resolved?.details ? { details: resolved.details } : {}),
      error,
    };
    // A failing or invalid host logger must not prevent the failure response.
    try {
      (observabilityLocals(res).commerceLogger ?? consoleCommerceLogger).error(
        `commerce-server: ${label}`,
        context,
      );
    } catch (loggerError) {
      console.error(`commerce-server: ${label} (host logger failed)`, { ...context, loggerError });
    }
  }

  if (res.headersSent) return;
  res.status(httpStatus).json({ ...failureFields, error: resolved?.publicMessage ?? label, code, requestId });
}

export interface CommerceRouteOptions {
  /** Fields every failure body carries in addition to `error`, `code`, and `requestId`. */
  failureFields?: Record<string, unknown>;
  /**
   * Turns a specific upstream signal into a more precise error. Unclassified upstream failures
   * are 502. Only routes whose evidence supports a rule should pass one.
   */
  classifyUpstreamError?: (error: UpstreamError) => CommerceError;
}

/** Wraps a route so thrown errors are answered by `sendCommerceError` with the route's label. */
export function commerceRoute(
  label: string,
  handler: (req: Request, res: Response) => Promise<void>,
  options: CommerceRouteOptions = {},
): (req: Request, res: Response) => Promise<void> {
  return async (req, res): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      sendCommerceError(req, res, label, error, options);
    }
  };
}
