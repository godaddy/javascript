import { graphql } from '@/lib/gql/gql-app-registry.tada.ts';

export const GetEnabledApplicationsQuery = graphql(`
  query GetEnabledApplications(
    $entityId: String!
    $entityType: String!
    $target: String!
  ) {
    enabledApplications(
      entityId: $entityId
      entityType: $entityType
      uiExtensionTargets: { has: $target }
    ) {
      id
      name
      release {
        id
        version
        uiExtensions(target: { has: $target }) {
          id
          name
          handle
          source
          cdnUrl
          type
          target
        }
      }
    }
  }
`);

export const GetEnabledStoreUiExtensionAppsQuery = GetEnabledApplicationsQuery;
