import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkout } from '@/components/checkout/checkout';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GoDaddyProvider } from '@/godaddy-provider';
import * as godaddyApi from '@/lib/godaddy/godaddy';
import {
  buildCheckoutSession,
  buildDraftOrder,
  clearOperations,
  createTestQueryClient,
  getOperations,
  MockTokenizeJs,
  mockGodaddyApi,
  mockWindowLocation,
  renderCheckout,
  waitForCheckoutReady,
} from './checkout-test-env';

describe('Checkout redirects', () => {
  it('navigates to successUrl after a successful confirmCheckout', async () => {
    const location = mockWindowLocation({
      href: 'https://test.example/checkout',
    });

    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      successUrl: 'https://test.example/thank-you',
    });
    mockGodaddyApi({ session, draftOrder });
    clearOperations();

    // Direct call to confirmCheckout API to record the op, then exercise the
    // exported `redirectToSuccessUrl` helper that runs from the mutation's
    // onSuccess (delayed via setTimeout(1000)).
    const tokenize = new MockTokenizeJs();
    tokenize.getNonce({});

    await godaddyApi.confirmCheckout(
      {
        paymentToken: 'test-nonce',
        paymentType: 'card',
        paymentProvider: 'POYNT',
      },
      session
    );

    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(1);

    const { redirectToSuccessUrl } = await import(
      '@/components/checkout/checkout'
    );
    redirectToSuccessUrl(session.successUrl);
    await vi.advanceTimersByTimeAsync(1500);

    expect(location.href).toBe('https://test.example/thank-you');
  });

  it('does nothing when successUrl is not set', async () => {
    const location = mockWindowLocation({
      href: 'https://test.example/checkout',
    });
    const { redirectToSuccessUrl } = await import(
      '@/components/checkout/checkout'
    );
    redirectToSuccessUrl(undefined);
    await vi.advanceTimersByTimeAsync(1500);

    expect(location.href).toBe('https://test.example/checkout');
  });

  it('does not navigate when no draft order is loaded and returnUrl is not set', async () => {
    const location = mockWindowLocation({
      href: 'https://test.example/checkout',
    });

    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      returnUrl: undefined,
    });
    mockGodaddyApi({ session, draftOrder });

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder: null },
    });
    queryClient.setQueryData(checkoutQueryKeys.draftOrderProducts(session.id), {
      checkoutSession: { skus: { edges: [] } },
    });

    render(
      <GoDaddyProvider
        queryClient={queryClient}
        apiHost='api.godaddy.test'
        clientId='client-1'
        storeId={session.storeId ?? undefined}
        channelId={session.channelId ?? undefined}
      >
        <Checkout
          session={session}
          godaddyPaymentsConfig={{
            businessId: 'business-1',
            appId: 'test-app-id',
          }}
        />
      </GoDaddyProvider>
    );

    await waitFor(() => {
      expect(location.href).toBe('https://test.example/checkout');
      expect(screen.getAllByText('Payment').length).toBeGreaterThan(0);
    });
  });

  it('redirects to returnUrl when no draft order is loaded', async () => {
    const location = mockWindowLocation({
      href: 'https://test.example/checkout',
    });

    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      returnUrl: 'https://test.example/cart',
    });

    // Mock the API; getDraftOrder returns an order, but we pre-populate the
    // query cache with a null draftOrder so the container hits the no-order
    // branch on first render.
    mockGodaddyApi({ session, draftOrder });

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder: null },
    });
    queryClient.setQueryData(checkoutQueryKeys.draftOrderProducts(session.id), {
      checkoutSession: { skus: { edges: [] } },
    });

    render(
      <GoDaddyProvider
        queryClient={queryClient}
        apiHost='api.godaddy.test'
        clientId='client-1'
        storeId={session.storeId ?? undefined}
        channelId={session.channelId ?? undefined}
      >
        <Checkout
          session={session}
          godaddyPaymentsConfig={{
            businessId: 'business-1',
            appId: 'test-app-id',
          }}
        />
      </GoDaddyProvider>
    );

    await waitFor(
      () => {
        expect(location.href).toBe('https://test.example/cart');
      },
      { timeout: 3000 }
    );
  });

  it('starts in confirming state when ?encResp= is present in the URL', async () => {
    mockWindowLocation({
      href: 'https://test.example/checkout?encResp=abc',
      search: '?encResp=abc',
    });

    renderCheckout();
    // CheckoutFormContainer skips the "no order" return when isConfirmingCheckout
    // is true and instead allows the form to render. Verify the form is showing.
    await waitForCheckoutReady();
    expect(screen.getAllByText('Payment').length).toBeGreaterThan(0);
  });
});
