import { graphql } from '@/lib/gql/gql-checkout.tada.ts';

export const GetCheckoutSessionQuery = graphql(`
    query GetCheckoutSession {
        checkoutSession {
            id
            token
            url
            sourceApp
            returnUrl
            successUrl
            storeId
            channelId
            businessId
            customerId
            storeName
            environment
            enableTips
            enabledLocales
            enableSurcharge
            enableLocalPickup
            enableShipping
            enablePhoneCollection
            enableNotesCollection
            enablePromotionCodes
            enableTaxCollection
            enableShippingAddressCollection
            enableBillingAddressCollection
            enableAddressAutocomplete
            appearance {
                theme
                variables {
                    fontSans
                    fontSerif
                    fontMono
                    defaultFontFamily
                    background
                    secondaryBackground
                    foreground
                    card
                    cardForeground
                    popover
                    popoverForeground
                    primary
                    primaryForeground
                    secondary
                    secondaryForeground
                    muted
                    mutedForeground
                    accent
                    accentForeground
                    destructive
                    destructiveForeground
                    border
                    input
                    ring
                    radius
                }
            }
            experimental_rules {
              freeShipping {
                enabled
                  minimumOrderTotal
              }
            }
            shipping {
              originAddress {
                addressLine1
                addressLine2
                addressLine3
                postalCode
                countryCode
                adminArea1
                adminArea2
                adminArea3
                adminArea4
              }
            }
            paymentMethods {
              card {
                processor
                checkoutTypes
              }
              express {
                processor
                checkoutTypes
              }
              applePay {
                processor
                checkoutTypes
              }
              googlePay {
                processor
                checkoutTypes
              }
              paypal {
                processor
                checkoutTypes
              }
              paze {
                processor
                checkoutTypes
              }
              offline {
                processor
                checkoutTypes
              }
              mercadopago {
                processor
                checkoutTypes
              }
            }
            locations {
              id
              isDefault
              address {
                addressLine1
                addressLine2
                addressLine3
                postalCode
                countryCode
                adminArea1
                adminArea2
                adminArea3
                adminArea4
              }
              operatingHours {
                pickupWindowInDays
                leadTime
                timeZone
                hours {
                  monday {
                    enabled
                    openTime
                    closeTime
                  }
                  tuesday {
                    enabled
                    openTime
                    closeTime
                  }
                  wednesday {
                    enabled
                    openTime
                    closeTime
                  }
                  thursday {
                    enabled
                    openTime
                    closeTime
                  }
                  friday {
                    enabled
                    openTime
                    closeTime
                  }
                  saturday {
                    enabled
                    openTime
                    closeTime
                  }
                  sunday {
                    enabled
                    openTime
                    closeTime
                  }
                }
              }
            }
            defaultOperatingHours {
              pickupWindowInDays
              leadTime
              timeZone
              hours {
                monday {
                  enabled
                  openTime
                  closeTime
                }
                tuesday {
                  enabled
                  openTime
                  closeTime
                }
                wednesday {
                  enabled
                  openTime
                  closeTime
                }
                thursday {
                  enabled
                  openTime
                  closeTime
                }
                friday {
                  enabled
                  openTime
                  closeTime
                }
                saturday {
                  enabled
                  openTime
                  closeTime
                }
                sunday {
                  enabled
                  openTime
                  closeTime
                }
              }
            }
            draftOrder {
                id
                statuses {
                    fulfillmentStatus
                    paymentStatus
                    status
                }
                totals {
                    subTotal {
                        currencyCode
                        value
                    }
                }
            }
        }
    }
`);

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
    query Taxes($destination: TaxDestinationAddressInput, $lines: [TaxLineInput!], $discountAdjustments: CalculatedAdjustmentsInput) {
        checkoutSession {
            id
            storeId
            draftOrder {
                id
                calculatedTaxes(destination: $destination, lines: $lines, discountAdjustments: $discountAdjustments) {
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
                    adjustments {
                        adjustment {
                            ... on CalculatedDiscount {
                                description
                                id
                                label
                                name
                            }
                            ... on CalculatedFee {
                                description
                                id
                                label
                                name
                            }
                        }
                        totalAmount {
                            currencyCode
                            value
                        }
                    }
                    lines {
                        calculationLine {
                            id
                            type
                        }
                        adjustments {
                            adjustment {
                                ... on CalculatedDiscount {
                                    description
                                    id
                                    label
                                    name
                                }
                                ... on CalculatedFee {
                                    description
                                    id
                                    label
                                    name
                                }
                            }
                            totalAmount {
                                currencyCode
                                value
                            }
                        }
                        totalDiscountAmount {
                            currencyCode
                            value
                        }
                        totalFeeAmount {
                            currencyCode
                            value
                        }
                    }
                    totalDiscountAmount {
                        currencyCode
                        value
                    }
                    totalFeeAmount {
                        currencyCode
                        value
                    }
                }
            }
        }
    }
`);
