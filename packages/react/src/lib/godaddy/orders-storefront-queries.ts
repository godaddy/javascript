import { graphql } from '@/lib/gql/gql-orders-storefront.tada';

export const GetCartOrderQuery = graphql(`
  query GetCartOrder($id: ID!) {
    orderById(id: $id) {
      id
      customerId
      createdAt
      updatedAt
      context {
        storeId
        channelId
      }
      lineItems {
        id
        name
        quantity
        skuId
        type
        fulfillmentMode
        details {
          productAssetUrl
          sku
          unitOfMeasure
          selectedOptions {
            attribute
            values
          }
          selectedAddons {
            attribute
            sku
            values {
              name
              costAdjustment {
                value
                currencyCode
              }
            }
          }
        }
        totals {
          subTotal {
            value
            currencyCode
          }
          taxTotal {
            value
            currencyCode
          }
          discountTotal {
            value
            currencyCode
          }
          feeTotal {
            value
            currencyCode
          }
        }
        discounts {
          id
          name
          code
          amount {
            value
            currencyCode
          }
          ratePercentage
        }
        taxes {
          id
          name
          amount {
            value
            currencyCode
          }
          ratePercentage
        }
        notes {
          id
          content
          author
          authorType
        }
      }
      totals {
        subTotal {
          value
          currencyCode
        }
        shippingTotal {
          value
          currencyCode
        }
        taxTotal {
          value
          currencyCode
        }
        discountTotal {
          value
          currencyCode
        }
        productDiscountTotal {
          value
          currencyCode
        }
        shippingDiscountTotal {
          value
          currencyCode
        }
        feeTotal {
          value
          currencyCode
        }
        total {
          value
          currencyCode
        }
      }
      discounts {
        id
        name
        code
        amount {
          value
          currencyCode
        }
        ratePercentage
        appliedBeforeTax
      }
      taxes {
        id
        name
        amount {
          value
          currencyCode
        }
        ratePercentage
        included
        exempted
      }
      shipping {
        firstName
        lastName
        email
        phone
        companyName
        address {
          addressLine1
          addressLine2
          addressLine3
          adminArea1
          adminArea2
          adminArea3
          adminArea4
          postalCode
          countryCode
        }
      }
      notes {
        id
        content
        author
        authorType
        createdAt
      }
      tags
    }
  }
`);
