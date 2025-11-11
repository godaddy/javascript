import { initGraphQLTada } from 'gql.tada';
import type { introspection } from '@/lib/godaddy/catalog-storefront-env';

export const graphql = initGraphQLTada<{
  introspection: typeof introspection;
  scalars: {
    DateTime: string;
    ID: string;
  };
}>();
