import { useEffect, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';

const RAZORPAY_SDK_ID = 'razorpay-sdk';
const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let isRazorpayLoaded = false;
let isRazorpayScriptRequested = false;
const listeners = new Set<(loaded: boolean, failed: boolean) => void>();

function hasRazorpayConstructor() {
  return typeof (window as Window & { Razorpay?: unknown }).Razorpay === 'function';
}

function notifyListeners(loaded: boolean, failed: boolean) {
  listeners.forEach(listener => listener(loaded, failed));
}

export function useLoadRazorpay() {
  const { razorpayConfig } = useCheckoutContext();
  const [loaded, setLoaded] = useState(
    () => typeof window !== 'undefined' && hasRazorpayConstructor()
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const updateState = (nextLoaded: boolean, nextFailed: boolean) => {
      setLoaded(nextLoaded);
      setFailed(nextFailed);
    };
    listeners.add(updateState);

    if (isRazorpayLoaded || hasRazorpayConstructor()) {
      isRazorpayLoaded = true;
      updateState(true, false);
    }

    return () => {
      listeners.delete(updateState);
    };
  }, []);

  useEffect(() => {
    if (!razorpayConfig?.publicToken || isRazorpayLoaded) return;

    const existingScript = document.getElementById(
      RAZORPAY_SDK_ID
    ) as HTMLScriptElement | null;

    if (existingScript) {
      isRazorpayScriptRequested = true;
      const handleLoad = () => {
        isRazorpayLoaded = hasRazorpayConstructor();
        notifyListeners(isRazorpayLoaded, !isRazorpayLoaded);
      };
      const handleError = () => {
        isRazorpayScriptRequested = false;
        notifyListeners(false, true);
      };
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    if (isRazorpayScriptRequested) return;

    isRazorpayScriptRequested = true;
    const script = document.createElement('script');
    script.id = RAZORPAY_SDK_ID;
    script.src = RAZORPAY_SDK_URL;
    script.async = true;
    script.onload = () => {
      isRazorpayLoaded = hasRazorpayConstructor();
      notifyListeners(isRazorpayLoaded, !isRazorpayLoaded);
    };
    script.onerror = () => {
      isRazorpayScriptRequested = false;
      notifyListeners(false, true);
    };
    document.body.appendChild(script);
  }, [razorpayConfig?.publicToken]);

  return {
    isRazorpayLoaded: loaded,
    isRazorpayLoadFailed: failed,
  };
}
