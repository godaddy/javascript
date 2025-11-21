import { useMemo } from 'react';
import { useGetEnvFromContext } from '@/components/checkout/utils/use-get-env-from-context.ts';
import { useGoDaddyContext } from '@/godaddy-provider.tsx';

export const useGetPoyntCollectCdn = () => {
  const { apiHost } = useGoDaddyContext();
  const HOST = apiHost?.replace('api.', 'collect.commerce.') || '';

  return useMemo(() => {
    return `https://${HOST}/sdk.js`;
  }, [apiHost]);
};
