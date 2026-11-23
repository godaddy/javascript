import { types } from 'node:util';
import type { NextFunction, Request, Response } from 'express';
import type { VerifiableRequest } from '../types/verifiable-request';
import {
  type VerificationOptions,
  type WebhookVerificationOptions,
  checkWebhookOptions,
  webhookFailureBody,
  webhookFailureStatus,
} from '../utils/config';
import { verifyAction } from '../utils/verification';
import { verifyWebhookSubscription } from '../utils/webhook';

/**
 * Creates a middleware for Express.js that verifies signed action requests
 */
export function createActionMiddleware(options?: VerificationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const verifiableRequest: VerifiableRequest = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query as Record<string, string | string[] | undefined>,
      headers: req.headers as Record<string, string | string[] | undefined>,
      body: req.body,
    };

    const result = await verifyAction(verifiableRequest, options);

    if (!result.success) {
      return res.status(401).json(result.error);
    }

    next();
  };
}

function isBytes(value: unknown): boolean {
  return ArrayBuffer.isView(value) || types.isAnyArrayBuffer(value);
}

/**
 * True when the request said it has no body (`content-length: 0`), so the
 * signed body is empty. Without that header the body is never assumed empty:
 * HTTP/2 and some proxies send a real body without a length.
 */
function hasNoBody(req: Request): boolean {
  return req.headers['content-length'] === '0';
}

/** The empty `{}` Express 4's body-parser leaves when it didn't parse a body. */
function isEmptyPlaceholder(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    Object.getPrototypeOf(body) === Object.prototype &&
    Object.keys(body).length === 0
  );
}

/**
 * Picks the raw webhook body: `req.rawBody` (bytes or a string) when a body
 * parser's verify hook kept it, otherwise `req.body` when it is bytes (from
 * express.raw()), otherwise an empty body when the request says it has none.
 * A string `req.body` (express.text()) is not raw: the parser decoded it, which
 * can drop a byte-order mark or apply another charset. Anything else is passed
 * on as it is, so strict verification can refuse it.
 */
function rawWebhookBody(req: Request): {
  body: unknown;
  lost: boolean;
  decoded?: boolean;
} {
  const { rawBody } = req as Request & { rawBody?: unknown };
  if (typeof rawBody === 'string' || isBytes(rawBody)) {
    return { body: rawBody, lost: false };
  }
  if (isBytes(req.body)) {
    return { body: req.body, lost: false };
  }
  if (hasNoBody(req)) {
    return { body: Buffer.alloc(0), lost: false };
  }
  // A body was sent but nothing kept it: no fallback can verify that. Express
  // 4's body-parser leaves an empty `{}` when its content type didn't match,
  // so that placeholder counts as lost too.
  return {
    body: req.body,
    lost: req.body === undefined || isEmptyPlaceholder(req.body),
    decoded: typeof req.body === 'string',
  };
}

/**
 * Creates a middleware for Express.js that verifies webhook subscription requests.
 *
 * Strict raw-body verification is on by default: the signature is checked
 * against `req.rawBody`, or a Buffer `req.body`, never a re-serialized parsed
 * body. A request whose raw body is lost, or an app without a webhook secret,
 * is answered with 500, because the app's setup is wrong, not the sender's.
 * Pass `strictRawBody: false` to keep the old `JSON.stringify` fallback for a
 * parsed body; a body nothing kept is still answered with 500.
 *
 * The options are read on every request, so a secret set on the object later is used.
 *
 * @throws TypeError when an option would refuse every delivery
 */
export function createWebhookMiddleware(options?: WebhookVerificationOptions) {
  checkWebhookOptions(options);

  return (req: Request, res: Response, next: NextFunction) => {
    const { body, lost, decoded } = rawWebhookBody(req);
    const strictRawBody = lost || (options?.strictRawBody ?? true);
    // Each option is read from the caller's object, not copied with a spread,
    // so a secret behind a getter or a prototype still counts.
    const webhookOptions: WebhookVerificationOptions = {
      secret: options?.secret,
      toleranceSeconds: options?.toleranceSeconds,
      strictRawBody,
    };
    const verifiableRequest: VerifiableRequest = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query as Record<string, string | string[] | undefined>,
      headers: req.headers as Record<string, string | string[] | undefined>,
      // Strict mode never verifies a string the parser decoded.
      body: strictRawBody && decoded ? undefined : body,
    };

    const result = verifyWebhookSubscription(verifiableRequest, webhookOptions);

    if (!result.success) {
      return res
        .status(webhookFailureStatus(result.error?.name))
        .json(webhookFailureBody(result.error));
    }

    next();
  };
}
