import { useMemo } from 'react';
import { useGetEnvFromContext } from '@/components/checkout/utils/use-get-env-from-context.ts';

export const useGetPoyntCollectCdn = () => {
  const environment = useGetEnvFromContext();

  return useMemo(() => {
    switch (environment) {
      case 'prod':
        return 'https://collect.commerce.godaddy.com/sdk.js';
      case 'ote':
        return 'https://collect.commerce.ote-godaddy.com/sdk.js';
      case 'test':
        return 'https://collect.commerce.test-godaddy.com/sdk.js';
      case 'dev':
        return 'https://collect.commerce.dev-godaddy.com/sdk.js';
      default:
        return 'https://collect.commerce.godaddy.com/sdk.js';
    }
  }, [environment]);
};
