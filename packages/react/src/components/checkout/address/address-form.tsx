'use client';

import { useDebouncedValue } from '@tanstack/react-pacer';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  countries,
  getRegions,
  hasRegionData,
} from '@/components/checkout/address/get-country-region';
import { isAddressComplete } from '@/components/checkout/address/utils/is-address-complete';
import { mapAddressFieldsToInput } from '@/components/checkout/address/utils/map-address-fields-to-input';
import { useAddressMatches } from '@/components/checkout/address/utils/use-address-matches';
import {
  type CheckoutFormData,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { PhoneInput } from '@/components/checkout/contact/phone-input';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import {
  useDraftOrderFieldDirtyMarker,
  useRegisterDraftOrderFieldSync,
} from '@/components/checkout/order/use-draft-order-sync';
import { AutoComplete } from '@/components/ui/autocomplete';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoDaddyContext } from '@/godaddy-provider';
import { cn } from '@/lib/utils';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import type { Address, DraftOrder } from '@/types';

type SectionKey = 'shipping' | 'billing';

interface AddressFormProps {
  sectionKey: SectionKey;
  /** When true, only show first name and last name fields (used for free pickup orders) */
  onlyNames?: boolean;
}

export function mapAutocompleteAddressFields(selectedAddress?: Address) {
  if (!selectedAddress) return {};

  return {
    AddressLine1: selectedAddress.addressLine1,
    AddressLine2: selectedAddress.addressLine2,
    AdminArea2: selectedAddress.adminArea3,
    AdminArea1: selectedAddress.adminArea1,
    PostalCode: selectedAddress.postalCode,
  } satisfies Record<string, string | null>;
}

const addressFieldSuffixes = [
  'AddressLine1',
  'AddressLine2',
  'AddressLine3',
  'AdminArea4',
  'AdminArea3',
  'AdminArea2',
  'AdminArea1',
  'PostalCode',
  'CountryCode',
] as const;

function getFormString(values: CheckoutFormData, fieldName: string) {
  return String(values[fieldName as keyof CheckoutFormData] ?? '');
}

function getSectionAddress(values: CheckoutFormData, sectionKey: SectionKey) {
  return {
    addressLine1: getFormString(values, `${sectionKey}AddressLine1`),
    addressLine2: getFormString(values, `${sectionKey}AddressLine2`),
    addressLine3: getFormString(values, `${sectionKey}AddressLine3`),
    adminArea4: getFormString(values, `${sectionKey}AdminArea4`),
    adminArea3: getFormString(values, `${sectionKey}AdminArea3`),
    adminArea2: getFormString(values, `${sectionKey}AdminArea2`),
    adminArea1: getFormString(values, `${sectionKey}AdminArea1`),
    postalCode: getFormString(values, `${sectionKey}PostalCode`),
    countryCode: getFormString(values, `${sectionKey}CountryCode`),
  };
}

function getDraftOrderSection(
  draftOrder: DraftOrder | null | undefined,
  sectionKey: SectionKey
) {
  return sectionKey === 'shipping' ? draftOrder?.shipping : draftOrder?.billing;
}

function getDraftOrderAddress(
  draftOrder: DraftOrder | null | undefined,
  sectionKey: SectionKey
) {
  const section = getDraftOrderSection(draftOrder, sectionKey);
  return {
    addressLine1: section?.address?.addressLine1 || '',
    addressLine2: section?.address?.addressLine2 || '',
    addressLine3: section?.address?.addressLine3 || '',
    adminArea4: section?.address?.adminArea4 || '',
    adminArea3: section?.address?.adminArea3 || '',
    adminArea2: section?.address?.adminArea2 || '',
    adminArea1: section?.address?.adminArea1 || '',
    postalCode: section?.address?.postalCode || '',
    countryCode: section?.address?.countryCode || '',
  };
}

function sectionNameHasChanged(
  values: CheckoutFormData,
  draftOrder: DraftOrder | null | undefined,
  sectionKey: SectionKey
) {
  const section = getDraftOrderSection(draftOrder, sectionKey);
  return (
    (section?.firstName || '') !==
      getFormString(values, `${sectionKey}FirstName`) ||
    (section?.lastName || '') !== getFormString(values, `${sectionKey}LastName`)
  );
}

function sectionAddressHasChanged(
  values: CheckoutFormData,
  draftOrder: DraftOrder | null | undefined,
  sectionKey: SectionKey
) {
  if (!draftOrder) return false;

  const orderAddress = getDraftOrderAddress(draftOrder, sectionKey);
  const formAddress = getSectionAddress(values, sectionKey);
  const orderSection = getDraftOrderSection(draftOrder, sectionKey);

  if (!orderSection?.address) {
    return Object.entries(formAddress).some(
      ([key, value]) => key !== 'countryCode' && Boolean(value.trim())
    );
  }

  return Object.entries(orderAddress).some(
    ([key, value]) => value !== formAddress[key as keyof typeof formAddress]
  );
}

export function AddressForm({
  sectionKey,
  onlyNames = false,
}: AddressFormProps) {
  const form = useFormContext<CheckoutFormData>();
  const { session } = useCheckoutContext();
  const { t } = useGoDaddyContext();
  const { isConfirmingCheckout, requiredFields } = useCheckoutContext();

  const { data: draftOrder } = useDraftOrder();
  const countryTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | null>(null);
  const [isCountrySelectOpen, setCountrySelectOpen] =
    React.useState<boolean>(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    function updateWidth() {
      if (countryTriggerRef.current) {
        setTriggerWidth(countryTriggerRef.current.clientWidth);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const [addressValue, countryValue] = form.watch([
    `${sectionKey}AddressLine1`,
    `${sectionKey}CountryCode`,
  ]);

  const [debouncedAddressValue] = useDebouncedValue(addressValue, {
    wait: 200,
  });

  const nameFieldNames = React.useMemo(
    () => [`${sectionKey}FirstName`, `${sectionKey}LastName`],
    [sectionKey]
  );
  const allAddressFieldNames = React.useMemo(
    () => addressFieldSuffixes.map(suffix => `${sectionKey}${suffix}`),
    [sectionKey]
  );
  const addressSyncDependencyFieldNames = React.useMemo(
    () => ['paymentUseShippingAddress'],
    []
  );

  const orderAddress = React.useMemo(
    () => getDraftOrderAddress(draftOrder, sectionKey),
    [draftOrder, sectionKey]
  );

  const addressLine1HasChanged = React.useMemo(
    () =>
      Boolean(draftOrder && orderAddress.addressLine1 !== (addressValue || '')),
    [draftOrder, orderAddress, addressValue]
  );

  useRegisterDraftOrderFieldSync(
    React.useMemo(
      () => ({
        id: `${sectionKey}-names-only`,
        fieldNames: nameFieldNames,
        dependencyFieldNames: addressSyncDependencyFieldNames,
        debounceMs: 1000,
        enabled: ({ values, draftOrder: currentDraftOrder }) =>
          Boolean(
            onlyNames &&
              sectionNameHasChanged(values, currentDraftOrder, sectionKey) &&
              getFormString(values, `${sectionKey}FirstName`).trim() &&
              getFormString(values, `${sectionKey}LastName`).trim()
          ),
        buildPatch: ({ values }) =>
          mapAddressFieldsToInput(
            {
              firstName: getFormString(values, `${sectionKey}FirstName`).trim(),
              lastName: getFormString(values, `${sectionKey}LastName`).trim(),
              address: null,
            },
            sectionKey,
            Boolean(values.paymentUseShippingAddress)
          ),
      }),
      [addressSyncDependencyFieldNames, nameFieldNames, onlyNames, sectionKey]
    )
  );

  useRegisterDraftOrderFieldSync(
    React.useMemo(
      () => ({
        id: `${sectionKey}-name`,
        fieldNames: nameFieldNames,
        dependencyFieldNames: addressSyncDependencyFieldNames,
        debounceMs: 1000,
        enabled: ({ values, draftOrder: currentDraftOrder }) =>
          Boolean(
            !onlyNames &&
              sectionNameHasChanged(values, currentDraftOrder, sectionKey) &&
              (sectionKey === 'shipping' ||
                !sectionAddressHasChanged(
                  values,
                  currentDraftOrder,
                  sectionKey
                )) &&
              getFormString(values, `${sectionKey}FirstName`).trim() &&
              getFormString(values, `${sectionKey}LastName`).trim()
          ),
        buildPatch: ({ values }) =>
          mapAddressFieldsToInput(
            {
              firstName: getFormString(values, `${sectionKey}FirstName`).trim(),
              lastName: getFormString(values, `${sectionKey}LastName`).trim(),
            },
            sectionKey,
            Boolean(values.paymentUseShippingAddress)
          ),
      }),
      [addressSyncDependencyFieldNames, nameFieldNames, onlyNames, sectionKey]
    )
  );

  useRegisterDraftOrderFieldSync(
    React.useMemo(
      () => ({
        id: `${sectionKey}-address`,
        fieldNames: allAddressFieldNames,
        dependencyFieldNames: addressSyncDependencyFieldNames,
        debounceMs: 1000,
        enabled: ({ values, draftOrder: currentDraftOrder }) =>
          Boolean(
            !onlyNames &&
              sectionAddressHasChanged(values, currentDraftOrder, sectionKey) &&
              isAddressComplete(getSectionAddress(values, sectionKey)) &&
              !isAutocompleteOpen
          ),
        buildPatch: ({ values }) => {
          const hasCompleteName = Boolean(
            getFormString(values, `${sectionKey}FirstName`).trim() &&
              getFormString(values, `${sectionKey}LastName`).trim()
          );

          return mapAddressFieldsToInput(
            {
              ...(hasCompleteName
                ? {
                    firstName: getFormString(
                      values,
                      `${sectionKey}FirstName`
                    ).trim(),
                    lastName: getFormString(
                      values,
                      `${sectionKey}LastName`
                    ).trim(),
                  }
                : {}),
              address: getSectionAddress(values, sectionKey),
            },
            sectionKey,
            Boolean(values.paymentUseShippingAddress)
          );
        },
      }),
      [
        addressSyncDependencyFieldNames,
        allAddressFieldNames,
        isAutocompleteOpen,
        onlyNames,
        sectionKey,
      ]
    )
  );

  useDraftOrderFieldDirtyMarker({
    id: `${sectionKey}-names-only`,
    fieldNames: nameFieldNames,
    disabled: !onlyNames || isConfirmingCheckout,
  });
  useDraftOrderFieldDirtyMarker({
    id: `${sectionKey}-name`,
    fieldNames: nameFieldNames,
    disabled: onlyNames || isConfirmingCheckout,
  });
  useDraftOrderFieldDirtyMarker({
    id: `${sectionKey}-address`,
    fieldNames: allAddressFieldNames,
    disabled: onlyNames || isConfirmingCheckout,
  });

  const addressMatchesQuery = useAddressMatches(debouncedAddressValue, {
    enabled:
      !!session?.enableAddressAutocomplete &&
      !!debouncedAddressValue &&
      countryValue === 'US' &&
      addressLine1HasChanged,
  });

  function handleUpdateAddress(selectedAddress?: Address) {
    if (!selectedAddress) return;

    for (const [key, value] of Object.entries(
      mapAutocompleteAddressFields(selectedAddress)
    )) {
      const fieldName = `${sectionKey}${key}` as keyof CheckoutFormData;
      if (value && form.getValues(fieldName) !== value) {
        form.setValue(fieldName, value, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
  }

  return (
    <fieldset className='space-y-2' disabled={isConfirmingCheckout}>
      {!onlyNames && (
        <FormField
          control={form.control}
          name={`${sectionKey}CountryCode`}
          render={({ field, fieldState }) => (
            <FormItem className='flex flex-col'>
              <FormLabel className='sr-only'>{t.shipping.country}</FormLabel>
              <Popover
                open={isCountrySelectOpen}
                onOpenChange={setCountrySelectOpen}
              >
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      ref={countryTriggerRef}
                      variant='outline'
                      className={cn(
                        'rounded-md shadow-none justify-between px-3 font-normal hover:bg-muted bg-card active:ring h-12',
                        !field.value && 'text-muted-foreground'
                      )}
                      hasError={!!fieldState.error}
                      disabled={isConfirmingCheckout}
                      aria-required={
                        requiredFields?.[`${sectionKey}CountryCode`]
                      }
                      tabIndex={0}
                    >
                      {field.value
                        ? countries.find(
                            country => country.value === field.value
                          )?.label
                        : t.shipping.selectCountry}
                      <ChevronsUpDown className='opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className='p-0 rounded-md'
                  style={{
                    width: triggerWidth ? `${triggerWidth + 2}px` : '100%',
                  }}
                >
                  <Command>
                    <CommandInput
                      placeholder={t.shipping.searchCountry}
                      className='h-12'
                      disabled={isConfirmingCheckout}
                    />
                    <CommandList>
                      <CommandEmpty>{t.shipping.noCountryFound}</CommandEmpty>
                      <CommandGroup>
                        {countries.map(country => (
                          <CommandItem
                            value={country.label}
                            key={country.value}
                            onSelect={() => {
                              // Get current country before setting the new one
                              const previousCountry = form.getValues(
                                `${sectionKey}CountryCode`
                              );

                              // Set the new country value
                              form.setValue(
                                `${sectionKey}CountryCode`,
                                country.value,
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              );

                              if (previousCountry !== country.value) {
                                form.setValue(`${sectionKey}AddressLine1`, '', {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                                form.setValue(`${sectionKey}AdminArea1`, '', {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                                form.setValue(`${sectionKey}AdminArea2`, '', {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                                form.setValue(`${sectionKey}PostalCode`, '', {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                              }

                              // Track country selection event
                              track({
                                eventId: eventIds.changeCountry,
                                type: TrackingEventType.CLICK,
                                properties: {
                                  sectionKey,
                                  countryCode: country.value,
                                  countryName: country.label,
                                },
                              });

                              setCountrySelectOpen(false);
                            }}
                            disabled={isConfirmingCheckout}
                          >
                            {country.label}
                            <Check
                              className={cn(
                                'ml-auto',
                                country.value === field.value
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
        <FormField
          control={form.control}
          name={`${sectionKey}FirstName`}
          render={({ field, fieldState }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='sr-only'>{t.shipping.firstName}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t.shipping.firstName}
                  hasError={!!fieldState.error}
                  aria-required={requiredFields?.[`${sectionKey}FirstName`]}
                  {...field}
                  disabled={isConfirmingCheckout}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${sectionKey}LastName`}
          render={({ field, fieldState }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='sr-only'>{t.shipping.lastName}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t.shipping.lastName}
                  hasError={!!fieldState.error}
                  aria-required={requiredFields?.[`${sectionKey}LastName`]}
                  {...field}
                  disabled={isConfirmingCheckout}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {onlyNames ? (
        <PhoneInput sectionKey={sectionKey} disabled={isConfirmingCheckout} />
      ) : (
        <>
          <FormField
            control={form.control}
            name={`${sectionKey}AddressLine1`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className='sr-only'>{t.shipping.address1}</FormLabel>
                <FormControl>
                  {countryValue === 'US' &&
                  session?.enableAddressAutocomplete ? (
                    <AutoComplete
                      data={addressMatchesQuery.data || []}
                      value={field.value}
                      onChange={field.onChange}
                      onSelect={selectedAddress => {
                        handleUpdateAddress(selectedAddress as Address);
                      }}
                      onOpenChange={setIsAutocompleteOpen}
                      isLoading={
                        addressMatchesQuery?.isLoading ||
                        addressMatchesQuery?.isFetching
                      }
                      hasError={!!fieldState.error}
                      aria-required={
                        requiredFields?.[`${sectionKey}AddressLine1`]
                      }
                      disabled={isConfirmingCheckout}
                    />
                  ) : (
                    <Input
                      placeholder={t.shipping.address1}
                      hasError={!!fieldState.error}
                      aria-required={
                        requiredFields?.[`${sectionKey}AddressLine1`]
                      }
                      {...field}
                      disabled={isConfirmingCheckout}
                      autoComplete='off'
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`${sectionKey}AddressLine2`}
            render={({ field, fieldState }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='sr-only'>{t.shipping.address2}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.shipping.address2}
                    hasError={!!fieldState.error}
                    aria-required={
                      requiredFields?.[`${sectionKey}AddressLine2`]
                    }
                    {...field}
                    disabled={isConfirmingCheckout}
                    autoComplete='off'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-1'>
            <FormField
              control={form.control}
              name={`${sectionKey}AdminArea2`}
              render={({ field, fieldState }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='sr-only'>{t.shipping.city}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.shipping.city}
                      hasError={!!fieldState.error}
                      aria-required={
                        requiredFields?.[`${sectionKey}AdminArea2`]
                      }
                      {...field}
                      disabled={isConfirmingCheckout}
                      autoComplete='off'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${sectionKey}AdminArea1`}
              render={({ field, fieldState }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='sr-only'>{t.shipping.region}</FormLabel>
                  <FormControl>
                    {hasRegionData(countryValue) ? (
                      <Select
                        value={field.value}
                        onValueChange={value => {
                          const previousRegion = form.getValues(
                            `${sectionKey}AdminArea1`
                          );

                          field.onChange(value);
                          form.setValue(`${sectionKey}AdminArea1`, value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });

                          if (previousRegion && previousRegion !== value) {
                            form.setValue(`${sectionKey}PostalCode`, '', {
                              shouldDirty: true,
                              shouldValidate: false,
                            });
                          }

                          // Track region selection event
                          track({
                            eventId: eventIds.changeRegion,
                            type: TrackingEventType.CLICK,
                            properties: {
                              sectionKey,
                              countryCode: countryValue,
                              regionCode: value,
                              regionName: getRegions(countryValue)?.find(
                                r => r.code === value
                              )?.label,
                            },
                          });
                        }}
                        disabled={isConfirmingCheckout}
                      >
                        <FormControl>
                          <SelectTrigger
                            hasError={!!fieldState.error}
                            disabled={isConfirmingCheckout}
                            aria-required={
                              requiredFields?.[`${sectionKey}AdminArea1`]
                            }
                            tabIndex={0}
                          >
                            <SelectValue placeholder={t.shipping.region} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getRegions(countryValue)?.map(region => (
                            <SelectItem
                              key={region.code}
                              value={region.code}
                              disabled={isConfirmingCheckout}
                            >
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={t.shipping.region}
                        {...field}
                        hasError={!!fieldState.error}
                        aria-required={
                          requiredFields?.[`${sectionKey}AdminArea1`]
                        }
                        disabled={isConfirmingCheckout}
                        autoComplete='off'
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`${sectionKey}PostalCode`}
              render={({ field, fieldState }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='sr-only'>
                    {t.shipping.postalCode}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.shipping.postalCode}
                      hasError={!!fieldState.error}
                      aria-required={
                        requiredFields?.[`${sectionKey}PostalCode`]
                      }
                      {...field}
                      disabled={isConfirmingCheckout}
                      autoComplete='off'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <PhoneInput sectionKey={sectionKey} disabled={isConfirmingCheckout} />
        </>
      )}
    </fieldset>
  );
}
