# GoDaddy App Connect

[![npm version](https://img.shields.io/npm/v/@godaddy/app-connect.svg)](https://www.npmjs.com/package/@godaddy/app-connect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A collection of tools and utilities for building applications that integrate with the GoDaddy platform.

## Overview

This library provides essential functionality for developers building applications that work with the GoDaddy platform. It handles platform integration concerns like request verification, webhook validation, authentication, and API communication.

> **Note:** This library is under active development. Currently, it provides request verification and webhook subscription verification functionality, with more features planned for future releases.

## Installation

```bash
npm install @godaddy/app-connect
# or
yarn add @godaddy/app-connect
# or
pnpm add @godaddy/app-connect
```

This package provides framework-specific exports that can be imported directly:

```typescript
// Express.js specific imports
import { createActionMiddleware, createWebhookMiddleware } from '@godaddy/app-connect/express';

// Next.js specific imports - Next.js App Router (13+) uses verifyAction directly
import { verifyAction, verifyWebhookSubscription, VerifiableRequest } from '@godaddy/app-connect/next';
```

## Features

### Request Verification

Verify that incoming requests to your application are genuinely from the GoDaddy platform by validating cryptographic signatures added by GoDaddy's Traefik middleware.

- ECDSA-P256-SHA256 signature verification
- Express.js and Next.js framework adapters (with dedicated subpath exports)
- Standardized GoDaddy error responses
- Configurable via environment variables or runtime options

### Webhook Subscription Verification

Verify that incoming webhook subscriptions are genuinely from the GoDaddy platform by validating HMAC signatures.

- HMAC-SHA256 signature verification over the raw body bytes, compared in constant time
- Support for webhook subscription verification header format, including a space-separated list of `v1,` signatures
- Strict raw-body mode (on by default in the middleware) and an optional timestamp tolerance
- Express.js middleware for easy integration
- Configurable via environment variables or runtime options

## Usage

### Configuration

#### For Action Verification

Set up the required public key via environment variable:

```
GODADDY_PUBLIC_KEY=base64_encoded_public_key
```

Or provide it directly in your code:

```typescript
import { verifyAction } from '@godaddy/app-connect';

const result = verifyAction(request, {
  publicKey: 'base64_encoded_public_key'
});
```

#### For Webhook Verification

Set up the webhook secret via environment variable:

```
GODADDY_WEBHOOK_SECRET=your_webhook_secret
```

Or provide it directly in your code:

```typescript
import { verifyWebhookSubscription } from '@godaddy/app-connect';

const result = verifyWebhookSubscription(request, {
  secret: 'your_webhook_secret'
});
```

### Express.js Integration

```typescript
import express from 'express';
// Import directly from the express subpath
import { createActionMiddleware } from '@godaddy/app-connect/express';

const app = express();

// Add body parser middleware first. The verify hook keeps the raw body,
// which webhook verification needs: the signature is over the exact bytes.
// Keep it the Buffer: buf.toString() would turn bytes that aren't valid UTF-8
// into replacement characters and the signature would no longer match.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as typeof req & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

// Add action verification middleware
app.post('/action-webhook', 
  createActionMiddleware(), 
  (req, res) => {
  // If the request gets here, it's verified as a signed action
  res.send('Verified action request received!');
});

// For webhook subscriptions (separate endpoint with webhook verification).
// It checks req.rawBody, or a Buffer req.body (from
// express.raw({ type: 'application/json' }) on this route instead of the
// app-wide express.json()), and answers 500 when neither is there.
app.post('/webhook-subscription', 
  createWebhookMiddleware(), // Import this from '@godaddy/app-connect/express'
  (req, res) => {
    // If the request gets here, it's a verified webhook subscription
    res.send('Verified webhook subscription received!');
  }
);

app.listen(3000);
```

### Next.js App Router Integration (Next.js 13+)

```typescript
// app/api/example/route.ts
import { verifyAction, VerifiableRequest } from '@godaddy/app-connect/next';

export async function POST(request: Request) {
  // Transform web standard Request to VerifiableRequest
  const verifiableReq: VerifiableRequest = {
    method: request.method,
    url: request.url,
    path: new URL(request.url).pathname,
    query: Object.fromEntries(new URL(request.url).searchParams),
    headers: Object.fromEntries(request.headers),
    body: await request.json(),
  };

  // Verify the action request
  const result = verifyAction(verifiableReq);

  if (!result.success) {
    // Return error in GoDaddy format
    return Response.json(result.error, { status: 401 });
  }

  // Process the request
  return Response.json({ message: 'Verified request received!' });
}
```

### Direct Verification

#### Action Verification

```typescript
import { verifyAction, VerifiableRequest } from '@godaddy/app-connect';

function processActionRequest(req) {
  // Create a verifiable request object
  const verifiableRequest: VerifiableRequest = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: req.headers,
    body: req.body
  };

  // Verify the action request
  const result = verifyAction(verifiableRequest);

  if (!result.success) {
    // Handle verification failure
    console.error('Verification failed:', result.error);
    return { error: result.error };
  }

  // Process verified request
  return { success: true };
}
```

#### Webhook Verification

```typescript
import {
  verifyWebhookSubscription,
  webhookFailureBody,
  webhookFailureStatus,
  VerifiableRequest,
} from '@godaddy/app-connect';

// An Express route handler that calls the verifier directly
function processWebhookSubscription(req, res) {
  // Create a verifiable request object. The body must be the raw bytes as
  // received (here kept by an express.json() verify hook), not a parsed object.
  const verifiableRequest: VerifiableRequest = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: req.headers,
    // Depending on the body-parser version, the verify hook may not run for an
    // empty body, so pass an empty Buffer when Content-Length is 0 (the
    // middleware does the same)
    body: req.headers['content-length'] === '0' ? Buffer.alloc(0) : req.rawBody
  };

  // Verify the webhook subscription, refusing a parsed body
  const result = verifyWebhookSubscription(verifiableRequest, { strictRawBody: true });

  if (!result.success) {
    // Keep the detail in your own logs. The sender gets what the middleware
    // would answer: 500 with a generic body for the app's own setup problems,
    // 401 otherwise, so an unsigned caller never sees how the app is set up.
    console.error('Webhook verification failed:', result.error);
    return res
      .status(webhookFailureStatus(result.error?.name))
      .json(webhookFailureBody(result.error));
  }

  // Process verified webhook
  return res.json({ received: true });
}
```

## API Reference

### Core Functions

#### `verifyAction(request, options?): Result<void>`

Verifies that a request has a valid GoDaddy platform signature.

- `request`: A `VerifiableRequest` object containing the request details
- `options`: Optional configuration including the public key

Returns a `Result` object that indicates success or contains an error.

#### `verifyWebhookSubscription(request, options?): Result<void>`

Verifies that a webhook subscription request has a valid HMAC signature.

- `request`: A `VerifiableRequest` object containing the webhook request details
- `options`: Optional configuration
  - `secret`: the webhook secret (defaults to `GODADDY_WEBHOOK_SECRET`)
  - `strictRawBody`: refuse a body that is not a raw string or Buffer with `WEBHOOK_RAW_BODY_REQUIRED`, instead of re-serializing a parsed body with `JSON.stringify`. Off by default here; on by default in the Express and TanStack middleware
  - `toleranceSeconds`: refuse a `webhook-timestamp` more than this many seconds from now with `WEBHOOK_TIMESTAMP_OUT_OF_TOLERANCE`. Off by default

The signature is `v1,<base64 HMAC-SHA256>` of `<webhook-id>.<webhook-timestamp>.<raw body>`, keyed with the secret and compared in constant time. The `webhook-signature` header may list several space-separated signatures; one match is enough. Pass the body exactly as received (for Next.js, `Buffer.from(await request.arrayBuffer())`; `request.text()` drops a byte-order mark), since a re-serialized body can differ from what was signed. Direct calls, including the Next.js export, keep `strictRawBody` off unless you pass it, so pass `strictRawBody: true` once your route hands over raw bytes.

Returns a `Result` object that indicates success or contains an error.

### Framework Adapters

#### Express.js

##### `createActionMiddleware(options?)` (from `@godaddy/app-connect/express`)

Creates an Express.js middleware function for verifying action requests.

##### `createWebhookMiddleware(options?)` (from `@godaddy/app-connect/express`)

Creates an Express.js middleware function for verifying webhook subscription requests.

##### `createExpressMiddleware(options?)` (from `@godaddy/app-connect`)

Legacy approach: Creates an Express.js middleware function for verifying action requests.

#### Next.js

For Next.js App Router (13+), use verification functions directly in your route handlers. Import from:

```typescript
import { verifyAction, verifyWebhookSubscription, VerifiableRequest } from '@godaddy/app-connect/next';
```

See the [Next.js App Router Integration](#nextjs-app-router-integration-nextjs-13) example for action verification details. For webhooks, pass the raw bytes, not `request.json()`:

```typescript
// app/api/webhooks/route.ts
import {
  verifyWebhookSubscription,
  webhookFailureBody,
  webhookFailureStatus,
} from '@godaddy/app-connect/next';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const result = verifyWebhookSubscription(
    {
      method: request.method,
      url: request.url,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(request.headers),
      body: Buffer.from(await request.arrayBuffer()),
    },
    { strictRawBody: true },
  );

  if (!result.success) {
    // 500 with a generic body for the app's own setup problems, 401 otherwise
    return Response.json(webhookFailureBody(result.error), {
      status: webhookFailureStatus(result.error?.name),
    });
  }
  return Response.json({ received: true });
}
```

### Error Types

The library exports standardized error types that follow GoDaddy's error schema:

#### Action Verification Errors

- `MissingHeaderError`: When a required header is missing
- `ExpiredSignatureError`: When the signature timestamp is too old
- `InvalidSignatureError`: When the signature verification fails
- `InvalidAlgorithmError`: When the signature algorithm is not supported
- `InvalidVersionError`: When the signature version is not supported

#### Webhook Verification Errors

- `MissingWebhookHeaderError`: When a required webhook header is missing
- `InvalidWebhookSignatureError`: When the webhook signature verification fails
- `WebhookRawBodyRequiredError`: When `strictRawBody` is on and the raw body is unavailable (the middleware answers 500)
- `WebhookSecretRequiredError`: When no webhook secret is configured (the middleware answers 500)
- `InvalidWebhookOptionsError`: When an option would refuse every delivery, such as a negative `toleranceSeconds` (the middleware throws when created)
- `WebhookTimestampOutOfToleranceError`: When `toleranceSeconds` is set and the timestamp is outside it
- `WebhookVerificationFailedError`: When verification failed inside the app, such as a body that can't be serialized (the middleware answers 500)

`webhookFailureStatus(name)` and `webhookFailureBody(error)` give the status and body the middleware answers with, for handlers that call `verifyWebhookSubscription` directly.

## Upcoming Features

- Additional authentication mechanisms
- Platform API client
- Event handling utilities
- More framework integrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.