import { createMiddleware } from '@tanstack/react-start';
import type { VerifiableRequest } from '../types/verifiable-request';
import type {
  VerificationOptions,
  WebhookVerificationOptions,
} from '../utils/config';
import { verifyAction } from '../utils/verification';
import { verifyWebhookSubscription } from '../utils/webhook';

/**
 * Creates a middleware for TanStack Start that verifies signed action requests
 */
export function createActionMiddleware(options?: VerificationOptions) {
  const middleware = createMiddleware({ type: 'request' }).server(
    async ({ next, request }) => {
      const url = new URL(request.url);

      const verifiableRequest: VerifiableRequest = {
        method: request.method,
        url: request.url,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        // biome-ignore lint/suspicious/noExplicitAny: Headers type compatibility issue
        headers: Object.fromEntries(request.headers as any),
        body: request.body ? await request.json() : undefined,
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
 * Creates a middleware for TanStack Start that verifies webhook subscription requests
 */
export function createWebhookMiddleware(options?: WebhookVerificationOptions) {
  const middleware = createMiddleware({ type: 'request' }).server(
    async ({ next, request }) => {
      const url = new URL(request.url);

      const verifiableRequest: VerifiableRequest = {
        method: request.method,
        url: request.url,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        // biome-ignore lint/suspicious/noExplicitAny: Headers type compatibility issue
        headers: Object.fromEntries(request.headers as any),
        body: request.body ? await request.json() : undefined,
      };

      const result = verifyWebhookSubscription(verifiableRequest, options);

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
