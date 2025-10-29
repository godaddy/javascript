import { initGraphQLTada } from 'gql.tada';
import type { introspection } from '@/lib/godaddy/graphql-env';

export const graphql = initGraphQLTada<{
  introspection: typeof introspection;
  scalars: {
    DateTime: string;
    ID: string;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
export { readFragment } from 'gql.tada';
