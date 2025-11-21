import { useMemo } from 'react';
import { useGoDaddyContext } from '@/godaddy-provider.tsx';

export const useGetPoyntCollectCdn = () => {
  const { apiHost } = useGoDaddyContext();
  const HOST = apiHost?.replace('api.', 'collect.commerce.') || '';

  return useMemo(() => {
    return `https://${HOST}/sdk.js`;
  }, [apiHost]);
};
