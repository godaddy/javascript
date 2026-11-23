import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VerifiableRequest } from '../types/verifiable-request';
import { webhookFailureBody, webhookFailureStatus } from './config';
import { generateHmac, verifyWebhookSubscription } from './webhook';

// A known vector: produced by, and accepted by, this verifier before the
// hardening, which signs the way the platform does (the secret as the key, a V1 tag).
const VECTOR = {
  secret: 'whsec_vector',
  id: 'msg_2Lx',
  timestamp: '1795400000',
  body: '{"id":"evt_1","type":"commerce.order.created"}',
  signature: 'V1,rO5C/aUP8RekUJ6KU0UzdrIqZdiIRqWbn9vGoRYNgDE=',
};

function delivery(
  body: unknown,
  headers: Record<string, string | string[] | undefined> = {},
): VerifiableRequest {
  return {
    method: 'POST',
    url: '/webhooks',
    path: '/webhooks',
    query: {},
    headers: {
      'webhook-id': VECTOR.id,
      'webhook-timestamp': VECTOR.timestamp,
      'webhook-signature': VECTOR.signature,
      ...headers,
    },
    body,
  };
}

function digest(secret: string, id: string, timestamp: string, body: string) {
  return createHmac('sha256', secret)
    .update(`${id}.${timestamp}.${body}`)
    .digest('base64');
}

const options = { secret: VECTOR.secret };

describe('verifyWebhookSubscription', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts the known vector as a string and as raw bytes', () => {
    expect(
      generateHmac(VECTOR.secret, VECTOR.id, VECTOR.timestamp, VECTOR.body),
    ).toBe(VECTOR.signature);
    expect(verifyWebhookSubscription(delivery(VECTOR.body), options)).toEqual({
      success: true,
      value: undefined,
    });
    expect(
      verifyWebhookSubscription(delivery(Buffer.from(VECTOR.body)), options)
        .success,
    ).toBe(true);
    expect(
      verifyWebhookSubscription(
        delivery(new TextEncoder().encode(VECTOR.body)),
        options,
      ).success,
    ).toBe(true);
    const bytes = new TextEncoder().encode(VECTOR.body);
    for (const body of [bytes.buffer, new DataView(bytes.buffer)]) {
      expect(
        verifyWebhookSubscription(delivery(body), {
          ...options,
          strictRawBody: true,
        }).success,
      ).toBe(true);
    }
  });

  it('accepts the lowercase v1 tag the same as V1', () => {
    const lower = VECTOR.signature.replace('V1,', 'v1,');
    expect(
      verifyWebhookSubscription(
        delivery(VECTOR.body, { 'webhook-signature': lower }),
        options,
      ).success,
    ).toBe(true);
  });

  it('refuses a tampered body, id or timestamp', () => {
    for (const request of [
      delivery(VECTOR.body.replace('evt_1', 'evt_2')),
      delivery(VECTOR.body, { 'webhook-id': 'msg_other' }),
      delivery(VECTOR.body, { 'webhook-timestamp': '1795400001' }),
    ]) {
      const result = verifyWebhookSubscription(request, options);
      expect(result.success).toBe(false);
      expect(result.error?.name).toBe('INVALID_WEBHOOK_SIGNATURE');
    }
  });

  it('refuses the right signature checked with another secret', () => {
    const result = verifyWebhookSubscription(delivery(VECTOR.body), {
      secret: 'whsec_other',
    });
    expect(result.error?.name).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('refuses the same JSON with its keys reordered', () => {
    const reordered = '{"type":"commerce.order.created","id":"evt_1"}';
    expect(JSON.parse(reordered)).toEqual(JSON.parse(VECTOR.body));
    const result = verifyWebhookSubscription(delivery(reordered), options);
    expect(result.error?.name).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('signs the exact bytes, so a byte-order mark or other bytes count', () => {
    const withBom = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from(VECTOR.body),
    ]);
    expect(verifyWebhookSubscription(delivery(withBom), options).success).toBe(
      false,
    );
    const signature = `v1,${createHmac('sha256', VECTOR.secret)
      .update(`${VECTOR.id}.${VECTOR.timestamp}.`)
      .update(withBom)
      .digest('base64')}`;
    expect(
      verifyWebhookSubscription(
        delivery(withBom, { 'webhook-signature': signature }),
        options,
      ).success,
    ).toBe(true);
  });

  it('accepts a space-separated list when any v1 entry matches', () => {
    const other = `v1,${digest('whsec_old', VECTOR.id, VECTOR.timestamp, VECTOR.body)}`;
    for (const header of [
      `${other} ${VECTOR.signature}`,
      `${VECTOR.signature} ${other}`,
      `v2,${digest(VECTOR.secret, VECTOR.id, VECTOR.timestamp, VECTOR.body)} ${VECTOR.signature}`,
    ]) {
      expect(
        verifyWebhookSubscription(
          delivery(VECTOR.body, { 'webhook-signature': header }),
          options,
        ).success,
      ).toBe(true);
    }
  });

  it('refuses a list with no matching v1 entry, and malformed entries', () => {
    const right = digest(
      VECTOR.secret,
      VECTOR.id,
      VECTOR.timestamp,
      VECTOR.body,
    );
    for (const header of [
      `v1,${digest('whsec_old', VECTOR.id, VECTOR.timestamp, VECTOR.body)} v1,bm90LXNpZ25lZA==`,
      `v2,${right}`,
      right,
      `,${right}`,
      `v1,${right.slice(0, -1)}`,
      `v1,${right}x`,
      'v1,',
    ]) {
      const result = verifyWebhookSubscription(
        delivery(VECTOR.body, { 'webhook-signature': header }),
        options,
      );
      expect(result.error?.name).toBe('INVALID_WEBHOOK_SIGNATURE');
    }
  });

  it('joins repeated signature headers into one list', () => {
    const other = `v1,${digest('whsec_old', VECTOR.id, VECTOR.timestamp, VECTOR.body)}`;
    expect(
      verifyWebhookSubscription(
        delivery(VECTOR.body, {
          'webhook-signature': [other, VECTOR.signature],
        }),
        options,
      ).success,
    ).toBe(true);
  });

  it('reads a list joined with ", " the way Node joins a repeated header', () => {
    const other = `v1,${digest('whsec_old', VECTOR.id, VECTOR.timestamp, VECTOR.body)}`;
    for (const header of [
      `${VECTOR.signature}, ${other}`,
      `${other}, ${VECTOR.signature}`,
    ]) {
      expect(
        verifyWebhookSubscription(
          delivery(VECTOR.body, { 'webhook-signature': header }),
          options,
        ).success,
      ).toBe(true);
    }
  });

  it('reads a list joined with a bare comma by an intermediary', () => {
    const other = `v1,${digest('whsec_old', VECTOR.id, VECTOR.timestamp, VECTOR.body)}`;
    for (const header of [
      `${other},${VECTOR.signature}`,
      `${VECTOR.signature},${other}`,
    ]) {
      expect(
        verifyWebhookSubscription(
          delivery(VECTOR.body, { 'webhook-signature': header }),
          options,
        ).success,
      ).toBe(true);
    }
  });

  it('signs with the first value of a webhook-id or webhook-timestamp joined with ", "', () => {
    expect(
      verifyWebhookSubscription(
        delivery(VECTOR.body, {
          'webhook-id': `${VECTOR.id}, msg_other`,
          'webhook-timestamp': `${VECTOR.timestamp}, 1`,
        }),
        options,
      ).success,
    ).toBe(true);
  });

  it('reads header values a hand-built request passes as numbers', () => {
    expect(
      verifyWebhookSubscription(
        delivery(VECTOR.body, {
          'webhook-timestamp': Number(VECTOR.timestamp) as unknown as string,
        }),
        options,
      ).success,
    ).toBe(true);
    const wrongSignature = verifyWebhookSubscription(
      delivery(VECTOR.body, { 'webhook-signature': 42 as unknown as string }),
      options,
    );
    expect(wrongSignature.success).toBe(false);
    if (!wrongSignature.success) {
      expect(wrongSignature.error.name).toBe('INVALID_WEBHOOK_SIGNATURE');
    }
  });

  it('answers an internal failure as the app problem it is, not a bad signature', () => {
    // A parsed body JSON.stringify can't serialize.
    const result = verifyWebhookSubscription(
      delivery({ amount: BigInt(1) }),
      options,
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.name).toBe('WEBHOOK_VERIFICATION_FAILED');
    expect(webhookFailureStatus(result.error.name)).toBe(500);
    expect(webhookFailureBody(result.error)?.name).toBe(
      'WEBHOOK_VERIFICATION_UNAVAILABLE',
    );
  });

  it('logs a setup problem at error level once, then at debug', async () => {
    vi.resetModules();
    const fresh = await import('./webhook');
    const freshLogger = (await import('./logger')).logger;
    const errorLog = vi
      .spyOn(freshLogger, 'error')
      .mockImplementation(() => {});
    const debugLog = vi
      .spyOn(freshLogger, 'debug')
      .mockImplementation(() => {});
    try {
      for (let i = 0; i < 3; i += 1) {
        fresh.verifyWebhookSubscription(delivery({ parsed: true }), {
          ...options,
          strictRawBody: true,
        });
      }
      expect(errorLog).toHaveBeenCalledTimes(1);
      expect(debugLog).toHaveBeenCalledTimes(2);
    } finally {
      errorLog.mockRestore();
      debugLog.mockRestore();
    }
  });

  it('falls back to GODADDY_WEBHOOK_SECRET for a null or empty secret', () => {
    vi.stubEnv('GODADDY_WEBHOOK_SECRET', VECTOR.secret);
    try {
      for (const secret of [null, '']) {
        expect(
          verifyWebhookSubscription(delivery(VECTOR.body), {
            secret: secret as unknown as string,
          }).success,
        ).toBe(true);
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('verifies a body in a SharedArrayBuffer', () => {
    const bytes = Buffer.from(VECTOR.body);
    const shared = new SharedArrayBuffer(bytes.length);
    new Uint8Array(shared).set(bytes);
    expect(
      verifyWebhookSubscription(delivery(shared), {
        ...options,
        strictRawBody: true,
      }).success,
    ).toBe(true);
  });

  it('treats a null toleranceSeconds as not set and refuses a non-boolean strictRawBody', () => {
    expect(
      verifyWebhookSubscription(delivery(VECTOR.body), {
        ...options,
        toleranceSeconds: null as unknown as number,
      }).success,
    ).toBe(true);
    const result = verifyWebhookSubscription(delivery(VECTOR.body), {
      ...options,
      strictRawBody: 'false' as unknown as boolean,
    });
    expect(result.error?.name).toBe('INVALID_WEBHOOK_OPTIONS');
  });
  it('returns INVALID_WEBHOOK_OPTIONS for a secret that is not a string', () => {
    const result = verifyWebhookSubscription(delivery(VECTOR.body), {
      secret: 42 as unknown as string,
    });
    expect(result.error?.name).toBe('INVALID_WEBHOOK_OPTIONS');
  });

  it('signs with the first value of a repeated webhook-id or webhook-timestamp', () => {
    expect(
      verifyWebhookSubscription(
        delivery(VECTOR.body, {
          'webhook-id': [VECTOR.id, 'msg_other'],
          'webhook-timestamp': [VECTOR.timestamp, '1'],
        }),
        options,
      ).success,
    ).toBe(true);
  });

  it('reports a missing secret as WEBHOOK_SECRET_REQUIRED, not a bad signature', () => {
    vi.stubEnv('GODADDY_WEBHOOK_SECRET', '');
    try {
      const result = verifyWebhookSubscription(delivery(VECTOR.body));
      expect(result.error?.name).toBe('WEBHOOK_SECRET_REQUIRED');
      expect(result.error?.correlationId).toEqual(expect.any(String));
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('returns INVALID_WEBHOOK_OPTIONS for a toleranceSeconds that would refuse everything', () => {
    for (const toleranceSeconds of [Number.NaN, -1, Number.POSITIVE_INFINITY]) {
      const result = verifyWebhookSubscription(delivery(VECTOR.body), {
        ...options,
        toleranceSeconds,
      });
      expect(result.success).toBe(false);
      expect(result.error?.name).toBe('INVALID_WEBHOOK_OPTIONS');
    }
  });

  it('names a missing header', () => {
    for (const header of [
      'webhook-signature',
      'webhook-id',
      'webhook-timestamp',
    ]) {
      const result = verifyWebhookSubscription(
        delivery(VECTOR.body, { [header]: undefined }),
        options,
      );
      expect(result.error?.name).toBe('MISSING_WEBHOOK_HEADER');
      expect(result.error?.details?.[0]?.field).toBe(header);
    }
  });

  describe('strictRawBody', () => {
    it('refuses a parsed body instead of re-serializing it', () => {
      const parsed = JSON.parse(VECTOR.body);
      // Without strict mode the legacy fallback re-serializes, which matches here.
      expect(verifyWebhookSubscription(delivery(parsed), options).success).toBe(
        true,
      );
      for (const body of [parsed, undefined, null, 42]) {
        const result = verifyWebhookSubscription(delivery(body), {
          ...options,
          strictRawBody: true,
        });
        expect(result.error?.name).toBe('WEBHOOK_RAW_BODY_REQUIRED');
      }
    });

    it('verifies raw strings and bytes as usual', () => {
      for (const body of [VECTOR.body, Buffer.from(VECTOR.body)]) {
        expect(
          verifyWebhookSubscription(delivery(body), {
            ...options,
            strictRawBody: true,
          }).success,
        ).toBe(true);
      }
    });

    it('still names a missing header first', () => {
      const result = verifyWebhookSubscription(
        delivery({}, { 'webhook-id': undefined }),
        { ...options, strictRawBody: true },
      );
      expect(result.error?.name).toBe('MISSING_WEBHOOK_HEADER');
    });
  });

  describe('toleranceSeconds', () => {
    const sentAt = Number(VECTOR.timestamp) * 1000;

    it('does not check the timestamp age by default', () => {
      vi.useFakeTimers();
      vi.setSystemTime(sentAt + 365 * 24 * 3600 * 1000);
      expect(
        verifyWebhookSubscription(delivery(VECTOR.body), options).success,
      ).toBe(true);
    });

    it('accepts a timestamp within the tolerance on either side', () => {
      vi.useFakeTimers();
      for (const offset of [-300_000, 0, 300_000]) {
        vi.setSystemTime(sentAt + offset);
        expect(
          verifyWebhookSubscription(delivery(VECTOR.body), {
            ...options,
            toleranceSeconds: 300,
          }).success,
        ).toBe(true);
      }
    });

    it('refuses a timestamp outside the tolerance', () => {
      vi.useFakeTimers();
      for (const offset of [-301_000, 301_000]) {
        vi.setSystemTime(sentAt + offset);
        const result = verifyWebhookSubscription(delivery(VECTOR.body), {
          ...options,
          toleranceSeconds: 300,
        });
        expect(result.error?.name).toBe('WEBHOOK_TIMESTAMP_OUT_OF_TOLERANCE');
      }
    });

    it('refuses a signed timestamp that is not Unix seconds', () => {
      vi.useFakeTimers();
      vi.setSystemTime(sentAt);
      const timestamp = '2026-11-23T00:00:00Z';
      const signature = `v1,${digest(VECTOR.secret, VECTOR.id, timestamp, VECTOR.body)}`;
      const result = verifyWebhookSubscription(
        delivery(VECTOR.body, {
          'webhook-timestamp': timestamp,
          'webhook-signature': signature,
        }),
        { ...options, toleranceSeconds: 300 },
      );
      expect(result.error?.name).toBe('WEBHOOK_TIMESTAMP_OUT_OF_TOLERANCE');
    });

    it('reports a bad signature before an old timestamp', () => {
      vi.useFakeTimers();
      vi.setSystemTime(sentAt + 3600_000);
      const result = verifyWebhookSubscription(
        delivery(VECTOR.body, { 'webhook-signature': 'v1,bm90LXNpZ25lZA==' }),
        { ...options, toleranceSeconds: 300 },
      );
      expect(result.error?.name).toBe('INVALID_WEBHOOK_SIGNATURE');
    });
  });

  it('reads the secret from GODADDY_WEBHOOK_SECRET', () => {
    vi.stubEnv('GODADDY_WEBHOOK_SECRET', VECTOR.secret);
    try {
      expect(verifyWebhookSubscription(delivery(VECTOR.body)).success).toBe(
        true,
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
