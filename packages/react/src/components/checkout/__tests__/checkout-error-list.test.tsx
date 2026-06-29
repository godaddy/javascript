import { enUs } from '@godaddy/localizations';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutContext } from '@/components/checkout/checkout';
import { CheckoutErrorList } from '@/components/checkout/form/checkout-error-list';
import { GoDaddyProvider } from '@/godaddy-provider';
import { eventIds } from '@/tracking/events';
import { createTestQueryClient, mockTrack } from './checkout-test-env';

vi.mock('@/tracking/track', async importOriginal => {
  const actual = await importOriginal<typeof import('@/tracking/track')>();
  return { ...actual, track: vi.fn() };
});

const tracking = mockTrack();

function renderErrorList({
  checkoutErrors,
  isCheckoutDisabled = false,
}: {
  checkoutErrors?: string[];
  isCheckoutDisabled?: boolean;
}) {
  return render(
    <GoDaddyProvider queryClient={createTestQueryClient()}>
      <checkoutContext.Provider
        value={{
          checkoutErrors,
          isCheckoutDisabled,
          isConfirmingCheckout: false,
          setIsConfirmingCheckout: () => undefined,
          setCheckoutErrors: () => undefined,
        }}
      >
        <CheckoutErrorList />
      </checkoutContext.Provider>
    </GoDaddyProvider>
  );
}

describe('CheckoutErrorList', () => {
  beforeEach(() => {
    tracking.clearTrackedEvents();
  });

  it('scrolls into view and tracks checkout errors', async () => {
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView');

    renderErrorList({ checkoutErrors: ['PAYMENT_DECLINED', 'UNKNOWN_CODE'] });

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });
    tracking.expectTracked(eventIds.formError, {
      errorCodes: 'PAYMENT_DECLINED,UNKNOWN_CODE',
      errorCount: 2,
    });
  });

  it('renders localized known errors and raw unknown error codes', () => {
    renderErrorList({
      checkoutErrors: ['AUTHORIZATION_FAILED', 'CUSTOM_RAW_CODE'],
    });

    expect(
      screen.getByText(enUs.apiErrors.AUTHORIZATION_FAILED)
    ).toBeInTheDocument();
    expect(screen.getByText('CUSTOM_RAW_CODE')).toBeInTheDocument();
  });

  it('renders checkout disabled copy with checkout errors', () => {
    renderErrorList({
      checkoutErrors: ['TRANSACTION_PROCESSING_FAILED'],
      isCheckoutDisabled: true,
    });

    expect(
      screen.getByText(enUs.apiErrors.TRANSACTION_PROCESSING_FAILED)
    ).toBeInTheDocument();
    expect(screen.getByText(enUs.general.checkoutDisabled)).toBeInTheDocument();
  });

  it('renders only checkout disabled copy when there are no errors', () => {
    renderErrorList({ isCheckoutDisabled: true });

    expect(screen.getByText(enUs.general.checkoutDisabled)).toBeInTheDocument();
    expect(tracking.getTrackedEvents(eventIds.formError)).toHaveLength(0);
  });

  it('renders nothing without checkout errors or disabled state', () => {
    const { container } = renderErrorList({});

    expect(container).toBeEmptyDOMElement();
    expect(tracking.getTrackedEvents(eventIds.formError)).toHaveLength(0);
  });
});
