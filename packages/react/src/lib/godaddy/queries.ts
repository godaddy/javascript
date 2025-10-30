import { graphql } from '@/gql.tada';

export const AddressMatchesQuery = graphql(`
    query CheckoutSessionWithAddressMatches($query: String!) {
      checkoutSession {
        id
        addresses(input: { query: $query }) {
          addressLine1
          addressLine2
          adminArea1
          adminArea3
          countryCode
          postalCode
        }
      }
    }
`);

export const DraftOrderQuery = graphql(`
  query DraftOrder {
      checkoutSession {
          id
          draftOrder {
              id
              statuses {
                  fulfillmentStatus
                  paymentStatus
                  status
              }
              shippingLines {
                  id
                  name
                  requestedProvider
                  requestedService
                  amount {
                      currencyCode
                      value
                  }
                  discounts {
                      id
                      name
                      amount {
                          value
                          currencyCode
                      }
                      code
                      ratePercentage
                      appliedBeforeTax
                      metafields {
                          key
                          value
                      }
                  }
              }
              lineItems {
                  externalId
                  fulfillmentMode
                  id
                  name
                  productId
                  quantity
                  status
                  tags
                  type
                  details {
                      productAssetUrl
                      selectedAddons {
                          attribute
                          sku
                          values {
                              costAdjustment {
                                  currencyCode
                                  value
                              }
                              name
                          }
                      }
                      selectedOptions {
                          attribute
                          values
                      }
                      sku
                      unitOfMeasure
                  }
                  discounts {
                      amount {
                          currencyCode
                          value
                      }
                      appliedBeforeTax
                      code
                      id
                      name
                      ratePercentage
                  }
                  fees {
                      appliedBeforeTax
                      id
                      name
                      ratePercentage
                  }
                  notes {
                      authorType
                      content
                      id
                  }
                  taxes {
                      exempted
                      id
                      included
                      name
                      ratePercentage
                  }
                  totals {
                      discountTotal {
                          currencyCode
                          value
                      }
                      feeTotal {
                          currencyCode
                          value
                      }
                      subTotal {
                          currencyCode
                          value
                      }
                      taxTotal {
                          currencyCode
                          value
                      }
                  }
                  unitAmount {
                      currencyCode
                      value
                  }
              }
              shipping {
                  firstName,
                  lastName,
                  email,
                  phone,
                  address {
                      addressLine1
                      addressLine2
                      addressLine3
                      adminArea1
                      adminArea2
                      adminArea3
                      adminArea4
                      countryCode
                      postalCode
                  }
              }
              billing {
                  firstName,
                  lastName,
                  email,
                  phone,
                  address {
                      addressLine1
                      addressLine2
                      addressLine3
                      adminArea1
                      adminArea2
                      adminArea3
                      adminArea4
                      countryCode
                      postalCode
                  }
              }
              notes {
                  authorType
                  content
                  id
              }
              discounts {
                  amount {
                      currencyCode
                      value
                  }
                  appliedBeforeTax
                  code
                  id
                  name
                  ratePercentage
              }
              totals {
                  discountTotal {
                      currencyCode
                      value
                  }
                  feeTotal {
                      currencyCode
                      value
                  }
                  shippingTotal {
                      currencyCode
                      value
                  }
                  subTotal {
                      currencyCode
                      value
                  }
                  taxTotal {
                      currencyCode
                      value
                  }
                  total {
                      currencyCode
                      value
                  }
              }
          }
      }
  }
  `);

export const DraftOrderSkusQuery = graphql(`
    query Skus {
        checkoutSession {
            id
            skus(first: 100) {
                edges {
                    node {
                        id
                        code
                        name
                        label
                        description
                        status
                        weight,
                        unitOfWeight
                        disableShipping
                        htmlDescription
                        prices {
                            currencyCode
                            value
                        }
                        attributes {
                            id
                            name
                            label
                            values {
                                id
                                name
                                label
                            }
                        }
                        attributeValues {
                            id
                            name
                            label
                        }
                        mediaUrls
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
    }
`);

export const DraftOrderTaxesQuery = graphql(`
    query Taxes($destination: TaxDestinationAddressInput, $lines: [TaxLineInput!]) {
        checkoutSession {
            id
            storeId
            draftOrder {
                id
                calculatedTaxes(destination: $destination, lines: $lines) {
                    totalTaxAmount {
                        currencyCode
                        value
                    }
                    taxAmounts {
                        rate {
                            id
                            name
                            label
                            calculationMethod
                            value {
                                appliedPercentage
                                appliedAmount {
                                    currencyCode
                                    value
                                }
                                amount {
                                    currencyCode
                                    value
                                }
                                percentage
                            }
                        }
                        totalTaxAmount {
                            currencyCode
                            value
                        }
                    }
                    lines {
                        calculationLine {
                            id
                        }
                        totalTaxAmount {
                            currencyCode
                            value
                        }
                        taxAmounts {
                            rate {
                                id
                                name
                                calculationMethod
                            }
                            totalTaxAmount {
                                currencyCode
                                value
                            }
                        }
                    }
                }
            }
        }
    }
`);

export const DraftOrderShippingRatesQuery = graphql(`
    query ShippingRates($destination: DestinationAddressInput) {
        checkoutSession {
            id
            storeId
            draftOrder {
                id
                calculatedShippingRates(destination: $destination) {
                    rates {
                        carrierCode
                        cost {
                            value
                            currencyCode
                        }
                        description
                        displayName
                        features
                        maxDeliveryDate
                        minDeliveryDate
                        serviceCode
                    }
                }
            }
        }
    }
`);

export const DraftOrderPriceAdjustmentsQuery = graphql(`
    query PriceAdjustments($discountCodes: [String!], $shippingLines: [PriceAdjustmentShippingLineInput!]) {
        checkoutSession {
            id
            storeId
            draftOrder {
                id
                calculatedAdjustments(discountCodes: $discountCodes, shippingLines: $shippingLines) {
#                    adjustments {
#                        adjustment {
#                            ... on CalculatedDiscount {
#                                description
#                                id
#                                label
#                                name
#                                value {
#                                    ... on AdjustmentAmount {
#                                        amount {
#                                            currencyCode
#                                            value
#                                        }
#                                    }
#                                    ... on AdjustmentPercentage {
#                                        maximumAmount {
#                                            currencyCode
#                                            value
#                                        }
#                                        percentage
#                                    }
#                                }
#                            }
#                            ... on CalculatedFee {
#                                description
#                                id
#                                label
#                                name
#                                value {
#                                    ... on AdjustmentAmount {
#                                        amount {
#                                            currencyCode
#                                            value
#                                        }
#                                    }
#                                    ... on AdjustmentPercentage {
#                                        maximumAmount {
#                                            currencyCode
#                                            value
#                                        }
#                                        percentage
#                                    }
#                                }
#                            }
#                        }
#                        totalAmount {
#                            currencyCode
#                            value
#                        }
#                    }
#                    lines {
#                        adjustments {
#                            adjustment {
#                                ... on CalculatedDiscount {
#                                    description
#                                    id
#                                    label
#                                    name
#                                    value {
#                                        ... on AdjustmentAmount {
#                                            amount {
#                                                currencyCode
#                                                value
#                                            }
#                                        }
#                                        ... on AdjustmentPercentage {
#                                            maximumAmount {
#                                                currencyCode
#                                                value
#                                            }
#                                            percentage
#                                        }
#                                    }
#                                }
#                                ... on CalculatedFee {
#                                    description
#                                    id
#                                    label
#                                    name
#                                    value {
#                                        ... on AdjustmentAmount {
#                                            amount {
#                                                currencyCode
#                                                value
#                                            }
#                                        }
#                                        ... on AdjustmentPercentage {
#                                            maximumAmount {
#                                                currencyCode
#                                                value
#                                            }
#                                            percentage
#                                        }
#                                    }
#                                }
#                            }
#                            totalAmount {
#                                currencyCode
#                                value
#                            }
#                        }
#                        calculationLine {
#                            id
#                            type
#                        }
#                        totalDiscountAmount {
#                            currencyCode
#                            value
#                        }
#                        totalFeeAmount {
#                            currencyCode
#                            value
#                        }
#                    }
                    totalDiscountAmount {
                        currencyCode
                        value
                    }
#                    totalFeeAmount {
#                        currencyCode
#                        value
#                    }
                }
            }
        }
    }
`);
