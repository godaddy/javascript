import { describe, expect, it } from 'vitest';
import { deriveId } from './derive-id';

const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('deriveId', () => {
  it('matches the RFC 9562 version 5 example', () => {
    // RFC 9562, Appendix A.4: the DNS namespace and "www.example.com".
    expect(deriveId(DNS_NAMESPACE, 'www.example.com')).toBe(
      '2ed6657d-e927-568b-95e1-2665a8aea6a2',
    );
    expect(deriveId(DNS_NAMESPACE.toUpperCase(), 'www.example.com')).toBe(
      '2ed6657d-e927-568b-95e1-2665a8aea6a2',
    );
  });

  it('is stable for a name and differs across names and namespaces', () => {
    const id = deriveId(DNS_NAMESPACE, 'a');
    expect(deriveId(DNS_NAMESPACE, 'a')).toBe(id);
    expect(deriveId(DNS_NAMESPACE, 'b')).not.toBe(id);
    expect(deriveId('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'a')).not.toBe(id);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('hashes the name as UTF-8', () => {
    expect(deriveId(DNS_NAMESPACE, 'café')).not.toBe(
      deriveId(DNS_NAMESPACE, 'cafe'),
    );
  });

  it('refuses a name with a lone surrogate, which would share an id', () => {
    expect(() => deriveId(DNS_NAMESPACE, 'a\uD800')).toThrow(TypeError);
    expect(deriveId(DNS_NAMESPACE, '😀')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('refuses a namespace that is not a UUID', () => {
    for (const namespace of [
      '',
      'not-a-uuid',
      '6ba7b8109dad11d180b400c04fd430c8',
    ]) {
      expect(() => deriveId(namespace, 'a')).toThrow(TypeError);
    }
  });
});
