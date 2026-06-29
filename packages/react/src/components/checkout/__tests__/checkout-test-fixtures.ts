import type { DraftOrder } from '@/types';
import { getOperations } from './checkout-test-env';

export const noBillingAddress = {
  billing: {
    firstName: '',
    lastName: '',
    phone: '',
    email: 'jane@example.com',
    address: null,
  },
} satisfies Partial<DraftOrder>;

export function getLastUpdateInput() {
  return getOperations('UpdateCheckoutSessionDraftOrder').at(-1)?.input as
    | Record<string, unknown>
    | undefined;
}

export function getLastConfirmInput() {
  return getOperations('ConfirmCheckoutSession').at(-1)?.input as
    | Record<string, unknown>
    | undefined;
}
