import { graphql } from '@/lib/gql/gql-storefront.tada';

export const SkuGroupsQuery = graphql(`
    query SkuGroups($first: Int, $after: String, $id: SKUGroupIdsFilter, $attributeValues: [String!] = []) {
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
                    attributes {
                        edges {
                            node {
                                id
                                name
                                label
                                description
                                htmlDescription
                                values(first: 50) {
                                    edges {
                                        node {
                                            id
                                            name
                                            label
                                        }
                                    }
                                }
                            }
                        }
                    }
                    skus(attributeValues: { has: $attributeValues }) {
                        edges {
                            node {
                                id
                                label
                                name
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

export const SkuQuery = graphql(`
    query Sku($id: String!) {
        sku(id: $id) {
            id
            label
            name
            description
            htmlDescription
            code
            prices {
                edges {
                    node {
                        id
                        value {
                            value
                            currencyCode
                        }
                        compareAtValue {
                            value
                            currencyCode
                        }
                    }
                }
            }
            inventoryCounts {
                edges {
                    node {
                        id
                        quantity
                        type
                    }
                }
            }
            mediaObjects {
                edges {
                    node {
                        id
                        url
                        type
                        label
                        position
                    }
                }
            }
            attributeValues {
                edges {
                    node {
                        id
                        name
                        label
                    }
                }
            }
        }
    }
`);
