import { graphql } from '@/lib/gql/gql-storefront.tada';

export const SkuGroupsQuery = graphql(`
    query SkuGroups($first: Int, $after: String, $id: SKUGroupIdsFilter) {
        skuGroups(first: $first, after: $after, id: $id) {
            edges {
                cursor
                node {
                    id
                    name
                    label
                    description
                    htmlDescription
                    type
                    priceRange {
                        min
                        max
                    }
                    compareAtPriceRange {
                        min
                        max
                    }
                    mediaObjects(first: 25) {
                        edges {
                            node {
                                url
                                type
                            }
                        }
                    }
                }
            }
            pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
            }
        }
    }
`);
