import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GoDaddyProvider } from '@/godaddy-provider';
import { DraftOrderLineItems, type Product } from './line-items';

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

describe('DraftOrderLineItems', () => {
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
