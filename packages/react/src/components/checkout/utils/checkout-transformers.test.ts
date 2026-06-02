import { describe, expect, it, vi } from 'vitest';
import type { DraftOrder, SKUProduct } from '@/types';

vi.mock('@/components/checkout/delivery/delivery-method', () => ({
  DeliveryMethods: {
    PICKUP: 'PICKUP',
    PURCHASE: 'PURCHASE',
    SHIP: 'SHIP',
  },
}));

const DeliveryMethods = {
  PICKUP: 'PICKUP',
  PURCHASE: 'PURCHASE',
  SHIP: 'SHIP',
} as const;

import {
  mapOrderToFormValues,
  mapSkusToItemsDisplay,
} from './checkout-transformers';

type DeepPartial<T> = T extends Array<infer U>
  ? Array<DeepPartial<NonNullable<U>>>
  : T extends object
    ? {
        [K in keyof T]?: DeepPartial<NonNullable<T[K]>> | Extract<T[K], null>;
      }
    : T;

type DraftOrderLineItem = NonNullable<DraftOrder['lineItems']>[number];
type DraftOrderContact = NonNullable<DraftOrder['shipping']>;
type DraftOrderAddress = NonNullable<DraftOrderContact['address']>;

const money = (value: number, currencyCode = 'USD') => ({
  value,
  currencyCode,
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, patch?: DeepPartial<T>): T {
  if (patch === undefined) return structuredClone(base);

  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return structuredClone(patch as T);
  }

  const result: Record<string, unknown> = structuredClone(base) as Record<
    string,
    unknown
  >;

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      result[key] = structuredClone(value);
    } else if (isPlainObject(result[key]) && isPlainObject(value)) {
      result[key] = deepMerge(result[key], value as never);
    } else {
      result[key] = structuredClone(value);
    }
  }

  return result as T;
}

function buildAddress(
  overrides: DeepPartial<DraftOrderAddress> = {}
): DraftOrderAddress {
  const base: DraftOrderAddress = {
    addressLine1: '123 Test St',
    addressLine2: '',
    addressLine3: '',
    adminArea1: 'GA',
    adminArea2: 'Jasper',
    adminArea3: '',
    adminArea4: '',
    postalCode: '30143',
    countryCode: 'US',
  };

  return deepMerge(base, overrides);
}

function buildContact(
  overrides: DeepPartial<DraftOrderContact> = {}
): DraftOrderContact {
  const base: DraftOrderContact = {
    firstName: 'Jane',
    lastName: 'Buyer',
    email: 'jane@example.com',
    phone: '+12015550123',
    address: buildAddress(),
  };

  return deepMerge(base, overrides);
}

function buildLineItem(
  overrides: DeepPartial<DraftOrderLineItem> = {}
): DraftOrderLineItem {
  return deepMerge(
    {
      externalId: null,
      id: 'line-item-1',
      name: 'Test Product',
      productId: 'product-1',
      quantity: 1,
      status: 'ACTIVE',
      tags: [],
      type: 'SKU',
      fulfillmentMode: DeliveryMethods.SHIP,
      details: {
        sku: 'sku-1',
        productAssetUrl: null,
        selectedAddons: [],
        selectedOptions: [],
        unitOfMeasure: null,
      },
      totals: {
        subTotal: money(2500),
        discountTotal: money(0),
        feeTotal: money(0),
        taxTotal: money(0),
      },
      unitAmount: money(2500),
      discounts: [],
      fees: [],
      notes: [],
      taxes: [],
      metafields: [],
    } as unknown as DraftOrderLineItem,
    overrides
  );
}

function buildDraftOrder(overrides: DeepPartial<DraftOrder> = {}): DraftOrder {
  return deepMerge(
    {
      id: 'draft-order-1',
      customerId: 'customer-1',
      shipping: buildContact(),
      billing: buildContact(),
      notes: [],
      discounts: [],
      shippingLines: [],
      taxes: [],
      fees: [],
      statuses: {
        fulfillmentStatus: null,
        paymentStatus: null,
        status: 'CREATED',
      },
      totals: {
        subTotal: money(2500),
        discountTotal: money(0),
        shippingTotal: money(0),
        taxTotal: money(0),
        feeTotal: money(0),
        total: money(2500),
      },
      lineItems: [buildLineItem()],
    } as unknown as DraftOrder,
    overrides
  );
}

describe('mapOrderToFormValues', () => {
  it.each([
    {
      description: 'all pickup line items',
      lineItems: [
        buildLineItem({
          id: 'pickup-1',
          fulfillmentMode: DeliveryMethods.PICKUP,
        }),
        buildLineItem({
          id: 'pickup-2',
          fulfillmentMode: DeliveryMethods.PICKUP,
        }),
      ],
      expected: DeliveryMethods.PICKUP,
    },
    {
      description: 'all ship line items',
      lineItems: [
        buildLineItem({ id: 'ship-1', fulfillmentMode: DeliveryMethods.SHIP }),
        buildLineItem({ id: 'ship-2', fulfillmentMode: DeliveryMethods.SHIP }),
      ],
      expected: DeliveryMethods.SHIP,
    },
    {
      description: 'mixed pickup and ship line items',
      lineItems: [
        buildLineItem({
          id: 'pickup-1',
          fulfillmentMode: DeliveryMethods.PICKUP,
        }),
        buildLineItem({ id: 'ship-1', fulfillmentMode: DeliveryMethods.SHIP }),
      ],
      expected: DeliveryMethods.PURCHASE,
    },
  ])('derives delivery method from $description', ({ lineItems, expected }) => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({ lineItems }),
    });

    expect(values.deliveryMethod).toBe(expected);
  });

  it('falls back to purchase when item-level pickup is disabled at the session level', () => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({
        lineItems: [buildLineItem({ fulfillmentMode: DeliveryMethods.PICKUP })],
      }),
      enableLocalPickup: false,
    });

    expect(values.deliveryMethod).toBe(DeliveryMethods.PURCHASE);
  });

  it('uses the shipping address for payment when name, address, and normalized phone match billing', () => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({
        shipping: { phone: '+12015550123' },
        billing: { phone: '(201) 555-0123' },
      }),
    });

    expect(values.paymentUseShippingAddress).toBe(true);
  });

  it('uses the shipping address for payment by default when there is no shipping address line 1', () => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({
        shipping: { address: { addressLine1: '' } },
        billing: { address: { addressLine1: '456 Billing Rd' } },
      }),
    });

    expect(values.paymentUseShippingAddress).toBe(true);
  });

  it('hydrates the first requested shipping service as the selected shipping method', () => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({
        shippingLines: [
          {
            id: 'shipping-line-1',
            requestedService: 'priority-overnight',
            amount: money(1299),
            discounts: [],
          },
        ],
      }),
    });

    expect(values.shippingMethod).toBe('priority-overnight');
  });

  it('hydrates only the first non-empty customer note', () => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({
        notes: [
          { id: 'staff-note', authorType: 'STAFF', content: 'Internal only' },
          { id: 'blank-customer-note', authorType: 'CUSTOMER', content: '   ' },
          {
            id: 'customer-note',
            authorType: 'CUSTOMER',
            content: 'Leave by the gate',
          },
        ],
      }),
    });

    expect(values.notes).toBe('Leave by the gate');
  });

  it('returns schema defaults for an empty draft order without throwing', () => {
    const values = mapOrderToFormValues({ order: null });

    expect(values).toEqual(
      expect.objectContaining({
        shippingFirstName: '',
        shippingCountryCode: 'US',
        billingFirstName: '',
        billingCountryCode: 'US',
        contactEmail: '',
        deliveryMethod: DeliveryMethods.PURCHASE,
        paymentUseShippingAddress: true,
        notes: '',
        shippingMethod: '',
      })
    );
  });

  it('normalizes undefined phone input to an empty string', () => {
    const order = buildDraftOrder() as unknown as {
      shipping: { phone?: string };
    };
    order.shipping.phone = undefined;

    const values = mapOrderToFormValues({ order: order as DraftOrder });

    expect(values.shippingPhone).toBe('');
  });

  it.each([
    { phone: null, expected: '' },
    { phone: '', expected: '' },
  ])(
    'normalizes $phone phone input to an empty string',
    ({ phone, expected }) => {
      const values = mapOrderToFormValues({
        order: buildDraftOrder({ shipping: { phone } }),
      });

      expect(values.shippingPhone).toBe(expected);
    }
  );

  it('prefixes the default country calling code when the phone is missing one', () => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({
        shipping: {
          phone: '020 7946 0958',
          address: { countryCode: '' },
        },
      }),
      defaultCountryCode: 'GB',
    });

    expect(values.shippingPhone).toBe('+442079460958');
  });

  it('strips dashes and normalizes spaces and parentheses', () => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({
        shipping: { phone: '(201) 555-0123' },
      }),
    });

    expect(values.shippingPhone).toBe('+12015550123');
  });

  it('leaves an already-E.164 phone number unchanged', () => {
    const values = mapOrderToFormValues({
      order: buildDraftOrder({ shipping: { phone: '+442079460958' } }),
    });

    expect(values.shippingPhone).toBe('+442079460958');
  });
});

describe('mapSkusToItemsDisplay', () => {
  it('sorts by lineItemOrder metafield and keeps unordered items at the end stably', () => {
    const unorderedFirst = buildLineItem({
      id: 'unordered-first',
      name: 'Unordered first',
    });
    const orderedSecond = buildLineItem({
      id: 'ordered-second',
      name: 'Ordered second',
      metafields: [{ key: 'lineItemOrder', value: '2' }],
    });
    const orderedFirst = buildLineItem({
      id: 'ordered-first',
      name: 'Ordered first',
      metafields: [{ key: 'lineItemOrder', value: '1' }],
    });
    const unorderedSecond = buildLineItem({
      id: 'unordered-second',
      name: 'Unordered second',
    });

    const items = mapSkusToItemsDisplay([
      unorderedFirst,
      orderedSecond,
      orderedFirst,
      unorderedSecond,
    ]);

    expect(items.map(item => item.id)).toEqual([
      'ordered-first',
      'ordered-second',
      'unordered-first',
      'unordered-second',
    ]);
  });

  it('falls back to SKU attributes when the line item has no selected options', () => {
    const lineItem = buildLineItem({
      details: { sku: 'sku-blue-small', selectedOptions: null },
    });
    const skuDetails = {
      label: 'Blue shirt',
      attributes: [
        {
          label: 'Color',
          name: 'color',
          values: [{ id: 'blue', label: 'Blue' }],
        },
        { label: '', name: 'size', values: [{ id: 'small', label: 'Small' }] },
      ],
      attributeValues: [
        { id: 'blue', label: 'Blue', name: 'blue' },
        { id: 'small', label: '', name: 'Small' },
      ],
    } as SKUProduct;

    const items = mapSkusToItemsDisplay([lineItem], {
      'sku-blue-small': skuDetails,
    });

    expect(items[0]?.selectedOptions).toEqual([
      { attribute: 'Color', values: ['Blue'] },
      { attribute: 'size', values: ['Small'] },
    ]);
  });

  it('populates quantity, image, and price fields from line item data', () => {
    const lineItem = buildLineItem({
      id: 'priced-line-item',
      quantity: 2,
      details: { productAssetUrl: 'https://img.example.test/product.png' },
      totals: {
        subTotal: money(5000),
        feeTotal: money(250),
        discountTotal: money(1000),
        taxTotal: money(300),
      },
    });

    const items = mapSkusToItemsDisplay([lineItem]);

    expect(items[0]).toEqual(
      expect.objectContaining({
        id: 'priced-line-item',
        image: 'https://img.example.test/product.png',
        quantity: 2,
        originalPrice: 2500,
        price: 4250,
      })
    );
  });
});
