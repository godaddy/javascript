import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RazorpayLoaderProvider,
  useRazorpayLoader,
} from './razorpay-loader-context';

function Probe({ label = 'probe' }: { label?: string }) {
  const { isRazorpayLoaded, isRazorpayLoadFailed } = useRazorpayLoader();
  return (
    <div data-testid={label}>
      {`loaded:${isRazorpayLoaded} failed:${isRazorpayLoadFailed}`}
    </div>
  );
}

function getScript() {
  return document.getElementById('razorpay-sdk') as HTMLScriptElement | null;
}

function markLoaded() {
  Object.defineProperty(window, 'Razorpay', {
    configurable: true,
    value: vi.fn(),
  });
}

describe('RazorpayLoaderProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.getElementById('razorpay-sdk')?.remove();
    Reflect.deleteProperty(window, 'Razorpay');
    vi.useRealTimers();
  });

  it('injects the SDK script and reports load success', () => {
    render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );
    const script = getScript();

    expect(script?.src).toBe('https://checkout.razorpay.com/v1/checkout.js');
    expect(screen.getByTestId('probe').textContent).toBe(
      'loaded:false failed:false'
    );

    markLoaded();
    act(() => {
      script?.dispatchEvent(new Event('load'));
    });

    expect(screen.getByTestId('probe').textContent).toBe(
      'loaded:true failed:false'
    );
  });

  it('retries when the script loads without the Razorpay constructor', () => {
    render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );

    act(() => {
      getScript()?.dispatchEvent(new Event('load'));
    });

    expect(getScript()).toBeNull();
    expect(screen.getByTestId('probe').textContent).toBe(
      'loaded:false failed:false'
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(getScript()?.dataset.status).toBe('loading');
  });

  it('retries loading the SDK on script error before giving up', () => {
    render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );

    act(() => {
      getScript()?.dispatchEvent(new Event('error'));
    });

    // Script tag is replaced and the failure isn't surfaced yet - a retry is pending.
    expect(getScript()).toBeNull();
    expect(screen.getByTestId('probe').textContent).toBe(
      'loaded:false failed:false'
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(getScript()).not.toBeNull();

    markLoaded();
    act(() => {
      getScript()?.dispatchEvent(new Event('load'));
    });

    expect(screen.getByTestId('probe').textContent).toBe(
      'loaded:true failed:false'
    );
  });

  it('surfaces a failure after exhausting all retries', () => {
    render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      act(() => {
        getScript()?.dispatchEvent(new Event('error'));
      });
      act(() => {
        vi.advanceTimersByTime((attempt + 1) * 1000);
      });
    }

    act(() => {
      getScript()?.dispatchEvent(new Event('error'));
    });

    expect(screen.getByTestId('probe').textContent).toBe(
      'loaded:false failed:true'
    );
  });

  it('shares load state across consumers under the same provider', () => {
    render(
      <RazorpayLoaderProvider>
        <Probe label='first' />
        <Probe label='second' />
      </RazorpayLoaderProvider>
    );

    // Only one script tag should be requested for both consumers.
    expect(document.querySelectorAll('#razorpay-sdk')).toHaveLength(1);

    markLoaded();
    act(() => {
      getScript()?.dispatchEvent(new Event('load'));
    });

    expect(screen.getByTestId('first').textContent).toBe(
      'loaded:true failed:false'
    );
    expect(screen.getByTestId('second').textContent).toBe(
      'loaded:true failed:false'
    );
  });

  it('reuses an in-flight script tag on remount instead of duplicating it', () => {
    const { unmount } = render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );
    expect(document.querySelectorAll('#razorpay-sdk')).toHaveLength(1);

    unmount();
    render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );

    expect(document.querySelectorAll('#razorpay-sdk')).toHaveLength(1);

    markLoaded();
    act(() => {
      getScript()?.dispatchEvent(new Event('load'));
    });

    expect(screen.getByTestId('probe').textContent).toBe(
      'loaded:true failed:false'
    );
  });

  it('stops listening to a reused script tag after unmount', () => {
    const { unmount } = render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );
    const script = getScript();
    unmount();

    // An unmounted provider must not retry, so its listener is detached and
    // the shared script tag survives the error.
    act(() => {
      script?.dispatchEvent(new Event('error'));
    });

    expect(getScript()).not.toBeNull();
    expect(getScript()?.dataset.status).toBe('failed');
  });

  it('replaces a failed script tag when the provider remounts', () => {
    const { unmount } = render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );
    const failedScript = getScript();
    unmount();

    act(() => {
      failedScript?.dispatchEvent(new Event('error'));
    });
    expect(failedScript?.dataset.status).toBe('failed');

    render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );

    expect(getScript()).not.toBe(failedScript);
    expect(getScript()?.dataset.status).toBe('loading');
  });

  it('replaces a constructor-less loaded script when the provider remounts', () => {
    const { unmount } = render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );
    const failedScript = getScript();
    unmount();

    act(() => {
      failedScript?.dispatchEvent(new Event('load'));
    });
    expect(failedScript?.dataset.status).toBe('failed');

    render(
      <RazorpayLoaderProvider>
        <Probe />
      </RazorpayLoaderProvider>
    );

    expect(getScript()).not.toBe(failedScript);
    expect(getScript()?.dataset.status).toBe('loading');
  });
});
