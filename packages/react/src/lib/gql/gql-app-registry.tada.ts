import { initGraphQLTada } from 'gql.tada';
import type { introspection } from '@/lib/godaddy/app-registry-env';

export const graphql = initGraphQLTada<{
  introspection: typeof introspection;
  scalars: {
    DateTime: string;
    ID: string;
    JSONObject: Record<string, unknown>;
  };
}>();
