# @godaddy/react

## 0.12.50

### Patch Changes

- add minification to build

## 0.12.49

### Patch Changes

- lazy load payment components and remove unused components

## 0.12.48

### Patch Changes

- add payment_start event and clean up event names

## 0.12.47

### Patch Changes

- remove error throw for square if totals <= zero as free payment route should replace

## 0.12.46

### Patch Changes

- move paze from express to standard payment method
- fix free order flows
- use totals.total.value for order totals instead of calculating from line items
- restore previous shipping method if application fails

## 0.12.45

### Patch Changes

- set offline payment type if free order and filter empty fields from order updates

## 0.12.44

### Patch Changes

- check for enableTaxCollection in express checkout flows

## 0.12.43

### Patch Changes

- fix order syncing for bulk autofill and add shippingLine coupon code handling

## 0.12.42

### Patch Changes

- All country select regions and updated translations
- Updated dependencies
  - @godaddy/localizations@0.3.5

## 0.12.41

### Patch Changes

- Fix shipping method apply even if single method is returned

## 0.12.40

### Patch Changes

- add payment descriptions and allow zero pickupWindowInDays
- Updated dependencies
  - @godaddy/localizations@0.3.4

## 0.12.39

### Patch Changes

- Updated dependencies
  - @godaddy/localizations@0.3.3

## 0.12.38

### Patch Changes

- add missing adminArea1 to express checkout

## 0.12.37

### Patch Changes

- fix express checkout lineitems totals for tax rate query

## 0.12.36

### Patch Changes

- disable payment if any fetching or mutating is in progress

## 0.12.35

### Patch Changes

- Add state to express checkout shipping method call

## 0.12.34

### Patch Changes

- clear payment errors
- remove free shipping based upon value for freeShipping experimental_rule
- display line item options

## 0.12.33

### Patch Changes

- Add coupon codes to godaddy express checkout

## 0.12.32

### Patch Changes

- adjust pickup time slot logic for location timezone

## 0.12.31

### Patch Changes

- replace "discount" with "coupon" for i18n. include customerId in order. Style adjustments for express and free payments
- Updated dependencies
  - @godaddy/localizations@0.3.2

## 0.12.30

### Patch Changes

- add image placeholders for line items

## 0.12.29

### Patch Changes

- reapply discounts on shipping method change, apply initial shipping method to collect express checkout

## 0.12.28

### Patch Changes

- Validation fixes for delivery methods

## 0.12.27

### Patch Changes

- disable payment confirmation state on failure

## 0.12.26

### Patch Changes

- paypal checkout, confirm checkout disabled states

## 0.12.25

### Patch Changes

- add notes syncing and validation for local pickup/shipping

## 0.12.9

### Patch Changes

- allow offline payments if total is zero

## 0.12.8

### Patch Changes

- add isCheckoutDisabled support. Add shipping and taxes support for godaddy express checkout
- Updated dependencies
  - @godaddy/localizations@0.2.4

## 0.12.7

### Patch Changes

- mobile summary updates

## 0.12.6

### Patch Changes

- Layout changes for singular options and disabled payment on mutations

## 0.12.5

### Patch Changes

- add fulfillment data to confirmCheckout payload for local pickup

## 0.12.4

### Patch Changes

- line item loading states, mobile total order in dollars

## 0.12.3

### Patch Changes

- dupe version fix

## 0.12.2

### Patch Changes

- case insensitive discounts

## 0.12.0

### Minor Changes

- add shipping method mutations

## 0.11.0

### Minor Changes

- add localization, shipping and tax extension calls

## 0.10.0

### Minor Changes

- Add godaddy and stripe CC payment methods

## 0.9.0

### Minor Changes

- Add tracking initialization and custom font variable support

## 0.8.0

### Minor Changes

- add initial payment method support infrastructure

## 0.7.1

### Patch Changes

- fixing publish permissions

## 0.7.0

### Minor Changes

- Add ability to extend checkout form validation schema

## 0.5.0

### Minor Changes

- 648aa74: Enable country

## 0.4.0

### Minor Changes

- Add discount export and fix address without google

## 0.3.0

### Minor Changes

- c94a3ea: add default provider

## 0.2.0

### Minor Changes

- Update types

## 0.1.0

### Minor Changes

- pre-release
