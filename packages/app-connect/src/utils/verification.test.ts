import { describe, expect, it } from 'vitest';
import type { VerifiableRequest } from '../types/verifiable-request';
import { canonicalizeRequest, verifyAction } from './verification';

describe('Canonicalization', () => {
  describe('canonicalizeRequest', () => {
    it('should match Go signer canonical string exactly', () => {
      // This is the exact request data that would produce the Go signer output
      const testRequest: VerifiableRequest = {
        method: 'POST',
        path: '/v1/extensions/taxes-calculate',
        headers: {
          'content-length': '513',
          'content-type': 'application/json',
          'x-store-id': 'f9b38cc4-b127-44a3-8a8c-401a1302a849',
          // Add some headers that should be ignored
          'x-godaddy-signature': 'should-be-ignored',
          'user-agent': 'should-be-ignored',
          authorization: 'should-be-ignored',
        },
        body: {
          destination: {
            address: {
              countryCode: 'US',
              postalCode: '94105',
              adminArea1: 'CA',
              adminArea2: 'San Francisco',
            },
          },
          lines: [
            {
              id: 'line_item_1',
              type: 'SKU',
              subtotalPrice: {
                value: 9999,
                currencyCode: 'USD',
              },
              quantity: 2,
              unitPrice: {
                value: 4999,
                currencyCode: 'USD',
              },
              classification: 'general',
              origin: null,
              destination: null,
            },
            {
              id: 'shipping',
              type: 'SHIPPING',
              subtotalPrice: {
                value: 599,
                currencyCode: 'USD',
              },
              quantity: 1,
              unitPrice: {
                value: 599,
                currencyCode: 'USD',
              },
              origin: null,
              destination: null,
            },
          ],
        },
      };

      // Expected canonical string from Go signer (convert literal \n to actual newlines)
      const expectedCanonical =
        'POST /v1/extensions/taxes-calculate\ncontent-length: 513\ncontent-type: application/json\nx-store-id: f9b38cc4-b127-44a3-8a8c-401a1302a849\n\n{"destination":{"address":{"countryCode":"US","postalCode":"94105","adminArea1":"CA","adminArea2":"San Francisco"}},"lines":[{"id":"line_item_1","type":"SKU","subtotalPrice":{"value":9999,"currencyCode":"USD"},"quantity":2,"unitPrice":{"value":4999,"currencyCode":"USD"},"classification":"general","origin":null,"destination":null},{"id":"shipping","type":"SHIPPING","subtotalPrice":{"value":599,"currencyCode":"USD"},"quantity":1,"unitPrice":{"value":599,"currencyCode":"USD"},"origin":null,"destination":null}]}';

      const result = canonicalizeRequest(testRequest);

      // Debug output (keep console.log for test debugging)
      console.log('Expected:', JSON.stringify(expectedCanonical));
      console.log('Actual  :', JSON.stringify(result));

      expect(result).toBe(expectedCanonical);
    });

    it('should handle query parameters in sorted order', () => {
      const testRequest: VerifiableRequest = {
        method: 'GET',
        path: '/api/test',
        query: {
          z: 'last',
          a: 'first',
          m: 'middle',
        },
        headers: {
          'content-type': 'application/json',
        },
      };

      const result = canonicalizeRequest(testRequest);

      // Should sort query params alphabetically: a, m, z
      expect(result).toContain('GET /api/test?a=first&m=middle&z=last\n');
    });

    it('should ignore non-allowed headers', () => {
      const testRequest: VerifiableRequest = {
        method: 'POST',
        path: '/test',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token', // Should be ignored
          'user-agent': 'test-agent', // Should be ignored
          'x-custom-header': 'custom', // Should be ignored
          'x-godaddy-signature': 'sig', // Should be ignored
          'x-store-id': 'store123',
        },
      };

      const result = canonicalizeRequest(testRequest);

      // Should only include allowed headers
      expect(result).toContain('content-type: application/json');
      expect(result).toContain('x-store-id: store123');
      expect(result).not.toContain('authorization');
      expect(result).not.toContain('user-agent');
      expect(result).not.toContain('x-custom-header');
      expect(result).not.toContain('x-godaddy-signature');
    });
  });

  describe('verifyAction with real signature', () => {
    it('should verify the provided signature and public key', async () => {
      // Real signature and public key from the user
      const signature =
        'OtanaOz66IJHZsMz0Id/W/h/GKY/8CdOu6nx9VlbgML+2IM3kF/ON2W4dM//dk2kjGWBLVp1OLxL2+fcBT9HQw==';
      const publicKeyBase64 =
        'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEPqMv7UipvIge7cD0tBc3eivMadZ6uS344tPKR5iUt7rYTcrRbUvPOG6SpdfsW2jPnuxx5Drq7zs9fXqmFE/SyA==';

      // Create the same request that produced the Go signer canonical string
      const testRequest: VerifiableRequest = {
        method: 'POST',
        path: '/v1/extensions/taxes-calculate',
        headers: {
          'content-length': '513',
          'content-type': 'application/json',
          'x-store-id': 'f9b38cc4-b127-44a3-8a8c-401a1302a849',
          // Add signature headers
          'x-godaddy-signature': signature,
          'x-godaddy-signature-algorithm': 'ECDSA-P256-SHA256',
          'x-godaddy-signature-version': '1.0',
          'x-godaddy-signature-timestamp': new Date().toISOString(), // Use current time
        },
        body: {
          destination: {
            address: {
              countryCode: 'US',
              postalCode: '94105',
              adminArea1: 'CA',
              adminArea2: 'San Francisco',
            },
          },
          lines: [
            {
              id: 'line_item_1',
              type: 'SKU',
              subtotalPrice: {
                value: 9999,
                currencyCode: 'USD',
              },
              quantity: 2,
              unitPrice: {
                value: 4999,
                currencyCode: 'USD',
              },
              classification: 'general',
              origin: null,
              destination: null,
            },
            {
              id: 'shipping',
              type: 'SHIPPING',
              subtotalPrice: {
                value: 599,
                currencyCode: 'USD',
              },
              quantity: 1,
              unitPrice: {
                value: 599,
                currencyCode: 'USD',
              },
              origin: null,
              destination: null,
            },
          ],
        },
      };

      // Convert base64 public key to ArrayBuffer
      const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), (c) =>
        c.charCodeAt(0),
      ).buffer;

      // Test with very generous timestamp tolerance
      const result = await verifyAction(testRequest, {
        publicKey: publicKeyBuffer,
        maxTimestampAgeSeconds: 86400, // 24 hours tolerance
      });

      // Debug output (keep console.log for test debugging)
      console.log('Verification result:', result);

      if (!result.success) {
        console.log('Verification failed:', result.error);
      }

      expect(result.success).toBe(true);
    });
  });
});
