import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export function useIsPaymentDisabled(): boolean {
  const isMutating = useIsMutating();
  const isFetching = useIsFetching();

  return isMutating > 0 || isFetching > 0;
}
