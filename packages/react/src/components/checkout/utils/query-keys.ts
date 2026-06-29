export const checkoutMutationKeys = {
  updateDraftOrder: (sessionId?: string | null) =>
    ['update-draft-order', { sessionId }] as const,
  updateDraftOrderTaxes: (sessionId?: string | null) =>
    ['update-draft-order-taxes', { sessionId }] as const,
  updateDraftOrderFees: (sessionId?: string | null) =>
    ['update-draft-order-fees', { sessionId }] as const,
  applyShippingMethod: (sessionId?: string | null) =>
    ['apply-shipping-method', { sessionId }] as const,
  removeShippingMethod: (sessionId?: string | null) =>
    ['remove-shipping-method', { sessionId }] as const,
  applyDiscount: (sessionId?: string | null) =>
    ['apply-discount', { sessionId }] as const,
  applyDeliveryMethod: (sessionId?: string | null) =>
    ['apply-delivery-method', { sessionId }] as const,
  applyFulfillmentLocation: (sessionId?: string | null) =>
    ['apply-fulfillment-location', { sessionId }] as const,
  getShippingMethodByAddress: (sessionId?: string | null) =>
    ['get-shipping-method-by-address', { sessionId }] as const,
  getPriceAdjustments: (sessionId?: string | null) =>
    ['get-price-adjustments-by-discount-code', { sessionId }] as const,
  getTaxes: (sessionId?: string | null) =>
    ['get-taxes-without-order', { sessionId }] as const,
  stripePaymentIntent: (sessionId?: string | null) =>
    ['stripe-payment-intent', { sessionId }] as const,
};

export const checkoutQueryKeys = {
  draftOrder: (sessionId?: string | null) =>
    ['draft-order', { sessionId }] as const,
  draftOrderProducts: (sessionId?: string | null) =>
    ['draft-order-products', { sessionId }] as const,
  draftOrderShippingMethods: (sessionId?: string | null) =>
    ['draft-order-shipping-methods', { sessionId }] as const,
};
