import { useGoDaddyContext } from '@/godaddy-provider.tsx';

export type Environment = 'prod' | 'test' | 'dev';

export const useGetEnvFromContext = (): Environment => {
  const { apiHost } = useGoDaddyContext();

  if (apiHost?.includes('.test-')) {
    return 'test';
  }
  if (apiHost?.includes('.dev-')) {
    return 'dev';
  }
  return 'prod';
};
