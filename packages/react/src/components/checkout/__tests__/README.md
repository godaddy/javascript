# Checkout test infrastructure

Integration tests for `<Checkout />` live here. They mount the real component
through `renderCheckout()` and assert behavior against an in-memory mock of
`@/lib/godaddy/godaddy`. Pure-unit tests for transformers / hooks live next
to their source as `*.test.ts(x)` and don't need any of the helpers below.

`checkout-test-env.tsx` is the file you import from. It re-exports everything
in `checkout-test-utils.tsx` and additionally installs `vi.mock(...)` calls
for the wallet / express / Stripe payment buttons so jsdom doesn't try to
boot real SDKs. Importing **anything** from `./checkout-test-env` in a test
file is what activates those mocks — keep that import even if you don't
reference the named export it provides.

## Helpers

### Setup
- `mockGodaddyApi(options)` — install the in-memory API mock. `renderCheckout`
  calls this for you with sensible defaults; call directly when you need a
  bare-mocked API without rendering.
- `renderCheckout(options?)` — mount `<Checkout />` inside `<GoDaddyProvider>`
  with a fresh QueryClient. Returns the standard RTL result plus
  `{ user, queryClient, session, draftOrder }`.
- `renderCheckoutWithProps(checkoutProps, options?)` — same, but spread
  `checkoutProps` onto the rendered `<Checkout />`.
- `createTestQueryClient()` — a QueryClient with retries off and infinite
  staleTime, suitable for predictable integration tests.

### Builders / fixtures
- `buildCheckoutSession`, `buildDraftOrder`, `buildLineItem`,
  `buildShippingAddress`, `buildBillingAddress`, `buildPickupLocation`,
  `buildShippingRates` — deep-mergeable factory functions.
- `buildDraftOrderUpdate(input, session?)` — wrap an `UpdateDraftOrderInput`
  payload with the `context` block the API expects.
- `noBillingAddress`, `getLastUpdateInput`, `getLastConfirmInput` (in
  `checkout-test-fixtures.ts`).

### Operation log
- `getOperations(op?)` — recorded API calls, optionally filtered by name.
- `getOperationNames()` — names only.
- `getOperationOrder(names)` — array of indices for the first occurrence of
  each named op in the log. Use this to assert relative ordering of recorded
  operations without `.indexOf` chains.
- `clearOperations()` — reset the log (does not reset draft-order state).

### Error injection
- `setApiError(key, error)` — make every subsequent call to the matching API
  reject. `key` is the API key form, e.g. `'updateDraftOrder'`,
  `'applyShippingMethod'`, `'applyDiscount'`.
- `clearApiError(key)` — reset.
- `setApiErrorOnce(key, error?)` — fire `error` for the **next** matching
  call only, then auto-clear. Useful for "fail then recover" scenarios
  (auto-apply rollback, draft-order sync retry, free → paid coupon round-trip).

### Mutating the in-memory draft order
- `getCurrentDraftOrder()` / `setCurrentDraftOrder(draftOrder)`.
- `setFeeTotal(value, currencyCode?)` — adjust `draftOrder.feeTotal` (and the
  recomputed total) for the next refetch. Used to exercise the fees row in
  the totals summary.
- `setPriceAdjustments(adjustments)` — set the response returned by
  `getDraftOrderPriceAdjustments`. Defaults to `[]`. Only consumed by the
  express-checkout buttons; standard checkout flows ignore it.

### Timing helpers
- `advanceCheckoutDebounce(ms = 1200)` — advance fake timers and flush
  promises in one shot to drive the draft-order sync debounce.
- `flushPromises()` — `act(async () => Promise.resolve())`.
- `waitForCheckoutReady()` — wait until the form has rendered Contact +
  Payment.
- `waitForCheckoutIdle()` — wait until pending mutations have settled.
- `waitForOperation(op, count?, timeout?)` — wait until at least `count`
  occurrences of `op` are recorded.
- `refetchDraftOrder(queryClient, sessionId)` — invalidate the draft-order
  query.

### Tokenize / wallet
- `MockTokenizeJs` — replaces `window.TokenizeJs`. `setupCheckoutTestGlobals`
  wires it up automatically.
- `getLastTokenizeInstance` / `getTokenizeInstances`.
- `WalletSupport` (option on `mockGodaddyApi`) controls what
  `MockTokenizeJs.supportWalletPayments()` resolves with.

### URL / storage / JWT
- `mockWindowLocation`, `setCheckoutUrl`, `seedCheckoutSessionStorage`,
  `restoreWindowLocation`, `getMockedLocation`.
- `createMockJwt(payload?)` — produces a JWT with a far-future `exp` by
  default.

### Form interaction
- `typeIntoNamedField(user, name, value)` / `typeIntoPlaceholder` /
  `getTextbox(name)` / `getNamedInput(name)`.
- `fillShippingAddress(user, overrides?)` — fill all required shipping
  fields with sensible defaults.

### Tracking (T-005)
- `mockTrack()` — returns `{ getTrackedEvents, clearTrackedEvents,
  expectTracked }`. Requires the test file to install
  `vi.mock('@/tracking/track', ...)` at the top:
  ```ts
  vi.mock('@/tracking/track', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/tracking/track')>();
    return { ...actual, track: vi.fn() };
  });
  ```
  `expectTracked(eventId, propsMatcher)` accepts either an `expect.objectContaining`-style
  partial object or a `(props) => boolean` predicate. `eventId` matches
  either an exact id or a suffix (the production `track` fn prepends
  `godaddy.checkout.` — both forms work).

## Gotchas

- **Fake timers are on by default** (`vi.useFakeTimers({ shouldAdvanceTime: true })`).
  When you need to drive the debounce manually, prefer `advanceCheckoutDebounce`.
- The wallet / express / Stripe button mocks are inert — they render
  recognizable test ids but never tokenize. Don't try to assert on
  authorize/confirm flows that go through them. End-to-end coverage for those
  buttons belongs in real-browser tests.
- `clearOperations()` only clears the log; it does not reset the draft order.
  Use `setCurrentDraftOrder` or re-call `mockGodaddyApi` for a clean slate.
