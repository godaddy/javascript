import { useEffect, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';

let isSquareLoaded = false;
let isSquareCDNLoaded = false;
const listeners = new Set<(loaded: boolean) => void>();

export function useLoadSquare() {
  const { squareConfig } = useCheckoutContext();
  const [loaded, setLoaded] = useState(isSquareLoaded);
  const environment =
    process.env.GODADDY_ENV || process.env.NEXT_PUBLIC_GODADDY_ENV || 'prod';

  const squareCDN =
    environment === 'prod'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

  useEffect(() => {
    // Register this component to be notified when Square loads
    const updateLoaded = (newLoaded: boolean) => setLoaded(newLoaded);
    listeners.add(updateLoaded);

    // If already loaded, update immediately
    if (isSquareLoaded) {
      setLoaded(true);
    }

    return () => {
      listeners.delete(updateLoaded);
    };
  }, []);

  useEffect(() => {
    if (isSquareLoaded || isSquareCDNLoaded || !squareConfig || !squareCDN) {
      return;
    }

    isSquareCDNLoaded = true;
    const script = document.createElement('script');
    script.src = squareCDN;
    script.async = true;
    script.onload = () => {
      isSquareLoaded = true;
      // Notify all components that Square has loaded
      listeners.forEach(listener => listener(true));
    };

    document.body.appendChild(script);
  }, [squareConfig, squareCDN]);

  return { isSquareLoaded: loaded };
}
