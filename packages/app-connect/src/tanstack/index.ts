import { createMiddleware } from '@tanstack/react-start';
import type { VerifiableRequest } from '../types/verifiable-request';
import type {
  VerificationOptions,
  WebhookVerificationOptions,
} from '../utils/config';
import { verifyAction } from '../utils/verification';
import { verifyWebhookSubscription } from '../utils/webhook';

/**
 * Creates a 400 Response for invalid JSON in request body
 */
function createInvalidJsonResponse(): Response {
  return new Response(
    JSON.stringify({
      name: 'INVALID_REQUEST_BODY',
      message: 'The request body contains invalid JSON',
      correlationId: crypto.randomUUID(),
      details: [
        {
          issue: 'INVALID_JSON',
          description: 'The request body could not be parsed as JSON',
          location: 'body',
        },
      ],
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

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
      let parsedBody: unknown;

      if (request.body) {
        // Clone the request to read body without consuming original
        const clonedRequest = request.clone();
        rawBody = await clonedRequest.text();

        // Parse the raw body for downstream use
        if (rawBody) {
          try {
            parsedBody = JSON.parse(rawBody);
          } catch (error) {
            // Return 400 for invalid JSON
            throw createInvalidJsonResponse();
          }
        }
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

      // Pass parsed body to next middleware via context
      return next({ context: { body: parsedBody } });
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

      // Read raw body as text from cloned request
      // This preserves the original request stream for downstream handlers
      let rawBody: string | undefined;
      let parsedBody: unknown;

      if (request.body) {
        // Clone the request to read body without consuming original
        const clonedRequest = request.clone();
        rawBody = await clonedRequest.text();

        // Parse the raw body for downstream use
        if (rawBody) {
          try {
            parsedBody = JSON.parse(rawBody);
          } catch (error) {
            // Return 400 for invalid JSON
            throw createInvalidJsonResponse();
          }
        }
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

      const result = verifyWebhookSubscription(verifiableRequest, options);

      if (!result.success) {
        throw new Response(JSON.stringify(result.error), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Pass parsed body to next middleware via context
      return next({ context: { body: parsedBody } });
    },
  );

  // biome-ignore lint/suspicious/noExplicitAny: TanStack type inference issue
  return middleware as any;
}
