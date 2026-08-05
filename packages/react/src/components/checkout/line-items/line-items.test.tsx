import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  DraftOrderLineItems,
  getDisplayableImageSrc,
  type Product,
} from './line-items';

function lineItem(overrides: Partial<Product> = {}): Product {
  return {
    id: 'line-item-1',
    name: 'Removable Product',
    image: '',
    quantity: 1,
    originalPrice: 1200,
    price: 1200,
    ...overrides,
  };
}

function LineItemsHost({ onRemove }: { onRemove: (id: string) => void }) {
  const [items, setItems] = useState<Product[]>([
    lineItem({ id: 'line-item-1', name: 'Removable Product' }),
    lineItem({ id: 'line-item-2', name: 'Kept Product' }),
  ]);

  return (
    <GoDaddyProvider clientId='client-1'>
      <DraftOrderLineItems
        items={items}
        currencyCode='USD'
        inputInMinorUnits
        onRemoveFromCart={id => {
          onRemove(id);
          setItems(current => current.filter(item => item.id !== id));
        }}
      />
    </GoDaddyProvider>
  );
}

describe('getDisplayableImageSrc', () => {
  it.each([
    [
      'https://img.example.test/product.jpg',
      'https://img.example.test/product.jpg',
    ],
    [
      'http://img.example.test/product.jpg',
      'http://img.example.test/product.jpg',
    ],
    ['/images/product.jpg', '/images/product.jpg'],
    ['data:image/png;base64,abc', 'data:image/png;base64,abc'],
    [
      'blob:https://example.test/asset-id',
      'blob:https://example.test/asset-id',
    ],
    ['019fc87d-cd1e-7266-94ac-ca870c947819', undefined],
    ['', undefined],
  ])('maps %s to %s', (input, expected) => {
    expect(getDisplayableImageSrc(input)).toBe(expected);
  });
});

describe('DraftOrderLineItems', () => {
  it('uses the image placeholder when productAssetUrl is an asset id instead of a URL', () => {
    render(
      <GoDaddyProvider clientId='client-1'>
        <DraftOrderLineItems
          items={[
            lineItem({
              id: 'digital-line-item',
              name: 'Digital Product',
              image: '019fc87d-cd1e-7266-94ac-ca870c947819',
            }),
          ]}
          currencyCode='USD'
          inputInMinorUnits
        />
      </GoDaddyProvider>
    );

    expect(
      screen.getByTestId('line-item-image-placeholder')
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders an image when productAssetUrl is a URL', () => {
    render(
      <GoDaddyProvider clientId='client-1'>
        <DraftOrderLineItems
          items={[
            lineItem({
              id: 'image-line-item',
              name: 'Image Product',
              image: 'https://img.example.test/product.jpg',
            }),
          ]}
          currencyCode='USD'
          inputInMinorUnits
        />
      </GoDaddyProvider>
    );

    expect(screen.getByRole('img', { name: 'Image Product' })).toHaveAttribute(
      'src',
      'https://img.example.test/product.jpg'
    );
    expect(
      screen.queryByTestId('line-item-image-placeholder')
    ).not.toBeInTheDocument();
  });

  it('calls onRemoveFromCart with the line item id and removes host-owned items from the rendered list', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    render(<LineItemsHost onRemove={onRemove} />);

    expect(screen.getByText('Removable Product')).toBeInTheDocument();
    expect(screen.getByText('Kept Product')).toBeInTheDocument();

    await user.click(
      screen.getAllByRole('button', { name: /remove item/i })[0]
    );

    expect(onRemove).toHaveBeenCalledWith('line-item-1');
    await waitFor(() => {
      expect(screen.queryByText('Removable Product')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Kept Product')).toBeInTheDocument();
  });
});
