import { graphql } from '@/gql.tada';

export const CreateCheckoutSessionMutation = graphql(`
  mutation CreateCheckoutSession($input: MutationCreateCheckoutSessionInput!) {
    createCheckoutSession(input: $input) {
      id
      token
      sourceApp
      returnUrl
      successUrl
      storeId
      channelId
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
      }
      draftOrder {
        id
        statuses {
          status
        }
        totals {
          total {
            currencyCode
            value
          }
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
    }
  }
`);

export const VerifyCheckoutSessionAddressMutation = graphql(`
  mutation VerifyCheckoutSessionAddress($input: MutationVerifyAddressInput!) {
    verifyAddress(input: $input) {
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
`);

export const UpdateCheckoutSessionDraftOrderMutation = graphql(`
    mutation UpdateCheckoutSessionDraftOrder($input: MutationUpdateCheckoutSessionDraftOrderInput!) {
        updateCheckoutSessionDraftOrder(input: $input) {
          id
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
`);

export const CalculateCheckoutSessionTaxesMutation = graphql(`
    mutation CalculateCheckoutSessionTaxes($destination: TaxDestinationAddressInput) {
        calculateCheckoutSessionTaxes(destination: $destination) {
        totalTaxAmount {
          value
          currencyCode
        }
      }
    }
`);

export const ApplyCheckoutSessionDiscountMutation = graphql(`
    mutation ApplyCheckoutSessionDiscount($input: MutationApplyCheckoutSessionDiscountInput!, $sessionId: String!)  {
      applyCheckoutSessionDiscount(input: $input, sessionId: $sessionId) {
          id
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
          shippingLines {
            discounts {
              id
              amount {
                currencyCode
                value
              }
              appliedBeforeTax
              code
            }
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
            total {
              currencyCode
              value
            }
          }
      }
    }
`);

export const ConfirmCheckoutSessionMutation = graphql(`
  mutation ConfirmCheckoutSession($input: MutationConfirmCheckoutSessionInput!, $sessionId: String!)  {
        confirmCheckoutSession(input: $input, sessionId: $sessionId) {
          status
        }
    }
`);

export const ApplyCheckoutSessionShippingMethodMutation = graphql(`
  mutation ApplyCheckoutSessionShippingMethod($input: [ApplyShippingMethodInput!]!)  {
    applyCheckoutSessionShippingMethod(input: $input) {
      status
      draftOrder {
        totals {
          shippingTotal {
            currencyCode
            value
          }
        }
      }
    }
  }
`);

export const ApplyCheckoutSessionDeliveryMethodMutation = graphql(`
  mutation ApplyCheckoutSessionDeliveryMethod($input: MutationApplyCheckoutSessionDeliveryMethodInput!)  {
    applyCheckoutSessionDeliveryMethod(input: $input) {
      status
    }
  }
`);

export const RemoveAppliedCheckoutSessionShippingMethodMutation = graphql(`
    mutation RemoveAppliedCheckoutSessionShippingMethod($input: RemoveShippingMethodInput!)  {
      removeAppliedCheckoutSessionShippingMethod(input: $input) {
        status
        draftOrder {
          totals {
            shippingTotal {
              currencyCode
              value
            }
          }
        }
      }
    }
`);

export const ApplyCheckoutSessionFulfillmentLocationMutation = graphql(`
    mutation ApplyCheckoutSessionFulfillmentLocation($input: MutationApplyCheckoutSessionFulfillmentLocationInput!) {
        applyCheckoutSessionFulfillmentLocation(input: $input) {
            status
        }
    }
`);

export const ExchangeCheckoutTokenMutation = graphql(`
    mutation ExchangeCheckoutToken($input: MutationExchangeCheckoutTokenInput!) {
        exchangeCheckoutToken(input: $input) {
            jwt
            expiresAt
            expiresIn
        }
    }
`);

export const RefreshCheckoutTokenMutation = graphql(`
    mutation RefreshCheckoutToken {
        refreshCheckoutToken {
            jwt
            expiresAt
            expiresIn
        }
    }
`);
