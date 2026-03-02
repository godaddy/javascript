import { useEffect, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';

let isMercadoPagoLoaded = false;
let isMercadoPagoCDNLoaded = false;
const listeners = new Set<(loaded: boolean) => void>();
const MERCADOPAGO_SDK_ID = 'mercadopago-sdk';

export function useLoadMercadoPago() {
  const { mercadoPagoConfig } = useCheckoutContext();
  const [loaded, setLoaded] = useState(isMercadoPagoLoaded);

  const mercadoPagoCDN = 'https://sdk.mercadopago.com/js/v2';

  useEffect(() => {
    // Register this component to be notified when MercadoPago loads
    const updateLoaded = (newLoaded: boolean) => setLoaded(newLoaded);
    listeners.add(updateLoaded);

    // If already loaded, update immediately
    if (isMercadoPagoLoaded) {
      setLoaded(true);
    }

    return () => {
      listeners.delete(updateLoaded);
    };
  }, []);

  useEffect(() => {
    if (
      isMercadoPagoLoaded ||
      isMercadoPagoCDNLoaded ||
      !mercadoPagoConfig ||
      !mercadoPagoCDN
    ) {
      return;
    }

    const existingScript = document.getElementById(MERCADOPAGO_SDK_ID);
    if (existingScript) {
      isMercadoPagoCDNLoaded = true;
      return;
    }

    isMercadoPagoCDNLoaded = true;
    const script = document.createElement('script');
    script.id = MERCADOPAGO_SDK_ID;
    script.src = mercadoPagoCDN;
    script.async = true;
    script.onload = () => {
      isMercadoPagoLoaded = true;
      // Notify all components that MercadoPago has loaded
      listeners.forEach(listener => listener(true));
    };

    document.body.appendChild(script);
  }, [mercadoPagoConfig, mercadoPagoCDN]);

  return { isMercadoPagoLoaded: loaded };
}
