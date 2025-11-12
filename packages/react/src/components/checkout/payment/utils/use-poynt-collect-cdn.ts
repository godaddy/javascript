import { useMemo } from 'react';
import { useGetEnvFromContext } from '@/components/checkout/utils/use-get-env-from-context.ts';

export const useGetPoyntCollectCdn = () => {
  const environment = useGetEnvFromContext();

  return useMemo(() => {
    switch (environment) {
      case 'prod':
        return 'https://cdn.poynt.net/collect.js';
      case 'test':
        return 'https://cdn.poynt.net/test/collect-test.js';
      case 'dev':
        return 'https://cdn.poynt.net/ci/collect-ci.js';
      default:
        return 'https://cdn.poynt.net/collect.js';
    }
  }, [environment]);
};
