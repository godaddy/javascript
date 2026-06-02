import { useQueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  type AddressVerificationInput,
  useAddressVerification,
} from '@/components/checkout/address/utils/use-address-verification';
import { checkoutContext } from '@/components/checkout/checkout';
import { GoDaddyProvider } from '@/godaddy-provider';
import { verifyAddress } from '@/lib/godaddy/godaddy';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
} from '../../__tests__/checkout-test-env';

const verifyAddressMock = vi.mocked(verifyAddress);

function VerificationProbe({
  address,
  enabled = true,
}: {
  address: AddressVerificationInput;
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const query = useAddressVerification(address, { enabled });
  const queryHashes = queryClient
    .getQueryCache()
    .findAll({ queryKey: ['verifyAddressQuery'] })
    .map(cacheQuery => cacheQuery.queryHash);

  return (
    <>
      <div data-testid='status'>
        {query.data?.[0]?.addressLine1 ?? 'loading'}
      </div>
      <div data-testid='hashes'>{queryHashes.join('|')}</div>
    </>
  );
}

function CheckoutContextHarness({
  sessionOverrides,
  ...props
}: React.ComponentProps<typeof VerificationProbe> & {
  sessionOverrides?: Parameters<typeof buildCheckoutSession>[0];
}) {
  const draftOrder = buildDraftOrder();
  const session = buildCheckoutSession({
    draftOrder,
    ...sessionOverrides,
  });

  return (
    <checkoutContext.Provider
      value={{
        session,
        jwt: undefined,
        isConfirmingCheckout: false,
        setIsConfirmingCheckout: () => undefined,
        checkoutErrors: undefined,
        setCheckoutErrors: () => undefined,
      }}
    >
      <VerificationProbe {...props} />
    </checkoutContext.Provider>
  );
}

function renderVerificationProbe(
  props: React.ComponentProps<typeof CheckoutContextHarness>
) {
  return render(
    <GoDaddyProvider
      queryClient={createTestQueryClient()}
      apiHost='api.godaddy.test'
    >
      <CheckoutContextHarness {...props} />
    </GoDaddyProvider>
  );
}

const completeAddress = {
  addressLine1: '456 Shipping Ln',
  addressLine2: 'Suite 7',
  addressLine3: '',
  adminArea1: 'GA',
  adminArea2: 'Jasper',
  adminArea3: '',
  adminArea4: '',
  postalCode: '30143',
  countryCode: 'US',
};

describe('useAddressVerification', () => {
  it.each([
    ['disabled option', completeAddress, true, false],
    ['missing session id', completeAddress, false, true],
    [
      'missing address line 1',
      { ...completeAddress, addressLine1: '' },
      true,
      true,
    ],
    ['missing postal code', { ...completeAddress, postalCode: '' }, true, true],
    [
      'missing country code',
      { ...completeAddress, countryCode: '' },
      true,
      true,
    ],
  ])(
    'does not call verifyAddress when %s gate fails',
    async (_label, address, hasSessionId, enabled) => {
      verifyAddressMock.mockResolvedValue({ verifyAddress: [] });

      renderVerificationProbe({
        address,
        enabled,
        sessionOverrides: hasSessionId ? undefined : { id: '' },
      });

      await waitFor(() => {
        expect(verifyAddressMock).not.toHaveBeenCalled();
      });
    }
  );

  it('calls verifyAddress once with the input when all enabled gates pass', async () => {
    verifyAddressMock.mockResolvedValue({
      verifyAddress: [
        { ...completeAddress, addressLine1: '456 Shipping Lane' },
      ],
    });

    renderVerificationProbe({ address: completeAddress });

    await waitFor(() => {
      expect(verifyAddressMock).toHaveBeenCalledTimes(1);
    });
    expect(verifyAddressMock).toHaveBeenCalledWith(
      completeAddress,
      expect.objectContaining({ id: 'checkout-session-1' }),
      'api.godaddy.test'
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      '456 Shipping Lane'
    );
  });

  it('keys separate address typings by normalized address fields', async () => {
    verifyAddressMock.mockResolvedValue({ verifyAddress: [] });
    const queryClient = createTestQueryClient();
    const { rerender } = render(
      <GoDaddyProvider queryClient={queryClient} apiHost='api.godaddy.test'>
        <CheckoutContextHarness address={completeAddress} />
      </GoDaddyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hashes').textContent).toContain(
        '456 shipping ln'
      );
    });

    rerender(
      <GoDaddyProvider queryClient={queryClient} apiHost='api.godaddy.test'>
        <CheckoutContextHarness
          address={{ ...completeAddress, addressLine1: '789 Shipping Ln' }}
        />
      </GoDaddyProvider>
    );

    await waitFor(() => {
      const hashes = screen.getByTestId('hashes').textContent ?? '';
      expect(hashes).toContain('456 shipping ln');
      expect(hashes).toContain('789 shipping ln');
    });
  });
});
