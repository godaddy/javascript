import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { generateHmac } from '../utils/webhook';
import { createWebhookMiddleware } from './index';

const SECRET = 'whsec_local_test_only';
const BODY = '{"id":"evt_1","type":"commerce.order.created"}';
const HEADERS = {
  'webhook-id': 'msg_1',
  'webhook-timestamp': '1795400000',
  'webhook-signature': generateHmac(SECRET, 'msg_1', '1795400000', BODY),
  'content-type': 'application/json',
  'content-length': String(Buffer.byteLength(BODY)),
};

function request(
  fields: { body?: unknown; rawBody?: unknown },
  headers: Record<string, string | undefined> = HEADERS,
): Request {
  return {
    method: 'POST',
    url: '/webhooks',
    originalUrl: '/webhooks',
    path: '/webhooks',
    query: {},
    headers,
    ...fields,
  } as unknown as Request;
}

function run(
  req: Request,
  options: Parameters<typeof createWebhookMiddleware>[0] = { secret: SECRET },
) {
  const sent: { status?: number; body?: { name?: string } } = {};
  const res = {
    status(code: number) {
      sent.status = code;
      return res;
    },
    json(body: { name?: string }) {
      sent.body = body;
      return res;
    },
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  createWebhookMiddleware(options)(req, res, next);
  return { sent, next };
}

describe('createWebhookMiddleware (Express)', () => {
  it('verifies req.rawBody kept by a body parser verify hook', () => {
    const { sent, next } = run(
      request({ body: JSON.parse(BODY), rawBody: Buffer.from(BODY) }),
    );
    expect(next).toHaveBeenCalledWith();
    expect(sent.status).toBeUndefined();
  });

  it('verifies a Buffer body from express.raw() and a string req.rawBody', () => {
    for (const fields of [{ body: Buffer.from(BODY) }, { rawBody: BODY }]) {
      const { next } = run(request(fields));
      expect(next).toHaveBeenCalledWith();
    }
  });

  it('does not take a decoded string req.body from express.text() as raw', () => {
    const { sent, next } = run(request({ body: BODY }));
    expect(next).not.toHaveBeenCalled();
    expect(sent.status).toBe(500);
  });

  it('answers a body nothing kept with 500 even when strictRawBody is false', () => {
    const { sent, next } = run(request({}), {
      secret: SECRET,
      strictRawBody: false,
    });
    expect(next).not.toHaveBeenCalled();
    expect(sent.status).toBe(500);
  });

  it('answers a parsed or missing body without the raw body with 500, not 401', () => {
    const noLength = { ...HEADERS, 'content-length': undefined };
    for (const [fields, headers] of [
      [{ body: JSON.parse(BODY) }, HEADERS],
      [{}, HEADERS],
      // Without a length header the body is never assumed empty.
      [{ body: JSON.parse(BODY) }, noLength],
      [{}, noLength],
    ] as const) {
      const { sent, next } = run(request(fields, headers));
      expect(next).not.toHaveBeenCalled();
      expect(sent.status).toBe(500);
      // The sender gets a generic body; the detail is logged.
      expect(sent.body?.name).toBe('WEBHOOK_VERIFICATION_UNAVAILABLE');
    }
  });

  it('answers a body that does not match the signature with 401', () => {
    const { sent, next } = run(
      request({ rawBody: Buffer.from(BODY.replace('evt_1', 'evt_2')) }),
    );
    expect(next).not.toHaveBeenCalled();
    expect(sent.status).toBe(401);
    expect(sent.body?.name).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('keeps the JSON.stringify fallback when strictRawBody is false', () => {
    const { next } = run(request({ body: JSON.parse(BODY) }), {
      secret: SECRET,
      strictRawBody: false,
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('verifies a request that says it has no body as an empty body', () => {
    const signature = generateHmac(SECRET, 'msg_1', '1795400000', '');
    for (const body of [undefined, {}]) {
      const { next } = run(
        request(
          { body },
          {
            ...HEADERS,
            'content-length': '0',
            'webhook-signature': signature,
          },
        ),
      );
      expect(next).toHaveBeenCalledWith();
    }
  });

  it('answers a missing webhook secret with 500 and a generic body', () => {
    vi.stubEnv('GODADDY_WEBHOOK_SECRET', '');
    try {
      const { sent, next } = run(request({ rawBody: Buffer.from(BODY) }), {});
      expect(next).not.toHaveBeenCalled();
      expect(sent.status).toBe(500);
      expect(sent.body).toEqual({
        name: 'WEBHOOK_VERIFICATION_UNAVAILABLE',
        message: 'Webhook verification is not available',
        correlationId: expect.any(String),
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('throws when created with a toleranceSeconds that would refuse everything', () => {
    expect(() =>
      createWebhookMiddleware({ secret: SECRET, toleranceSeconds: Number.NaN }),
    ).toThrow(TypeError);
  });
  it('reads the options on every request, so a secret set later is used', () => {
    const options: { secret?: string } = {};
    const middleware = createWebhookMiddleware(options);
    options.secret = SECRET;
    const next = vi.fn() as unknown as NextFunction;
    const res = {
      status: () => res,
      json: () => res,
    } as unknown as Response;
    middleware(
      request({ rawBody: new Uint8Array(Buffer.from(BODY)).buffer }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('answers the empty {} Express 4 leaves for an unparsed body with 500, even when strictRawBody is false', () => {
    const { sent, next } = run(request({ body: {} }), {
      secret: SECRET,
      strictRawBody: false,
    });
    expect(next).not.toHaveBeenCalled();
    expect(sent.status).toBe(500);
  });

  it('reads a secret behind a getter on the options object', () => {
    class Config {
      get secret() {
        return SECRET;
      }
    }
    const { next } = run(
      request({ rawBody: Buffer.from(BODY) }),
      new Config() as unknown as { secret: string },
    );
    expect(next).toHaveBeenCalledWith();
  });
});
