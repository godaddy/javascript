import { initGraphQLTada } from 'gql.tada';
import type { introspection } from '@/lib/godaddy/storefront-env';

export const graphqlStorefront = initGraphQLTada<{
  introspection: typeof introspection;
  scalars: {
    DateTime: string;
    ID: string;
  };
}>();
