export const eventIds = {
  // Delivery events
  changeDeliveryMethod: 'change_delivery_method.click',

  // Address events
  changeCountry: 'change_country.click',
  changeRegion: 'change_region.click',

  // Contact events
  changeEmail: 'change_email.click',
  changePhoneNumber: 'change_phone_number.click',
  changePhoneCountry: 'change_phone_country.click',

  // Discount events
  applyCoupon: 'checkout.apply_coupon.click',
  removeDiscount: 'remove_discount.click',
  discountError: 'discount_error.event',

  // Express checkout events
  expressCheckoutImpression: 'express_checkout.impression',
  expressApplePayImpression: 'express_apple_pay.impression',
  expressGooglePayImpression: 'express_google_pay.impression',
  expressApplePayClick: 'express_apple_pay.click',
  expressGooglePayClick: 'express_google_pay.click',
  expressApplePayCompleted: 'express_apple_pay_completed.event',
  expressGooglePayCompleted: 'express_google_pay_completed.event',
  pazePayImpression: 'paze_pay.impression',
  pazePayClick: 'paze_pay.click',
  pazePayCompleted: 'paze_pay_completed.event',
  expressCheckoutError: 'express_checkout_error.event',
  // Express checkout coupon events
  expressApplyCouponEvent: 'express_checkout_apply_coupon.event',
  expressRemoveCouponEvent: 'express_checkout_remove_coupon.event',

  // Form events
  submitCheckoutForm: 'submit_checkout_form.click',
  formError: 'form_error.event',
  formValidationError: 'form_validation_error.event',
  checkoutStart: 'checkout_start.impression',
  checkoutComplete: 'checkout_complete.event',
  checkoutError: 'checkout_error.event',

  // Payment events
  selectPaymentMethod: 'select_payment_method.click',
  toggleSameAsBillingAddress: 'toggle_same_as_billing_address.click',
  paymentStart: 'payment_start.event',

  // Shipping events
  selectShippingMethod: 'select_shipping_method.click',

  // Pickup events
  selectPickupLocation: 'select_pickup_location.click',
  changePickupDate: 'change_pickup_date.click',
  changePickupTime: 'change_pickup_time.click',

  // Tips events
  selectTipAmount: 'select_tip_amount.click',
  enterCustomTip: 'enter_custom_tip.click',

  // Notes events
  addOrderNote: 'add_order_note.click',
} as const;
