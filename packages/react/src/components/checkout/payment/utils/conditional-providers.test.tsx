import { render } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PayPalConfig } from '@/components/checkout/checkout';
import { checkoutContext } from '@/components/checkout/checkout';

const mockScriptProviderOptions = vi.fn();

vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({
    options,
    children,
  }: {
    options: unknown;
    children: React.ReactNode;
  }) => {
    mockScriptProviderOptions(options);
    return children;
  },
}));

vi.mock('./use-build-payment-request', () => ({
  useBuildPaymentRequest: () => ({ payPalRequest: undefined }),
}));

// vi.mock calls above are hoisted, so this picks up the mocked modules.
import { ConditionalPaymentProviders } from './conditional-providers';

function renderWithPayPalConfig(paypalConfig?: PayPalConfig) {
  return render(
    <checkoutContext.Provider
      value={{
        paypalConfig,
        isConfirmingCheckout: false,
        setIsConfirmingCheckout: () => {
          // no-op for this test
        },
        setCheckoutErrors: () => {
          // no-op for this test
        },
      }}
    >
      <ConditionalPaymentProviders>
        <div data-testid='child' />
      </ConditionalPaymentProviders>
    </checkoutContext.Provider>
  );
}

describe('ConditionalPaymentProviders — PayPal SDK options', () => {
  beforeEach(() => {
    mockScriptProviderOptions.mockClear();
  });

  it('passes dataPartnerAttributionId through to the PayPal JS SDK when present', () => {
    renderWithPayPalConfig({
      clientId: 'client-1',
      merchantId: 'merchant-1',
      partnerAttributionId: 'GoDaddy_SP',
    });

    expect(mockScriptProviderOptions).toHaveBeenCalledWith(
      expect.objectContaining({ dataPartnerAttributionId: 'GoDaddy_SP' })
    );
  });

  it('omits dataPartnerAttributionId when not configured', () => {
    renderWithPayPalConfig({ clientId: 'client-1' });

    expect(mockScriptProviderOptions).toHaveBeenCalledTimes(1);
    const options = mockScriptProviderOptions.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(options).not.toHaveProperty('dataPartnerAttributionId');
  });

  it('does not load the PayPal SDK at all when clientId is missing', () => {
    renderWithPayPalConfig(undefined);

    expect(mockScriptProviderOptions).not.toHaveBeenCalled();
  });
});
