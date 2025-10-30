import { useEffect, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useGetPoyntCollectCdn } from '@/components/checkout/payment/utils/use-poynt-collect-cdn';

let isPoyntLoaded = false;
let isPoyntCDNLoaded = false;
const listeners = new Set<(loaded: boolean) => void>();

// load collect.js globally so it can be used for card component and Apple/G Pay buttons
export function useLoadPoyntCollect() {
  const { godaddyPaymentsConfig } = useCheckoutContext();
  const collectCDN = useGetPoyntCollectCdn();
  const [loaded, setLoaded] = useState(isPoyntLoaded);

  useEffect(() => {
    // Register this component to be notified when Poynt loads
    const updateLoaded = (newLoaded: boolean) => setLoaded(newLoaded);
    listeners.add(updateLoaded);

    // If already loaded, update immediately
    if (isPoyntLoaded) {
      setLoaded(true);
    }

    return () => {
      listeners.delete(updateLoaded);
    };
  }, []);

  useEffect(() => {
    if (isPoyntCDNLoaded || isPoyntLoaded || !godaddyPaymentsConfig || !collectCDN) {
      return;
    }

    isPoyntCDNLoaded = true;
    const script = document.createElement('script');
    script.src = collectCDN;
    script.async = true;
    script.onload = () => {
      isPoyntLoaded = true;
      // Notify all components that Poynt has loaded
      listeners.forEach(listener => listener(true));
    };

    document?.body?.appendChild(script);
  }, [godaddyPaymentsConfig, collectCDN]);

  return { isPoyntLoaded: loaded };
}
