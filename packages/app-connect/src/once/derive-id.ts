import { createHash } from 'node:crypto';
import { isWellFormed } from './store';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A name-based id (RFC 9562 version 5 UUID): the same namespace and name
 * always give the same id, and different names give different ids.
 *
 * Use it for ids that must not change across retries, such as a once key, an
 * idempotency key sent to a vendor, or the id of a record written for an
 * outside event: `deriveId(MY_APP_NAMESPACE, storeId + ':sale:' + paymentId)`.
 * Pick one random namespace UUID per app and never change it, or every
 * derived id changes with it.
 *
 * @param namespace A UUID, in the usual 8-4-4-4-12 hex form
 * @param name Any string; it is hashed as UTF-8
 * @returns A lowercase UUID string
 */
export function deriveId(namespace: string, name: string): string {
  if (!UUID.test(namespace)) {
    throw new TypeError('deriveId: the namespace must be a UUID');
  }
  if (!isWellFormed(name)) {
    // A lone surrogate hashes as U+FFFD, so two names would share an id.
    throw new TypeError(
      'deriveId: the name must be well-formed text (no lone surrogates)',
    );
  }
  const hash = createHash('sha1')
    .update(Buffer.from(namespace.replace(/-/g, ''), 'hex'))
    .update(name, 'utf8')
    .digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
