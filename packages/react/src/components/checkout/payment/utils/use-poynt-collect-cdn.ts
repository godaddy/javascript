import { useMemo } from 'react';
import { getEnvVar } from '@/lib/utils';

export const useGetPoyntCollectCdn = () => {
  const environment = getEnvVar('GODADDY_ENV') || 'prod';

  return useMemo(() => {
    switch (environment) {
      case 'prod':
        return 'https://cdn.poynt.net/collect.js';
      case 'test':
        return 'https://cdn.poynt.net/test/collect-test.js';
      case 'dev':
        return 'https://cdn.poynt.net/ci/collect-ci.js';
      default:
        return 'https://cdn.poynt.net/ci/collect-ci.js';
    }
  }, [environment]);
};
