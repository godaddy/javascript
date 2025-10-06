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

- HMAC-SHA256 signature verification
- Support for webhook subscription verification header format
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