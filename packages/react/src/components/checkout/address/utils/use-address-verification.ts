import { useQuery } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useCheckoutApi } from '@/hooks/use-checkout-api';

/**
 * Address input for verification
 */
export interface AddressVerificationInput {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postalCode: string;
  countryCode: string;
  adminArea1?: string;
  adminArea2?: string;
  adminArea3?: string;
  adminArea4?: string;
}

/**
 * Hook to verify an address
 * @param address The address to verify
 * @param options Additional options for the query
 * @param options.enabled Whether the query should be enabled
 * @returns Query result with verified address data
 */
export function useAddressVerification(
  address: AddressVerificationInput,
  options: {
    enabled: boolean;
  } = { enabled: true }
) {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);

  const queryKey = [
    'verifyAddressQuery',
    {
      sessionId: session?.id,
      addressLine1: address?.addressLine1?.toLowerCase(),
      postalCode: address?.postalCode?.toLowerCase(),
      countryCode: address?.countryCode?.toLowerCase(),
      city: address?.adminArea3?.toLowerCase(),
      state: address?.adminArea1?.toLowerCase(),
    },
  ];

  return useQuery({
    queryKey,
    queryFn: async () => api.verifyAddress(address),
    enabled:
      options.enabled &&
      !!session?.id &&
      !!address?.addressLine1 &&
      !!address?.postalCode &&
      !!address?.countryCode,
    select: data => data.verifyAddress,
  });
}
