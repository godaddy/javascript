import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  document.documentElement.className = '';
});

it('contains checkout dropdowns and appearance without changing the host document', async () => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        return undefined;
      }
      unobserve() {
        return undefined;
      }
      disconnect() {
        return undefined;
      }
    }
  );
  const container = document.createElement('div');
  document.body.append(container);
  document.documentElement.classList.add('theme-orange');
  const user = userEvent.setup();
  render(
    <GoDaddyProvider
      uiContainer={container}
      appearance={{ variables: { primary: 'purple' } }}
    >
      <Select>
        <SelectTrigger aria-label='Country'>
          <SelectValue placeholder='Choose country' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='US'>United States</SelectItem>
        </SelectContent>
      </Select>
    </GoDaddyProvider>,
    { container }
  );
  expect(document.documentElement.classList.contains('theme-orange')).toBe(
    true
  );
  expect(document.documentElement.style.getPropertyValue('--gd-primary')).toBe(
    ''
  );
  expect(container.style.getPropertyValue('--gd-primary')).toBe('purple');
  screen.getByRole('combobox').focus();
  await user.keyboard('{ArrowDown}');
  await waitFor(() =>
    expect(container.contains(screen.getByRole('listbox'))).toBe(true)
  );
});
