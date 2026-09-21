import type { CommerceClient } from './client';
import type { Session } from './types';
import { navigationUrl } from './url';

/** Navigate to Commerce's hosted session without treating the handoff as payment completion. */
export function redirectToCheckout(
  client: CommerceClient,
  session: Session
): void {
  try {
    window.location.assign(navigationUrl(session.url));
  } finally {
    // Release transient state for failed navigation and browser back/forward restoration.
    // Keep the saved cart; hosted order/payment status determines whether it was purchased.
    client.closeCheckout();
  }
}
