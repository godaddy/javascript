import { graphql } from '@/lib/gql/gql-orders-storefront.tada';

export const AddCartOrderMutation = graphql(`
  mutation AddCartOrder($input: AddDraftOrderInput!) {
    addDraftOrder(input: $input) {
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
        feeTotal {
          value
          currencyCode
        }
        total {
          value
          currencyCode
        }
      }
    }
  }
`);

export const AddLineItemBySkuIdMutation = graphql(`
  mutation AddLineItemBySkuId($input: AddLineItemInput!) {
    addLineItemBySkuId(input: $input) {
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
      createdAt
      updatedAt
    }
  }
`);

export const UpdateCartOrderMutation = graphql(`
  mutation UpdateCartOrder($input: UpdateDraftOrderInput!) {
    updateDraftOrder(input: $input) {
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
        feeTotal {
          value
          currencyCode
        }
        total {
          value
          currencyCode
        }
      }
    }
  }
`);

export const DeleteLineItemByIdMutation = graphql(`
  mutation DeleteLineItemById($id: ID!, $orderId: ID!) {
    deleteLineItemById(id: $id, orderId: $orderId)
  }
`);

export const ApplyDiscountCodesMutation = graphql(`
  mutation ApplyDiscountCodes($input: ApplyDiscountCodesInput!) {
    applyDiscountCodes(input: $input) {
      id
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
    }
  }
`);

export const UpdateLineItemByIdMutation = graphql(`
  mutation UpdateLineItemById($input: UpdateLineItemByIdInput!) {
    updateLineItemById(input: $input) {
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
      updatedAt
    }
  }
`);
