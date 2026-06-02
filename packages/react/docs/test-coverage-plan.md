# Checkout Test Coverage Plan

> **Status:** Ready for pickup
> **Scope:** `packages/react/src/components/checkout/**`
> **Out of scope:** Payment-method SDK internals (Stripe Elements, PayPal SDK, Apple Pay JS, Google Pay JS, Paze SDK, GoDaddy Express SDK, GoDaddy `tokenize.js` internals). Tests *around* these (gating, payload building, button visibility) are in scope.
> **Goal:** Bring `__tests__/` coverage to ~100% of feature behavior for everything that is not an external payment SDK call. Lock in tracking-event contracts. Make pure transformers unit-tested.

---

## How to work this plan

1. Pick the next un-checked `[ ]` task from the priority order. Tasks are numbered `T-###` for cross-referencing.
2. **Always read the existing test before writing a new one.** The infra in `__tests__/checkout-test-env.tsx`, `checkout-test-utils.tsx`, and `checkout-test-fixtures.ts` already provides the building blocks for nearly every scenario below.
3. Prefer adding to an **existing** test file when the gap is in the same area (e.g., a new tip edge case goes in `checkout-tips.test.tsx`). Create a **new** file only when the area has no home, or when the gap is a pure-unit test that lives next to its source (`*.test.ts(x)` co-located).
4. Run after each task:
   ```
   pnpm --filter @godaddy/react test --run -t "<describe or test name>"
   pnpm --filter @godaddy/react test
   pnpm --filter @godaddy/react typecheck
   ```
5. Update this file: flip `[ ]` → `[x]` and add a one-line note with the test file + describe block where the coverage now lives. Commit per task or per cluster.
6. If a test reveals a real bug, do **not** "fix" it inside the test PR. File it, mark the task `[!]` with a note, and move on.

### Conventions

- Test files live in either `packages/react/src/components/checkout/__tests__/` (integration) or co-located as `*.test.ts(x)` next to the source (pure unit).
- Use `renderCheckout`, `mockGodaddyApi`, `getOperations`, `clearOperations`, `waitForCheckoutReady`, `advanceCheckoutDebounce`, `flushPromises` from `checkout-test-utils.tsx`. Do **not** reach into React Query directly unless an existing test does so.
- For tracking assertions, mock `@/tracking/track` once at the top of the file:
  ```ts
  vi.mock('@/tracking/track', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/tracking/track')>();
    return { ...actual, track: vi.fn() };
  });
  ```
  then assert against `vi.mocked(track).mock.calls`.
- For currency / minor-unit / phone-format unit tests, prefer co-located `*.test.ts` (no React).
- Use the localized strings from `enUs` (`@godaddy/localizations`) when asserting copy. Avoid loose `/enter|required/i` regexes in new tests — they hide real regressions.

---

## Phase 0 — Test infrastructure improvements

These unblock several later tasks. Do them first.

- [x] **T-001** `setApiErrorOnce(key, error?)` added to `checkout-test-utils.tsx`. Uses the `MockGodaddyApiErrorKey` (API-key) form for consistency with `setApiError`. Documented in `__tests__/README.md`.
- [x] **T-002** `getOperationOrder(names)` added to `checkout-test-utils.tsx`; `checkout-payment-flush.test.tsx` migrated to use it.
- [x] **T-003** Wired up. The actual function used is `getDraftOrderPriceAdjustments` (the existing `getPriceAdjustments` mock in `tests/setup.ts` was misnamed; both names are now mocked). Default response is `{ adjustments: [] }`. `setPriceAdjustments(adjustments)` mutator added. Note: only the express-checkout buttons consume this; standard checkout doesn't render adjustment lines, so the T-705 assertion is deferred to express-button tests.
- [x] **T-004** `setFeeTotal(value, currencyCode?)` added — recalculates total to keep totals consistent.
- [x] **T-005** `mockTrack()` helper added. Returns `{ getTrackedEvents, clearTrackedEvents, expectTracked }`. `expectTracked` accepts either an `objectContaining`-style partial object or a `(props) => boolean` predicate. Test file is responsible for the `vi.mock('@/tracking/track', ...)` boilerplate (canonical snippet documented in README).
- [x] **T-006** `packages/react/src/components/checkout/__tests__/README.md` added — one-paragraph intro plus a categorized helper list.

---

## Phase 1 — Pure unit tests for transformers and helpers

Co-locate as `*.test.ts` next to source. No React Testing Library needed.

- [x] **T-101** `utils/checkout-transformers.test.ts` — covered in `utils/checkout-transformers.test.ts` (`mapOrderToFormValues`, phone normalization via form values, and `mapSkusToItemsDisplay`).
  - `mapOrderToFormValues`:
    - All-PICKUP line items → `deliveryMethod = PICKUP`.
    - All-SHIP line items → `deliveryMethod = SHIP`.
    - Mixed PICKUP + SHIP → `deliveryMethod = PURCHASE`.
    - Item-level pickup but `session.enableLocalPickup=false` → falls back to `PURCHASE` (the source has an explicit comment about this).
    - `paymentShouldUseShippingAddress` truthy when shipping == billing across name + address fields and phone digits-only equality (`+12015550123` vs `(201) 555-0123`).
    - `paymentShouldUseShippingAddress` truthy by default when shipping has no `addressLine1`.
    - `shippingMethod` derived from `shippingLines[0]?.requestedService`.
    - Notes: only CUSTOMER note with non-empty content is hydrated; STAFF note ignored; whitespace-only CUSTOMER note ignored.
    - Empty/missing draft order returns the schema defaults without throwing.
  - `processPhoneNumber`:
    - Empty / undefined / null → `''`.
    - Number missing country code prefixes default country code from session.
    - Dashes/parens stripped; spaces normalized.
    - Already-E.164 left unchanged.
  - `mapSkusToItemsDisplay`:
    - Sorts by `lineItemOrder` metafield ascending; line items without that metafield fall to the end stably.
    - Falls back to `attributes` from `skuDetails` when SKU lookup misses.
    - Quantity / image / price fields populated correctly.

- [!] **T-102** `utils/format-currency.test.ts` — covered in `utils/format-currency.test.ts` (`formatCurrency`, `convertMajorToMinorUnits`, and `useFormatCurrency`). Current Intl output for KWD in `en-US` is `KWD 1.050`, not `د.ك1.050`.
  - `formatCurrency`:
    - USD `1050` minor → `"$10.50"`.
    - JPY `1050` minor → `"¥1,050"` (precision 0).
    - KWD `1050` minor → `"د.ك1.050"` (precision 3).
    - `inputInMinorUnits: false` skips the divide.
    - `returnRaw: true` ignores `locale` (e.g. passes `fr-FR` → still `.` decimal, no thousands grouping).
    - Invalid `locale` falls back to `en-US` without throwing.
  - `convertMajorToMinorUnits`:
    - `'10.50'` USD → `1050`.
    - `'10,50'` USD → `0` (string, comma not normalized — function relies on `Number()`). Pin this contract.
    - Negative number → `0`.
    - `NaN` / `null` / `undefined` → `0`.
    - JPY `100.50` → `101` (rounded with precision 0).
    - KWD `1.2345` → `1235` (rounded with precision 3).
  - `useFormatCurrency`:
    - Uses `GoDaddyContext.locale` when no explicit locale passed.
    - Explicit `locale` option wins over context.

- [x] **T-103** `utils/case-conversion.test.ts` — covered in `utils/case-conversion.test.ts` (`kebabToCamel`, `camelToKebab`, CSS variable conversion, and round-trip behavior).
  - `kebabToCamel('font-sans')` → `'fontSans'`; idempotent on camelCase input.
  - `camelToKebab('fontSans')` → `'font-sans'`; idempotent on kebab.
  - `convertCSSVariablesToCamelCase` skips `undefined` values.
  - `convertCamelCaseToKebabCase` round-trips with `convertCSSVariablesToCamelCase`.

- [x] **T-104** `address/utils/format-address.test.ts`
  - `formatSingleLineAddress`:
    - Standard US address renders comma-separated, no duplicates.
    - Missing `addressLine2` is omitted (no double comma).
    - Country name appended via region table; unknown country falls back to country code.
    - Admin area de-duplication when city == admin area.

- [x] **T-105** `address/utils/check-is-valid-address.test.ts`
  - Form vs verified address comparison:
    - Identical addresses → `true`.
    - `USA` ↔ `US` country code normalized.
    - `adminArea3` used for city comparison (not the form's `city` against verified `city`).
    - Postal code case-insensitive trim (UK postcodes have spaces).
    - Difference in `addressLine2` → `false`.

- [x] **T-106** `address/utils/is-address-complete.test.ts`
  - Returns `true` only when all required fields are non-empty.
  - Country with no region data does not require `state`.
  - Empty postal code → `false` for countries that require it.

- [!] **T-107** `__tests__/checkout-free-payment-form.test.tsx` now mounts the real `FreePaymentForm` via `renderCheckout` for free pickup, SHIP, and PURCHASE confirm payloads; note current free PURCHASE renders only the FreePaymentForm submit button (no billing fields) when existing billing values are present.
  - Free pickup → only first/last name fields render; submit succeeds without billing address.
  - Free SHIP → `paymentMethod` is `OFFLINE`, billing address fields render normally.
  - Free PURCHASE (no shipping/no pickup) → billing required, submits with full billing.
  - Then **delete** the original `payment/free-payment-form.test.ts` (it tests copy-pasted logic, not the source).

- [x] **T-108** `pickup/utils/build-pickup-payload.test.ts` already exists. Audit and add: ASAP vs scheduled times, missing `pickupLeadTime` defaulting, timezone fallback to `defaultOperatingHours.timeZone`. *(Skip if these are already covered.)*

- [x] **T-109** `form/utils/get-required-fields-from-schema.test.ts`
  - Plain `ZodObject` with optional + required fields.
  - `ZodEffects` wrapper (e.g., from `.superRefine(...)`) unwraps correctly.
  - `ZodDefault` wrapper unwraps correctly.
  - Throws on a non-object schema.

- [x] **T-110** `order/draft-order-sync-provider.integration.test.tsx` covers provider queue behavior with a real form + checkout context consumer.
  - Wraps `<DraftOrderSyncProvider>` around a tiny test consumer that calls `useDraftOrderSyncQueue()`.
  - Patch merge during in-flight mutation: enqueue A → start mutation → enqueue B → assert one mutation runs A and a second mutation runs the merged remnants.
  - Failure restores the patch (drainQueue catch): `setApiErrorOnce('UpdateCheckoutSessionDraftOrder')` → enqueue patch P → next enqueue Q should send a merged P + Q request after the error.
  - `flushDraftOrderSync()` resolves only after pending debounce timer fires AND in-flight mutation settles.
  - `enqueueDraftOrderPatch(input, { immediate: true })` bypasses the debounce and fires immediately.
  - No-op when `session` / `draftOrder.id` is missing.
  - `form.resetField` is called on success for each `fieldNames` entry, with the user's last typed value preserved as the new default (drives `keepDirtyValues` behavior).

---

## Phase 2 — Form validation & confirmation

- [ ] **T-201** `__tests__/checkout-form-validation.test.tsx` (new) — exercises real `CustomFormProvider.enhancedTrigger` via `renderCheckout`:
  - **Free pickup**: empty `billingFirstName` blocks submit with `t.validation.enterFirstName`; empty `billingAddressLine1` does **not** block submit.
  - **Paid pickup**: `billingAddressLine1` empty blocks submit.
  - **SHIP + `paymentUseShippingAddress=true`**: empty billing fields are ignored; empty shipping fields block submit with the matching `t.validation.*` messages.
  - **SHIP + `paymentUseShippingAddress=false`**: empty billing fields block submit.
  - **PURCHASE** (`enableShipping=false`, `enableLocalPickup=false`): billing required, shipping ignored.
  - For each scenario assert the **exact localized error string** from `enUs.validation.*`, not a regex.
  - `hasRegionData(country)` toggling: switching to a country without region data must not require `state`; switching back must require it.

- [ ] **T-202** `__tests__/checkout-confirm-errors.test.tsx` — extend:
  - `DRAFT_ORDER_UPDATE_FAILED` from the in-confirm `queryClient.fetchQuery({ draftOrder })` path (separate from the flush failure path already covered).
  - **Double-click protection**: rapid second confirm click while the first is in-flight should produce only one `ConfirmCheckoutSession` op.
  - **Pickup ASAP** confirm payload includes `fulfillmentStartAt` ≈ now and `fulfillmentEndAt` based on `pickupLeadTime`.
  - **Pickup scheduled** confirm payload uses the user-selected slot exactly.
  - **`isExpress: true`** path: skip `MISSING_SHIPPING_INFO` guard and skip pickup-payload construction. Assert by setting `paymentMethod = 'apple_pay'` (or similar) on a session with no shipping line and triggering confirm via the express test seam — the confirm op should still go through.

- [ ] **T-203** `__tests__/checkout-error-list.test.tsx` (new) — covers `CheckoutErrorList`:
  - Errors trigger `scrollIntoView` on the list container (use a spy on `Element.prototype.scrollIntoView`).
  - `eventIds.formError` tracked with `{ errorCodes: 'A,B', errorCount: 2 }`.
  - Known code (e.g. the first key from `enUs.apiErrors`) renders the localized string.
  - Unknown code renders the raw code as fallback.
  - `isCheckoutDisabled` + non-empty `checkoutErrors` renders both items.
  - `isCheckoutDisabled` alone (no errors) renders only the disabled message.

- [ ] **T-204** `payment/utils/use-flush-checkout-sync.test.tsx` (new — integration via a thin host component)
  - Per-flag mutation key inclusion: with `enableTaxCollection=false`, the `updateDraftOrderTaxes` mutation key is excluded from the wait set; same for `enableShipping=false` excluding apply/remove shipping.
  - `includeFetches: false` short-circuits the fetch wait.
  - **Timeout**: when an in-flight `updateDraftOrder` never resolves, after `timeoutMs` the hook sets `DRAFT_ORDER_UPDATE_FAILED` and rejects. Use `vi.useFakeTimers()`.

- [ ] **T-205** Extend `__tests__/checkout-shipping.test.tsx`:
  - `filterAndSortShippingMethods`: `experimental_rules.freeShipping.minimumOrderTotal` hides the free method when subtotal is below threshold; shows it once threshold is met.
  - **Single-method UI** with `cost.value === 0` renders `t.general.free` (currently asserts the multi-method path only).
  - `pickup → shipping` round-trip: switch delivery to PICKUP, then back to SHIP, then assert auto-apply re-runs and `clearedShippingMethod` resets.
  - `applyShippingMethod` `onSuccess` invalidation when `isFulfillmentSync` is true: an order with NONE-fulfillment line items should refetch `draftOrder` after auto-apply.
  - `onError` rollback for the **auto-apply** path (currently only the click path is tested): use `setApiErrorOnce('applyShippingMethod')`.
  - `shouldApplyShippingMethod` blocked-fulfillment loop guard: a single mutation fires for a NONE-fulfillment order, even after the next refetch returns the same NONE state.

- [ ] **T-206** Add to `__tests__/checkout-shipping.test.tsx` or new `__tests__/checkout-shipping-method-selection.test.tsx`:
  - User clicks a different rate → form value updates, mutation fires once, **tax recalc is NOT triggered a second time** by the post-mutation refetch.
  - Click rejects (mock error) → previous selection restored; tracking event NOT fired for the failed click.

---

## Phase 3 — DraftOrder sync edge cases

- [x] **T-301** `__tests__/checkout-draft-order-sync.test.tsx` extends coverage for notes, names-only billing, phone sync/gating, and resetField/refetch behavior.
  - **Whitespace-only notes** (`'   '`) sync as `null`.
  - **Names-only billing** sync (`onlyNames` mode): `mapAddressFieldsToInput` emits `billing: { firstName, lastName }` without sending other billing fields. (Used by `FreePaymentForm` pickup.)
  - **Phone-only sync** with `paymentUseShippingAddress=true` copies the phone to billing.
  - **`enabled` gate on phone**: invalid phone does not enqueue a patch; once corrected, exactly one patch is enqueued.
  - **`form.resetField` after success** keeps the user's typed value as the new default (use a follow-up refetch and assert the field is not marked dirty post-reset).

- [x] **T-302** `__tests__/checkout-refetch-hydration.test.tsx` extends dirty-field preservation for null refetches and billing toggle state.
  - **Empty (null) draftOrder refetch** does not clobber typed-but-not-yet-saved fields.
  - **`paymentUseShippingAddress` user-toggled-off** preserves across a refetch (dirty-fields preservation).

---

## Phase 4 — Free orders & dynamic transitions

- [!] **T-401** `__tests__/checkout-free-order.test.tsx` covers free SHIP and free PURCHASE confirm payloads; note current free PURCHASE does not render billing address fields, so it is pinned with existing fixture billing values.
  - **Free SHIP**: shipping address required; free shipping line satisfies `MISSING_SHIPPING_INFO` guard; submit succeeds.
  - **Free PURCHASE** (no shipping/no pickup): billing names + address required; submit succeeds.
- [x] **T-402** `__tests__/checkout-free-order.test.tsx` applies a 100% coupon and asserts the paid Pay Now button is replaced by `FreePaymentForm` plus offline confirm payload.
- [x] **T-403** `__tests__/checkout-free-order.test.tsx` removes the free coupon and asserts the paid Pay Now form returns.
- [x] **T-404** `__tests__/checkout-free-order.test.tsx` selects a free shipping rate under the free-shipping rule and asserts transition to `FreePaymentForm`.
- [x] **T-405** `__tests__/checkout-free-order.test.tsx` uses `setApiErrorOnce('applyDiscount')` and asserts the paid form remains with the discount error rendered.

---

## Phase 5 — Payment-method gating (no SDK internals)

- [ ] **T-501** Extend `__tests__/checkout-wallet-methods.test.tsx` (or new `checkout-payment-gating.test.tsx`):
  - GoDaddy `card` filtered out when `applicationId` is missing on the session and there is no `gopay_override`.
  - GoDaddy `ach` filtered out when `applicationId` is missing.
  - `experimental_rules.gopay_override.goPayAppId` populates `applicationId` (`getApplicationId`) and re-enables the GoDaddy methods.
- [ ] **T-502** `PaymentMethodType.OFFLINE` configured as a regular method renders in the accordion with the wallet icon, even on a non-free order.
- [ ] **T-503** `noMethodsAvailable` copy renders when `filteredPaymentMethods.length === 0` (e.g., GoDaddy-only configured but no `applicationId`).
- [ ] **T-504** Single-method auto-select: only one method configured → `paymentMethod` is set without showing the accordion (`!isSingleMethod || selectedMethodHasContent` branch).
- [ ] **T-505** Description-only payment methods (PayPal redirect, MercadoPago, CCAvenue): accordion content renders the description even though no inline form is mounted.

---

## Phase 6 — Tracking events

For each task, mock `@/tracking/track` (use the helper from T-005) and assert payloads. Use **literal** `eventIds.*` and matching property objects, not ad-hoc strings.

- [ ] **T-601** `__tests__/checkout-tracking.test.tsx` (new): Impressions
  - `eventIds.checkoutStart` fires once on first non-loading render.
  - `eventIds.expressCheckoutImpression` fires when express section becomes visible (and not when gated off).
- [ ] **T-602** Form submit:
  - `eventIds.submitCheckoutForm` properties include `success`, `deliveryMethod`, `hasShippingAddress`, `hasBillingAddress`, `total`.
  - `eventIds.formValidationError` fires on invalid submit with the failing field names.
- [ ] **T-603** Delivery / shipping / pickup:
  - `eventIds.changeDeliveryMethod`
  - `eventIds.selectShippingMethod`
  - `eventIds.selectPickupLocation`
  - `eventIds.changePickupDate`, `eventIds.changePickupTime`
- [ ] **T-604** Discount:
  - `eventIds.applyCoupon` on apply.
  - `eventIds.removeDiscount` on remove.
  - `eventIds.discountError` on apply failure.
- [ ] **T-605** Errors / billing toggle:
  - `eventIds.formError` already covered in T-203; add an integration assertion here too.
  - `eventIds.toggleSameAsBillingAddress` on the `PaymentAddressToggle` checkbox change with `useShippingAddress: true|false`.
- [ ] **T-606** Confirm-checkout lifecycle:
  - `eventIds.paymentStart`, `eventIds.checkoutComplete` on success.
  - `eventIds.checkoutError` on failure.
  - Wallet-specific complete events (Apple Pay / Google Pay / Paze) — assert the correct one fires when that method is used. (Use the inert mocks; no real SDK invocation needed.)

---

## Phase 7 — Layout, appearance & targets

- [ ] **T-701** Extend `__tests__/checkout-layout-appearance.test.tsx` to cover **all** `Target` slots. Iterate the canonical list and assert each `Target` renders its child content in the right slot. Slots:
  - `checkout.form.contact.before/after`
  - `checkout.form.delivery.before/after`
  - `checkout.form.tips.before/after`
  - `checkout.form.pickup.form.before`
  - `checkout.form.payment.before/after`
  - `checkout.form.express-checkout.before/after`
  - `checkout.summary.line-items.before/after`
  - `checkout.summary.totals.subtotal.before`
  - `checkout.summary.totals.discount.before`
  - `checkout.summary.totals.shipping.before`
  - `checkout.summary.totals.tip.before`
  - `checkout.summary.totals.taxes.before`
  - `checkout.summary.totals.fees.before`
  - `checkout.summary.totals.after`
  - `checkout.summary.totals.total-due.before/after`
  - Generate the asserts from a single fixture array so adding new slots is a one-line change.
- [ ] **T-702** `appearance.elements` className overrides for `input`, `select`, `button`, `card`, `checkbox`, `radio` are applied to representative rendered elements.
- [ ] **T-703** `appearance.theme` precedence: `props.appearance.theme` (or whichever the source actually prefers — verify) overrides `session.appearance.theme`.
- [ ] **T-704** `direction: 'ltr'` default produces `'left right'` template areas; explicit `'rtl'` flips them.
- [ ] **T-705** Custom `checkoutFormSchema` extension: extending `baseCheckoutSchema` with a custom required field surfaces its message and blocks submit until filled.

---

## Phase 8 — Order summary / totals

- [ ] **T-801** Extend `__tests__/checkout-totals-summary.test.tsx`:
  - Loading skeletons: with a slow `applyDiscount` mutation, `TotalLineItemSkeleton` renders for the discount row and is replaced once the mutation settles (`vi.useFakeTimers()` + manual `advanceTimersByTime`).
  - Same for shipping / tax / fee rows.
  - `feeTotal > 0` (use T-004 `setFeeTotal`) renders the fees line.
  - `itemCount === 0` falls back to `t.totals.noItems`.
- [ ] **T-802** `LineItems` removal flow: clicking the trash/remove icon calls the configured `onRemoveFromCart` callback with the right line item; line item disappears from the rendered list. *(If `onRemoveFromCart` is owned by host app and not wired in checkout itself, mark `[N/A]` with note.)*

---

## Phase 9 — Tips edge cases

- [ ] **T-901** Extend `__tests__/checkout-tips.test.tsx`:
  - Apply a coupon while a percentage tip is selected: `tipAmount` (minor units) does **not** change as a function of the new total — the snapshot at click-time stays put. Pin this contract so a future re-calc behavior change is intentional.
  - Custom tip while still focused: type a value, advance fake timers ~1.5s with **no blur**, assert sync still fires.
  - Negative custom tip → coerced to 0.
  - `NaN` input → coerced to 0.
  - 3-decimal currency tip (KWD): typed `1.234` major units → `1234` minor units.

---

## Phase 10 — Pickup edge cases

- [ ] **T-1001** Extend `__tests__/checkout-pickup-selection.test.tsx`:
  - `pickupLeadTime` flows from `operatingHours.leadTime` → form → `buildPickupPayload` → confirm payload `fulfillmentEndAt`.
  - `pickupTimezone` falls back to `defaultOperatingHours.timeZone` when the chosen location has no `timeZone`.
  - `enableNotesCollection=false` in pickup mode does NOT render notes inside `LocalPickupForm`.

---

## Phase 11 — Address form & autocomplete

- [ ] **T-1101** Extend `__tests__/checkout-address.test.tsx`:
  - Region change clears `postalCode`.
  - Country with no region data renders `Input` for `AdminArea1` (not `Select`); validation does not require `state`.
  - `AutoComplete` suggestion selection populates `addressLine1`, `city`, `state`, `postal` form fields and triggers a single draft-order patch with all four.
  - **`onlyNames` mode** for billing emits a sync payload of just `billing.firstName` / `billing.lastName` and does not include other billing address fields.
- [ ] **T-1102** New `address/utils/use-clear-billing-address.test.tsx`:
  - Toggling `paymentUseShippingAddress` from `true` → `false` clears all `billing*` form fields back to schema defaults.
- [ ] **T-1103** New `address/utils/use-address-verification.test.tsx`:
  - `enabled` gate: query disabled when `!session.id`, `!addressLine1`, `!postalCode`, or `!countryCode`.
  - When all gates pass, `verifyAddress` is called once with the right input.
  - Result is keyed correctly so two address typings don't collide.

---

## Phase 12 — Build-payment-request hooks

> **Allowed scope:** request *shape* (totals, line items, shipping options) — no SDK calls.

- [ ] **T-1201** `payment/utils/use-build-payment-request.test.tsx` (new):
  - Apple Pay request: `total.amount`, `lineItems[]` (subtotal/shipping/tax/discount), `merchantCapabilities`, `supportedNetworks`, `requiredShippingContactFields` reflect session config.
  - Google Pay request: `transactionInfo.totalPrice` matches major-unit converted total; `displayItems` populated; allowed payment methods set from session.
  - PayPal "create order" request shape includes amount, currency, items, shipping option flag.
  - Free order ($0) yields a request with `total = '0.00'` and no failure.
  - 3-decimal currency (KWD) totals format with 3 decimals in the request.

---

## Phase 13 — Session / auth edge cases

- [ ] **T-1301** Extend `__tests__/checkout-session-auth.test.tsx`:
  - JWT with `exp` undefined: refresh scheduler does not crash; if the source treats it as "never expires", assert that no refresh is scheduled. Otherwise pin whatever the current behavior is and add a `// TODO` comment for follow-up.
  - URL token wins over storage token when both are present (or document the actual priority).

---

## Phase 14 — Discounts polish

- [ ] **T-1401** Extend `__tests__/checkout-discount.test.tsx`:
  - Line-item-level discount code already on the order is rendered as a removable tag.
  - Shipping-line-level discount code already on the order is rendered as a removable tag.
  - Generic (non-`GraphQLErrorWithCodes`) error renders `t.discounts.failedToApply`.
  - Empty input + click Apply → `t.discounts.enterCodeValidation` shown; no API call.
  - Enter-key submission on an empty input does NOT fire (already-implemented gate).

---

## Phase 15 — Redirects polish

- [ ] **T-1501** Extend `__tests__/checkout-redirects.test.tsx`:
  - No `returnUrl` and no draft order: the form continues rendering the confirming/error fallback rather than navigating.
  - Replace any `await new Promise(r => setTimeout(r, 1000))` with `vi.useFakeTimers()` + `vi.advanceTimersByTime(1000)` for determinism.

---

## Phase 16 — Cleanup

- [x] **T-1601** Deleted helper-only `payment/free-payment-form.test.ts`; real coverage lives in `__tests__/checkout-free-payment-form.test.tsx`.
- [ ] **T-1602** Replace any loose `/enter|required|invalid/i` regex assertions in **existing** tests with exact `enUs.validation.*` strings. (One sweep, single PR.)
- [ ] **T-1603** Run `pnpm --filter @godaddy/react test:coverage` (add the script to `packages/react/package.json` if missing — it is in `app-connect` but not yet in `react`). Snapshot the coverage report into `packages/react/docs/test-coverage-report.md` for the team and link it from the package README.

---

## Suggested implementation order (priority)

Follow this order; later phases may depend on Phase 0 helpers.

1. **Phase 0** — infra (T-001 → T-006). One short PR.
2. **Phase 1** — pure unit tests (T-101 → T-110). Highest ROI, lowest risk.
3. **Phase 2** — validation & confirm (T-201 → T-206).
4. **Phase 3** — sync edge cases (T-301, T-302).
5. **Phase 4** — free orders (T-401 → T-405).
6. **Phase 5** — payment-method gating (T-501 → T-505).
7. **Phase 6** — tracking events (T-601 → T-606).
8. **Phase 7** — layout / appearance (T-701 → T-705).
9. **Phase 8** — totals (T-801, T-802).
10. **Phase 9** — tips (T-901).
11. **Phase 10** — pickup (T-1001).
12. **Phase 11** — address (T-1101 → T-1103).
13. **Phase 12** — payment-request shape (T-1201).
14. **Phase 13** — session/auth (T-1301).
15. **Phase 14** — discounts polish (T-1401).
16. **Phase 15** — redirects polish (T-1501).
17. **Phase 16** — cleanup (T-1601 → T-1603).

---

## Done definition

- All `[ ]` flipped to `[x]` (or `[N/A]` with a one-line justification).
- `pnpm --filter @godaddy/react test` passes locally and in CI.
- `pnpm --filter @godaddy/react typecheck` passes.
- `pnpm --filter @godaddy/react test:coverage` run; coverage delta committed under `packages/react/docs/test-coverage-report.md`.
- No new `// @ts-ignore`, no skipped tests (`it.skip`, `describe.skip`) without an attached `// TODO(<issue>)` link.
- No tests duplicate logic by re-implementing helpers; tests must import the real source.
