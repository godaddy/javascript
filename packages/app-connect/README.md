# GoDaddy App Connect

[![npm version](https://img.shields.io/npm/v/@godaddy/app-connect.svg)](https://www.npmjs.com/package/@godaddy/app-connect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A collection of tools and utilities for building applications that integrate with the GoDaddy platform.

## Overview

This library provides essential functionality for developers building applications that work with the GoDaddy platform. It handles platform integration concerns like request verification, webhook validation, authentication, and API communication.

> **Note:** This library is under active development. Currently, it provides request verification, webhook subscription verification and once-only work, with more features planned for future releases.

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

- HMAC-SHA256 signature verification
- Support for webhook subscription verification header format
- Express.js middleware for easy integration
- Configurable via environment variables or runtime options

### Once-only Work

Record one outcome per key across every instance of the app, and run the work for it one caller at a time, so a redelivered webhook or a retried job doesn't repeat a side effect. Work that outlives its lease can run again, so pair it with an idempotency key.

- `once(store, key, fn)` with the outcomes `done`, `duplicate`, `in_flight` and `refused`
- A lease, so work a crashed instance claimed is taken over instead of lost
- A MySQL 8 store (a `mysql2/promise` pool) and an in-memory store for tests
- `deriveId(namespace, name)` for stable name-based ids (RFC 9562 version 5)

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

// Add body parser middleware first
app.use(express.json());

// Add action verification middleware
app.post('/action-webhook', 
  createActionMiddleware(), 
  (req, res) => {
  // If the request gets here, it's verified as a signed action
  res.send('Verified action request received!');
});

// For webhook subscriptions (separate endpoint with webhook verification)
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
import { verifyWebhookSubscription, VerifiableRequest } from '@godaddy/app-connect';

function processWebhookSubscription(req) {
  // Create a verifiable request object
  const verifiableRequest: VerifiableRequest = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: req.headers,
    body: req.body
  };

  // Verify the webhook subscription
  const result = verifyWebhookSubscription(verifiableRequest);

  if (!result.success) {
    // Handle verification failure
    console.error('Webhook verification failed:', result.error);
    return { error: result.error };
  }

  // Process verified webhook
  return { success: true };
}
```

### Once-only Work

```typescript
import { createPool } from 'mysql2/promise';
import { Refused, createMysqlOnceStore, deriveId, once } from '@godaddy/app-connect/once';

const store = createMysqlOnceStore(createPool(process.env.DATABASE_URL!));
// One random UUID per app (run crypto.randomUUID() once), never changed.
// Don't copy someone else's: apps sharing it would share idempotency keys.
const NAMESPACE = process.env.ONCE_NAMESPACE!;

const result = await once(store, `order-event:${eventId}`, async () => {
  const response = await sendToVendor(order, { idempotencyKey: deriveId(NAMESPACE, eventId) });
  if (response.status === 422) throw new Refused('vendor_rejected'); // recorded; never retried
  if (!response.ok) throw new Error(`vendor answered ${response.status}`); // released; a retry runs again
  return response.id;
});

switch (result.status) {
  case 'done': // the work ran now; result.value is what it returned
  case 'duplicate': // it already finished earlier (result.outcome says how)
  case 'refused': // it ran now and was refused for good
    return res.status(200).end();
  case 'in_flight': // another instance holds it (or a claim whose response was lost, until its lease passes); ask the sender to retry
    return res.status(503).end();
}
```

- Pass a `mysql2/promise` Pool, not a connection the app uses for its own transactions: claims must commit on their own to be seen by other instances. A claim that waits on a row lock answers `in_flight` only after the server's `innodb_lock_wait_timeout` (50 seconds by default); lower it for the store's pool if senders time out sooner. A claim that waited has its lease renewed from when it got the row. Keep the pool's charset utf8mb4 (the mysql2 default), or keys with characters outside the BMP can be cut short and collide.
- The store creates its table (`app_connect_once`) on first use. To create it from a migration instead, use `onceTableDdl()` and pass `createTable: false`. The store needs MySQL 8 or later (the key uses `utf8mb4_0900_bin`, which MariaDB doesn't have).
- Rows are kept. Prune finished rows and claims whose lease has passed in small batches, for example `DELETE FROM app_connect_once WHERE updated_at < ? AND (state <> 'claimed' OR lease_until < ?) LIMIT 1000` (both in Unix milliseconds), so claims aren't kept waiting on a long delete. A pruned key can run again, so keep rows longer than any sender may redeliver or retry the same key.
- Leases are judged by each instance's own clock, so keep instances' clocks in sync (NTP) to well inside a lease. A clock that runs ahead by more than the lease takes over claims that are still live.
- `createMemoryOnceStore()` keeps claims in one process and never forgets finished keys, so use it for tests and local runs only.
- `leaseMs` (default 5 minutes) must be longer than the work can take. Once it passes, another caller may take the key over and run the work again, so make the work safe to repeat, for example with an idempotency key from `deriveId`.
- Keys are at most 255 characters; derive a shorter one with `deriveId` when needed. A `Refused` reason is stored, so keep it a short code, never vendor text or shopper data.
- When the work finished but its outcome could not be recorded, `once` throws `OnceNotRecordedError` (with the work's return value as `value`); answer the delivery as failed so it is retried.

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
- `options`: Optional configuration including the webhook secret

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

See the [Next.js App Router Integration](#nextjs-app-router-integration-nextjs-13) example for action verification details. The pattern is similar for webhook verification.

### Once-only Work

All of these are exported from `@godaddy/app-connect/once` and from the package root.

#### `once(store, key, fn, options?): Promise<OnceResult<T>>`

Records one outcome for `key`, running `fn` one caller at a time. Answers `{ status: 'done', value }`, `{ status: 'duplicate', outcome }`, `{ status: 'in_flight' }` or `{ status: 'refused', reason }`. `options.leaseMs` defaults to 5 minutes; `options.onReleaseError` hears about a claim that couldn't be released after `fn` threw (pass a wrapper such as `(err, key) => logger.error({ err, key }, 'release failed')`, so the logger keeps its `this`). It throws a `TypeError` for a bad key or lease, whatever `store.claim` throws, whatever `fn` throws other than `Refused` (after releasing the claim), and `OnceNotRecordedError` when `fn` finished but its outcome could not be recorded. After any of these this caller didn't record an outcome, so answer the delivery as failed; the retry's `once` call shows whether another caller finished the key meanwhile (see `OnceClaimLostError` below).

#### `Refused`

Throw `new Refused(reason)` from `fn` to record a refusal for good.

#### `createMysqlOnceStore(pool, options?): OnceStore`

A store in MySQL 8. Options: `table` (default `app_connect_once`), `createTable` (default true) and `now`.

#### `onceTableDdl(table?): string`

The `CREATE TABLE IF NOT EXISTS` statement for a migration.

#### `createMemoryOnceStore(options?): OnceStore`

A store in this process's memory, for tests and local runs.

#### `deriveId(namespace, name): string`

An RFC 9562 version 5 UUID for `name` in the `namespace` UUID.

#### `OnceNotRecordedError` and `OnceClaimLostError`

`OnceNotRecordedError` has `key`, `outcome`, `value` (what `fn` returned, not enumerable) and `cause`. When `cause` is an `OnceClaimLostError`, the lease passed and another caller took the key over, so it may already be done; otherwise the store failed and the key stays claimed until its lease passes. Neither error puts the key in its message, but keep shopper data out of keys anyway: they're stored.

#### `OnceStore`

The port for a custom store: `claim(key, leaseMs)` answers `claimed` (with a token), `done`, `refused` or `in_flight`, atomically across processes, taking over a claim whose lease has passed; `complete(key, token, outcome)` records the outcome for the token's holder and throws `OnceClaimLostError` otherwise; `release(key, token)` forgets the holder's claim and does nothing otherwise.

#### Constants

`DEFAULT_LEASE_MS` (5 minutes), `DEFAULT_ONCE_TABLE` (`app_connect_once`), `MAX_KEY_LENGTH` and `MAX_REASON_LENGTH` (255 characters each).

### Helper Functions

#### `getWebhookSecret(options?): string`

Retrieves the webhook secret for webhook subscription verification, from options or environment.

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

## Upcoming Features

- Additional authentication mechanisms
- Platform API client
- Event handling utilities
- More framework integrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.