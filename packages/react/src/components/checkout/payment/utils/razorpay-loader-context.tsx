import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const RAZORPAY_SDK_ID = 'razorpay-sdk';
const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const MAX_LOAD_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

type RazorpayLoaderState = {
  isRazorpayLoaded: boolean;
  isRazorpayLoadFailed: boolean;
};

const RazorpayLoaderContext = createContext<RazorpayLoaderState>({
  isRazorpayLoaded: false,
  isRazorpayLoadFailed: false,
});

function hasRazorpayConstructor() {
  return (
    typeof (window as Window & { Razorpay?: unknown }).Razorpay === 'function'
  );
}

export function RazorpayLoaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RazorpayLoaderState>(() => ({
    isRazorpayLoaded: typeof window !== 'undefined' && hasRazorpayConstructor(),
    isRazorpayLoadFailed: false,
  }));
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (hasRazorpayConstructor()) {
      setState({ isRazorpayLoaded: true, isRazorpayLoadFailed: false });
      return;
    }

    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let detachListeners: (() => void) | undefined;
    let pendingScript: HTMLScriptElement | undefined;

    const handleLoad = () => {
      if (cancelled) return;
      retryCountRef.current = 0;
      // A load event without the constructor means the SDK did not install
      // itself, which is a failure rather than a usable Checkout.
      const loaded = hasRazorpayConstructor();
      setState({ isRazorpayLoaded: loaded, isRazorpayLoadFailed: !loaded });
    };

    const handleError = () => {
      detachListeners?.();
      pendingScript?.remove();
      pendingScript = undefined;
      if (cancelled) return;

      if (retryCountRef.current < MAX_LOAD_RETRIES) {
        retryCountRef.current += 1;
        retryTimeout = setTimeout(
          loadScript,
          RETRY_DELAY_MS * retryCountRef.current
        );
      } else {
        setState({ isRazorpayLoaded: false, isRazorpayLoadFailed: true });
      }
    };

    // A reused script tag outlives this provider, so the listeners have to be
    // detachable on unmount to keep remounts from stacking callbacks.
    function attachListeners(script: HTMLScriptElement) {
      pendingScript = script;
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      detachListeners = () => {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
        detachListeners = undefined;
      };
    }

    function loadScript() {
      // The DOM is the source of truth for whether a script tag is already
      // in flight, so no module-level flag is needed to dedupe requests.
      const existingScript = document.getElementById(
        RAZORPAY_SDK_ID
      ) as HTMLScriptElement | null;
      if (existingScript) {
        attachListeners(existingScript);
        return;
      }

      const script = document.createElement('script');
      script.id = RAZORPAY_SDK_ID;
      script.src = RAZORPAY_SDK_URL;
      script.async = true;
      attachListeners(script);
      document.body.appendChild(script);
    }

    loadScript();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      detachListeners?.();
    };
  }, []);

  return (
    <RazorpayLoaderContext.Provider value={state}>
      {children}
    </RazorpayLoaderContext.Provider>
  );
}

export function useRazorpayLoader() {
  return useContext(RazorpayLoaderContext);
}
