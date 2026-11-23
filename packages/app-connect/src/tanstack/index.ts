import { createMiddleware } from '@tanstack/react-start';
import type { VerifiableRequest } from '../types/verifiable-request';
import {
  type VerificationOptions,
  type WebhookVerificationOptions,
  checkWebhookOptions,
  webhookFailureBody,
  webhookFailureStatus,
} from '../utils/config';
import { logger } from '../utils/logger';
import { verifyAction } from '../utils/verification';
import { verifyWebhookSubscription } from '../utils/webhook';

/**
 * Creates a middleware for TanStack Start that verifies signed action requests
 */
export function createActionMiddleware(options?: VerificationOptions) {
  const middleware = createMiddleware({ type: 'request' }).server(
    async ({ next, request }) => {
      const url = new URL(request.url);

      // Read raw body as text from cloned request
      // This preserves the original request stream for downstream handlers
      let rawBody: string | undefined;

      if (request.body) {
        // Clone the request to read body without consuming original
        const clonedRequest = request.clone();
        rawBody = await clonedRequest.text();
      }

      const verifiableRequest: VerifiableRequest = {
        method: request.method,
        url: request.url,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        // biome-ignore lint/suspicious/noExplicitAny: Headers type compatibility issue
        headers: Object.fromEntries(request.headers as any),
        // Pass raw body string directly for signature verification
        body: rawBody,
      };

      const result = await verifyAction(verifiableRequest, options);

      if (!result.success) {
        throw new Response(JSON.stringify(result.error), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return next();
    },
  );

  // biome-ignore lint/suspicious/noExplicitAny: TanStack type inference issue
  return middleware as any;
}

/**
 * Creates a middleware for TanStack Start that verifies webhook subscription requests.
 *
 * The signature is checked against the exact request body bytes. Strict
 * raw-body verification is on by default, so a parsed body never reaches the
 * check; pass `strictRawBody: false` to turn it off. A body an earlier
 * middleware already read, or an app without a webhook secret, is answered
 * with 500, because the app's setup is wrong, not the sender's.
 *
 * @throws TypeError when an option would refuse every delivery
 */
export function createWebhookMiddleware(options?: WebhookVerificationOptions) {
  checkWebhookOptions(options);

  const middleware = createMiddleware({ type: 'request' }).server(
    async ({ next, request }) => {
      const url = new URL(request.url);
      // Read the exact body bytes from a clone, so the original request
      // stream stays readable for downstream handlers. Bytes, not text():
      // decoding would drop a byte-order mark and replace invalid sequences.
      // A request without a body is verified as an empty body. A body that
      // can't be read (an earlier middleware read or locked it, or the client
      // went away) is left out and always refused with a logged 500, even with
      // strictRawBody off: no fallback can verify a body nobody can read.
      let rawBody: Buffer | undefined;
      if (!request.body) {
        rawBody = Buffer.alloc(0);
      } else if (!request.bodyUsed) {
        try {
          rawBody = Buffer.from(await request.clone().arrayBuffer());
        } catch (err: unknown) {
          // Kept in the debug log, so a locked stream can be told apart from
          // a client that went away.
          logger.debug({ err, path: url.pathname }, 'Webhook body unreadable');
          rawBody = undefined;
        }
      }

      // Read on every request, field by field rather than with a spread, so a
      // secret set later, or behind a getter or a prototype, is used.
      const webhookOptions: WebhookVerificationOptions = {
        secret: options?.secret,
        toleranceSeconds: options?.toleranceSeconds,
        strictRawBody:
          rawBody === undefined || (options?.strictRawBody ?? true),
      };

      const verifiableRequest: VerifiableRequest = {
        method: request.method,
        url: request.url,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        // biome-ignore lint/suspicious/noExplicitAny: Headers type compatibility issue
        headers: Object.fromEntries(request.headers as any),
        body: rawBody,
      };

      const result = verifyWebhookSubscription(
        verifiableRequest,
        webhookOptions,
      );

      if (!result.success) {
        throw new Response(JSON.stringify(webhookFailureBody(result.error)), {
          status: webhookFailureStatus(result.error?.name),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return next();
    },
  );

  // biome-ignore lint/suspicious/noExplicitAny: TanStack type inference issue
  return middleware as any;
}
