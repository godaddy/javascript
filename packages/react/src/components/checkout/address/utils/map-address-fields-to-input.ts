import type { UpdateDraftOrderInput } from '@/types';

export function mapAddressFieldsToInput<T extends Record<string, unknown>>(
  fields: T,
  sectionKey: 'shipping' | 'billing',
  useShippingAddress: boolean
): Omit<UpdateDraftOrderInput['input'], 'context'> {
  const input: Omit<UpdateDraftOrderInput['input'], 'context'> = {};
  if (sectionKey === 'shipping' && useShippingAddress) {
    input.shipping = { ...fields };
    input.billing = { ...fields };
  } else {
    input[sectionKey] = { ...fields };
  }

  return input;
}
