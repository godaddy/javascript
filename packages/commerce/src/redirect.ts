import type { CommerceClient } from './client';
import { CommerceError, type Session } from './types';

/** Navigate to Commerce's hosted session without treating the handoff as payment completion. */
export function redirectToCheckout(
  client: CommerceClient,
  session: Session
): void {
  try {
    const url = new URL(session.url);
    if (!['https:', 'http:'].includes(url.protocol)) {
      throw new CommerceError(
        'INVALID_URL',
        'Hosted checkout requires an HTTP or HTTPS URL'
      );
    }
    window.location.assign(session.url);
  } finally {
    // Release transient state for failed navigation and browser back/forward restoration.
    // Keep the saved cart; hosted order/payment status determines whether it was purchased.
    client.closeCheckout();
  }
}
