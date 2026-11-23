import { beforeEach, describe, expect, it, vi } from 'vitest';

// Capture the server callback passed to createMiddleware().server()
let capturedServerFn: (args: {
  next: (opts?: unknown) => unknown;
  request: Request;
}) => Promise<unknown>;

vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({
    server: (fn: typeof capturedServerFn) => {
      capturedServerFn = fn;
      return 'middleware-instance';
    },
  }),
}));

vi.mock('../utils/verification', () => ({
  verifyAction: vi.fn(),
}));

vi.mock('../utils/webhook', () => ({
  verifyWebhookSubscription: vi.fn(),
}));

import { verifyAction } from '../utils/verification';
import { verifyWebhookSubscription } from '../utils/webhook';
import { createActionMiddleware, createWebhookMiddleware } from './index';

const mockVerifyAction = vi.mocked(verifyAction);
const mockVerifyWebhookSubscription = vi.mocked(verifyWebhookSubscription);

function createMockRequest(
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): Request {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request('https://example.com/api/test?foo=bar', requestInit);
}

describe('createActionMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call next without arguments on success', async () => {
    const body = { action: 'test', data: { key: 'value' } };
    const request = createMockRequest(body);
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyAction.mockResolvedValue({ success: true });

    createActionMiddleware();
    const result = await capturedServerFn({ next, request });

    expect(next).toHaveBeenCalledWith();
    expect(result).toBe('next-result');
  });

  it('should read body as text from cloned request (not json)', async () => {
    const body = { action: 'test' };
    const request = createMockRequest(body);
    const jsonSpy = vi.spyOn(request, 'json');
    const textSpy = vi.spyOn(Request.prototype, 'text');
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyAction.mockResolvedValue({ success: true });

    createActionMiddleware();
    await capturedServerFn({ next, request });

    // Should read as text (from clone), not call json() on original
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(textSpy).toHaveBeenCalledTimes(1);

    textSpy.mockRestore();
  });

  it('should build a correct VerifiableRequest and pass it to verifyAction', async () => {
    const body = { action: 'test' };
    const request = createMockRequest(body, {
      'x-store-id': 'store-123',
    });
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyAction.mockResolvedValue({ success: true });

    const options = { maxTimestampAgeSeconds: 300 };
    createActionMiddleware(options);
    await capturedServerFn({ next, request });

    // Verify that body is passed as RAW STRING (not parsed object) for signature verification
    expect(mockVerifyAction).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://example.com/api/test?foo=bar',
        path: '/api/test',
        body: JSON.stringify(body), // Raw string, not parsed object
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-store-id': 'store-123',
        }),
        query: { foo: 'bar' },
      }),
      options,
    );
  });

  it('should throw a 401 Response when verification fails', async () => {
    const errorPayload = {
      name: 'MISSING_HEADER',
      message: 'Missing required header',
    };
    const body = { action: 'test' };
    const request = createMockRequest(body);
    const next = vi.fn();

    mockVerifyAction.mockResolvedValue({ success: false, error: errorPayload });

    createActionMiddleware();

    try {
      await capturedServerFn({ next, request });
      expect.unreachable('Should have thrown');
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(Response);
      const response = thrown as Response;
      expect(response.status).toBe(401);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      const responseBody = await response.json();
      expect(responseBody).toEqual(errorPayload);
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('should not call next when verification fails', async () => {
    const body = { action: 'test' };
    const request = createMockRequest(body);
    const next = vi.fn();

    mockVerifyAction.mockResolvedValue({
      success: false,
      error: { name: 'ERROR', message: 'fail' },
    });

    createActionMiddleware();

    try {
      await capturedServerFn({ next, request });
    } catch {
      // expected
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('should preserve exact raw body string including whitespace', async () => {
    // Test that formatting/whitespace is preserved exactly
    const rawBodyString = '{\n  "action": "test",\n  "data": {\n    "key": "value"\n  }\n}';
    const request = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: rawBodyString,
    });
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyAction.mockResolvedValue({ success: true });

    createActionMiddleware();
    await capturedServerFn({ next, request });

    // Verify raw string is passed exactly as-is to verification
    expect(mockVerifyAction).toHaveBeenCalledWith(
      expect.objectContaining({
        body: rawBodyString, // Exact match including whitespace
      }),
      undefined,
    );
  });

  it('should preserve unicode and special characters in raw body', async () => {
    const rawBodyString = '{"emoji":"🎉","unicode":"\\u00e9","text":"café"}';
    const request = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: rawBodyString,
    });
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyAction.mockResolvedValue({ success: true });

    createActionMiddleware();
    await capturedServerFn({ next, request });

    // Verify exact raw string preservation
    expect(mockVerifyAction).toHaveBeenCalledWith(
      expect.objectContaining({
        body: rawBodyString,
      }),
      undefined,
    );
  });
});

describe('createWebhookMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call next without arguments on success', async () => {
    const body = { event: 'order.created', payload: { id: '123' } };
    const request = createMockRequest(body);
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware();
    const result = await capturedServerFn({ next, request });

    expect(next).toHaveBeenCalledWith();
    expect(result).toBe('next-result');
  });

  it('should read the body as bytes from the cloned request (not json or text)', async () => {
    const body = { event: 'order.created' };
    const request = createMockRequest(body);
    const jsonSpy = vi.spyOn(request, 'json');
    const bytesSpy = vi.spyOn(Request.prototype, 'arrayBuffer');
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware();
    await capturedServerFn({ next, request });

    // Should read bytes (from clone), not call json() on original
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(bytesSpy).toHaveBeenCalledTimes(1);

    bytesSpy.mockRestore();
  });

  it('should build a correct VerifiableRequest and pass it to verifyWebhookSubscription', async () => {
    const body = { event: 'order.created' };
    const request = createMockRequest(body, {
      'webhook-signature': 'sig-value',
    });
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    const options = { secret: 'test-secret' };
    createWebhookMiddleware(options);
    await capturedServerFn({ next, request });

    // Verify that body is passed as RAW BYTES (not parsed object) for signature verification
    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://example.com/api/test?foo=bar',
        path: '/api/test',
        body: Buffer.from(JSON.stringify(body)), // Raw bytes, not parsed object
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'webhook-signature': 'sig-value',
        }),
        query: { foo: 'bar' },
      }),
      { ...options, strictRawBody: true },
    );
  });

  it('should throw a 401 Response when verification fails', async () => {
    const errorPayload = {
      name: 'INVALID_WEBHOOK_SIGNATURE',
      message: 'The webhook signature is invalid',
    };
    const body = { event: 'order.created' };
    const request = createMockRequest(body);
    const next = vi.fn();

    mockVerifyWebhookSubscription.mockReturnValue({
      success: false,
      error: errorPayload,
    });

    createWebhookMiddleware();

    try {
      await capturedServerFn({ next, request });
      expect.unreachable('Should have thrown');
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(Response);
      const response = thrown as Response;
      expect(response.status).toBe(401);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      const responseBody = await response.json();
      expect(responseBody).toEqual(errorPayload);
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('should not call next when verification fails', async () => {
    const body = { event: 'order.created' };
    const request = createMockRequest(body);
    const next = vi.fn();

    mockVerifyWebhookSubscription.mockReturnValue({
      success: false,
      error: { name: 'ERROR', message: 'fail' },
    });

    createWebhookMiddleware();

    try {
      await capturedServerFn({ next, request });
    } catch {
      // expected
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('should preserve exact raw body string including whitespace', async () => {
    // Test that formatting/whitespace is preserved exactly
    const rawBodyString = '{\n  "event": "order.created",\n  "payload": {\n    "id": "123"\n  }\n}';
    const request = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: rawBodyString,
    });
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware();
    await capturedServerFn({ next, request });

    // Verify raw bytes are passed exactly as-is to verification
    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        body: Buffer.from(rawBodyString), // Exact match including whitespace
      }),
      { strictRawBody: true },
    );
  });

  it('should preserve unicode and special characters in raw body', async () => {
    const rawBodyString = '{"event":"user.created","data":"café","emoji":"🎉"}';
    const request = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: rawBodyString,
    });
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware();
    await capturedServerFn({ next, request });

    // Verify exact raw byte preservation
    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        body: Buffer.from(rawBodyString),
      }),
      { strictRawBody: true },
    );
  });

  it('should keep a byte-order mark that text() would drop', async () => {
    const bytes = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from('{"event":"order.created"}'),
    ]);
    const request = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: bytes,
    });
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware();
    await capturedServerFn({ next, request });

    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ body: bytes }),
      { strictRawBody: true },
    );
  });

  it('should verify a request without a body as an empty body', async () => {
    const request = createMockRequest();
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware();
    await capturedServerFn({ next, request });

    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ body: Buffer.alloc(0) }),
      { strictRawBody: true },
    );
  });

  it('should pass no body when an earlier middleware already read it', async () => {
    const request = createMockRequest({ event: 'order.created' });
    await request.json();
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware();
    await capturedServerFn({ next, request });

    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ body: undefined }),
      { strictRawBody: true },
    );
  });

  it('should pass no body when the body stream is locked', async () => {
    const request = createMockRequest({ event: 'order.created' });
    request.body?.getReader();
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware();
    await capturedServerFn({ next, request });

    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ body: undefined }),
      { strictRawBody: true },
    );
  });

  it('should refuse an unreadable body even when strict mode is off', async () => {
    const request = createMockRequest({ event: 'order.created' });
    await request.json();
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware({ strictRawBody: false });
    await capturedServerFn({ next, request });

    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ body: undefined }),
      { strictRawBody: true },
    );
  });
  it('should answer the app setup errors with 500', async () => {
    for (const name of [
      'WEBHOOK_RAW_BODY_REQUIRED',
      'WEBHOOK_SECRET_REQUIRED',
    ]) {
      mockVerifyWebhookSubscription.mockReturnValue({
        success: false,
        error: { name, message: 'setup' },
      });
      createWebhookMiddleware();
      const thrown = await capturedServerFn({
        next: vi.fn(),
        request: createMockRequest({ event: 'order.created' }),
      }).catch((error: unknown) => error);
      expect(thrown).toBeInstanceOf(Response);
      expect((thrown as Response).status).toBe(500);
    }
  });

  it('should throw when created with a toleranceSeconds that would refuse everything', () => {
    expect(() => createWebhookMiddleware({ toleranceSeconds: -1 })).toThrow(
      TypeError,
    );
  });

  it('should let the caller turn strict raw-body verification off', async () => {
    const request = createMockRequest({ event: 'order.created' });
    const next = vi.fn().mockResolvedValue('next-result');

    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    createWebhookMiddleware({ secret: 's', strictRawBody: false });
    await capturedServerFn({ next, request });

    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.anything(),
      { secret: 's', strictRawBody: false },
    );
  });

  it('should read a secret behind a getter on the options object', async () => {
    const request = createMockRequest({ event: 'order.created' });
    const next = vi.fn().mockResolvedValue('next-result');
    mockVerifyWebhookSubscription.mockReturnValue({ success: true });

    class Config {
      get secret() {
        return 's';
      }
    }
    createWebhookMiddleware(new Config() as unknown as { secret: string });
    await capturedServerFn({ next, request });

    expect(mockVerifyWebhookSubscription).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ secret: 's' }),
    );
  });
});
