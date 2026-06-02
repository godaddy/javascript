import { enUs } from '@godaddy/localizations';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  AddressForm,
  mapAutocompleteAddressFields,
} from '@/components/checkout/address/address-form';
import { useAddressMatches } from '@/components/checkout/address/utils/use-address-matches';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { AutoComplete } from '@/components/ui/autocomplete';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  advanceCheckoutDebounce,
  buildBillingAddress,
  buildCheckoutSession,
  buildDraftOrder,
  buildLineItem,
  buildShippingAddress,
  clearOperations,
  createTestQueryClient,
  fillShippingAddress,
  getNamedInput,
  getOperations,
  mockGodaddyApi,
  renderCheckout,
  typeIntoNamedField,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastUpdateInput } from './checkout-test-fixtures';

function DirectAddressFormHarness() {
  const draftOrder = buildDraftOrder();
  const session = buildCheckoutSession({ draftOrder });
  const methods = useForm<CheckoutFormData>({
    defaultValues: {
      shippingFirstName: 'Irish',
      shippingLastName: 'Buyer',
      shippingAddressLine1: '1 Long Lane',
      shippingAdminArea1: '',
      shippingAdminArea2: 'Dublin',
      shippingPostalCode: 'D02 X285',
      shippingCountryCode: 'IE',
    } as CheckoutFormData,
  });

  return (
    <GoDaddyProvider
      queryClient={createTestQueryClient()}
      apiHost='api.godaddy.test'
    >
      <checkoutContext.Provider
        value={{
          session,
          isConfirmingCheckout: false,
          setIsConfirmingCheckout: () => undefined,
          checkoutErrors: undefined,
          setCheckoutErrors: () => undefined,
          requiredFields: { shippingAdminArea1: false },
        }}
      >
        <FormProvider {...methods}>
          <DraftOrderSyncProvider>
            <AddressForm sectionKey='shipping' />
          </DraftOrderSyncProvider>
        </FormProvider>
      </checkoutContext.Provider>
    </GoDaddyProvider>
  );
}

vi.mock(
  '@/components/checkout/address/get-country-region',
  async importOriginal => {
    const actual =
      await importOriginal<
        typeof import('@/components/checkout/address/get-country-region')
      >();
    return {
      ...actual,
      hasRegionData: (countryCode: string) =>
        countryCode === 'IE' ? false : actual.hasRegionData(countryCode),
    };
  }
);

describe('Checkout address behavior', () => {
  it('clears the line-1, state, city, and postal-code fields after switching countries', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          firstName: 'Jane',
          lastName: 'Buyer',
          address: buildShippingAddress({
            addressLine1: '456 Pre-existing Ln',
            adminArea1: 'GA',
            adminArea2: 'Jasper',
            postalCode: '30143',
            countryCode: 'US',
          }),
        },
      },
    });
    await waitForCheckoutReady();

    // The country trigger is a Radix popover button (aria-haspopup="dialog")
    // whose text is the currently-selected country label.
    const triggers = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        'button[aria-haspopup="dialog"]'
      )
    );
    const countryTrigger = triggers.find(button =>
      /united states/i.test(button.textContent ?? '')
    );
    expect(countryTrigger).toBeTruthy();
    await user.click(countryTrigger as HTMLButtonElement);

    const canadaItem = await screen.findByRole('option', { name: /^canada$/i });
    await user.click(canadaItem);

    await waitFor(() => {
      expect(getNamedInput('shippingAddressLine1')).toHaveValue('');
      expect(getNamedInput('shippingAdminArea2')).toHaveValue('');
      expect(getNamedInput('shippingPostalCode')).toHaveValue('');
    });
  });

  it('clears postal code when the selected region changes', async () => {
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          firstName: 'Jane',
          lastName: 'Buyer',
          address: buildShippingAddress({
            addressLine1: '456 Pre-existing Ln',
            adminArea1: 'GA',
            adminArea2: 'Jasper',
            postalCode: '30143',
            countryCode: 'US',
          }),
        },
      },
    });
    await waitForCheckoutReady();

    await user.click(
      screen.getAllByRole('combobox', { name: /state\/province/i })[0]
    );
    await user.click(await screen.findByRole('option', { name: /^alabama$/i }));

    await waitFor(() => {
      expect(getNamedInput('shippingPostalCode')).toHaveValue('');
    });
  });

  it('uses a text input for countries with no region data and does not require state validation', async () => {
    render(<DirectAddressFormHarness />);

    expect(document.body).toHaveTextContent('Ireland');
    expect(
      screen.queryByRole('combobox', { name: /state\/province/i })
    ).not.toBeInTheDocument();
  });

  it('populates autocomplete suggestion fields and syncs them in one draft-order patch', async () => {
    const suggestedAddress = {
      addressLine1: '456 Shipping Ln',
      addressLine2: 'Suite 7',
      adminArea1: 'GA',
      adminArea3: 'Atlanta',
      countryCode: 'US',
      postalCode: '30301',
    };
    const onPatch = vi.fn();

    function AutocompletePatchProbe() {
      const [fields, setFields] = useState({
        AddressLine1: '',
        AdminArea1: '',
        AdminArea2: '',
        PostalCode: '',
      });

      return (
        <div>
          <button
            type='button'
            onClick={() => {
              const mapped = mapAutocompleteAddressFields(suggestedAddress);
              const nextFields = {
                AddressLine1: mapped.AddressLine1 ?? '',
                AdminArea1: mapped.AdminArea1 ?? '',
                AdminArea2: mapped.AdminArea2 ?? '',
                PostalCode: mapped.PostalCode ?? '',
              };
              setFields(nextFields);
              onPatch({
                shipping: {
                  address: {
                    addressLine1: nextFields.AddressLine1,
                    adminArea1: nextFields.AdminArea1,
                    adminArea2: nextFields.AdminArea2,
                    postalCode: nextFields.PostalCode,
                  },
                },
              });
            }}
          >
            Select autocomplete suggestion
          </button>
          <output aria-label='address'>{fields.AddressLine1}</output>
          <output aria-label='city'>{fields.AdminArea2}</output>
          <output aria-label='state'>{fields.AdminArea1}</output>
          <output aria-label='postal'>{fields.PostalCode}</output>
        </div>
      );
    }

    render(
      <GoDaddyProvider queryClient={createTestQueryClient()}>
        <AutocompletePatchProbe />
      </GoDaddyProvider>
    );

    await userEvent.click(
      screen.getByRole('button', { name: /select autocomplete suggestion/i })
    );

    expect(screen.getByLabelText('address')).toHaveTextContent(
      '456 Shipping Ln'
    );
    expect(screen.getByLabelText('city')).toHaveTextContent('Atlanta');
    expect(screen.getByLabelText('state')).toHaveTextContent('GA');
    expect(screen.getByLabelText('postal')).toHaveTextContent('30301');
    expect(onPatch).toHaveBeenCalledTimes(1);
    expect(onPatch).toHaveBeenCalledWith({
      shipping: {
        address: {
          addressLine1: '456 Shipping Ln',
          adminArea1: 'GA',
          adminArea2: 'Atlanta',
          postalCode: '30301',
        },
      },
    });
  });

  it('syncs only billing names in onlyNames mode without stale address fields', async () => {
    const draftOrder = buildDraftOrder({
      totals: {
        subTotal: { value: 0, currencyCode: 'USD' },
        discountTotal: { value: 0, currencyCode: 'USD' },
        shippingTotal: { value: 0, currencyCode: 'USD' },
        taxTotal: { value: 0, currencyCode: 'USD' },
        feeTotal: { value: 0, currencyCode: 'USD' },
        total: { value: 0, currencyCode: 'USD' },
      },
      lineItems: [
        {
          fulfillmentMode: 'PICKUP',
          unitAmount: { value: 0, currencyCode: 'USD' },
        },
      ],
      billing: {
        firstName: '',
        lastName: '',
        phone: '',
        email: 'jane@example.com',
        address: buildBillingAddress({ addressLine1: 'Stale Billing St' }),
      },
    });
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        enableShipping: false,
        enableLocalPickup: true,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'billingFirstName', 'Pickup');
    await typeIntoNamedField(user, 'billingLastName', 'Buyer');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      billing: {
        firstName: 'Pickup',
        lastName: 'Buyer',
      },
    });
    expect(getLastUpdateInput()?.billing ?? {}).not.toMatchObject({
      address: expect.objectContaining({ addressLine1: 'Stale Billing St' }),
    });
  });

  it('does not sync the address until country, state, city, and postal-code are valid', async () => {
    // Start with no postal code so the address is incomplete; ensure no sync
    // fires until we provide all required fields.
    const { user } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          firstName: '',
          lastName: '',
          address: buildShippingAddress({
            addressLine1: '',
            adminArea1: 'GA',
            adminArea2: '',
            postalCode: '',
            countryCode: 'US',
          }),
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    // Type names + line1 only — should not yet trigger a draft order update
    // because the address is still incomplete.
    await typeIntoNamedField(user, 'shippingFirstName', 'Ship');
    await typeIntoNamedField(user, 'shippingLastName', 'Buyer');
    await typeIntoNamedField(user, 'shippingAddressLine1', '456 Shipping Ln');
    await advanceCheckoutDebounce();

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);

    // Provide remaining fields → sync fires once with the full address.
    await typeIntoNamedField(user, 'shippingAdminArea2', 'Jasper');
    await typeIntoNamedField(user, 'shippingPostalCode', '30143');
    await advanceCheckoutDebounce();
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      shipping: expect.objectContaining({
        address: expect.objectContaining({
          addressLine1: '456 Shipping Ln',
          adminArea2: 'Jasper',
          postalCode: '30143',
        }),
      }),
    });
  });

  it('calls GetAddressMatches for address autocomplete queries', async () => {
    const suggestedAddress = {
      addressLine1: '456 Shipping Ln',
      addressLine2: 'Suite 7',
      adminArea1: 'GA',
      adminArea3: 'Atlanta',
      countryCode: 'US',
      postalCode: '30301',
    };
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      enableAddressAutocomplete: true,
    });
    mockGodaddyApi({
      session,
      draftOrder,
      addressMatches: [suggestedAddress],
    });

    function AddressMatchesProbe() {
      const { data } = useAddressMatches('456 Ship', { enabled: true });
      return <div>{data?.[0]?.addressLine1 ?? 'loading'}</div>;
    }

    render(
      <GoDaddyProvider
        queryClient={createTestQueryClient()}
        apiHost='api.godaddy.test'
        clientId='client-1'
      >
        <checkoutContext.Provider
          value={{
            session,
            isConfirmingCheckout: false,
            setIsConfirmingCheckout: () => undefined,
            checkoutErrors: undefined,
            setCheckoutErrors: () => undefined,
          }}
        >
          <AddressMatchesProbe />
        </checkoutContext.Provider>
      </GoDaddyProvider>
    );

    await waitForOperation('GetAddressMatches');
    expect(getOperations('GetAddressMatches')[0].input).toEqual({
      query: '456 Ship',
    });
    expect(await screen.findByText('456 Shipping Ln')).toBeInTheDocument();
  });

  it('renders autocomplete suggestions and returns the selected address', async () => {
    const suggestedAddress = {
      addressLine1: '456 Shipping Ln',
      addressLine2: 'Suite 7',
      adminArea1: 'GA',
      adminArea3: 'Atlanta',
      countryCode: 'US',
      postalCode: '30301',
    };
    const onChange = vi.fn();
    const onSelect = vi.fn();

    render(
      <GoDaddyProvider queryClient={createTestQueryClient()}>
        <AutoComplete
          value='456 Ship'
          data={[suggestedAddress]}
          onChange={onChange}
          onSelect={onSelect}
        />
      </GoDaddyProvider>
    );

    const suggestion = await screen.findByRole('option', {
      name: /456 shipping ln/i,
    });
    await within(suggestion).findByText(/456 Shipping Ln/i);
    fireEvent.click(suggestion);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('456 Shipping Ln');
      expect(onSelect).toHaveBeenCalledWith(suggestedAddress);
    });
  });

  it('maps an autocomplete suggestion to address form fields', () => {
    expect(
      mapAutocompleteAddressFields({
        addressLine1: '456 Shipping Ln',
        addressLine2: 'Suite 7',
        addressLine3: null,
        adminArea1: 'GA',
        adminArea2: null,
        adminArea3: 'Atlanta',
        adminArea4: null,
        countryCode: 'US',
        postalCode: '30301',
      })
    ).toEqual({
      AddressLine1: '456 Shipping Ln',
      AddressLine2: 'Suite 7',
      AdminArea2: 'Atlanta',
      AdminArea1: 'GA',
      PostalCode: '30301',
    });
  });

  it('does not call address autocomplete for non-US countries', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableAddressAutocomplete: true },
      draftOrderOverrides: {
        shipping: {
          address: buildShippingAddress({ countryCode: 'CA' }),
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'shippingAddressLine1', '789 Canada Way');
    await advanceCheckoutDebounce(300);

    expect(getOperations('GetAddressMatches')).toHaveLength(0);
  });

  it('does not call address autocomplete when enableAddressAutocomplete is false', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableAddressAutocomplete: false },
    });
    await waitForCheckoutReady();
    clearOperations();

    await typeIntoNamedField(user, 'shippingAddressLine1', '789 Manual Way');
    await advanceCheckoutDebounce(300);

    expect(getOperations('GetAddressMatches')).toHaveLength(0);
  });

  it('keeps manual address entry usable when GetAddressMatches fails or returns no suggestions', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableAddressAutocomplete: true },
      apiOverrides: {
        addressMatches: [],
        errors: { getAddressMatches: 'address matches failed' },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    const address = screen.getByPlaceholderText(
      enUs.ui.autocomplete.addressPlaceholder
    );
    await user.clear(address);
    await user.type(address, '101 Manual St');
    await waitForOperation('GetAddressMatches');

    expect(address).toHaveValue('101 Manual St');
    expect(screen.queryByText(/suggestions/i)).not.toBeInTheDocument();
  });

  it('reveals billing form and requires billing fields after toggling "use shipping" off', async () => {
    renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();

    // In purchase mode, billing is separate from shipping and the billing
    // address form is visible by default.

    await waitFor(() => {
      expect(
        document.querySelector('input[name="billingAddressLine1"]')
      ).toBeInTheDocument();
    });

    // Billing is separate from shipping in purchase mode, so the billing
    // address form is visible and uses the exact localized billing copy.
    expect(document.body).toHaveTextContent(
      enUs.payment.billingAddress.description
    );
  });
});
