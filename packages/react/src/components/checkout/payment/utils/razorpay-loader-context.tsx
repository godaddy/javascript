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

type RazorpayScriptStatus = 'loading' | 'loaded' | 'failed';

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

function setScriptStatus(
  script: HTMLScriptElement,
  status: RazorpayScriptStatus
) {
  script.dataset.status = status;
}

function getScriptStatus(
  script: HTMLScriptElement
): RazorpayScriptStatus | undefined {
  const status = script.dataset.status;
  return status === 'loading' || status === 'loaded' || status === 'failed'
    ? status
    : undefined;
}

function trackScriptStatus(script: HTMLScriptElement) {
  script.addEventListener(
    'load',
    () => {
      setScriptStatus(script, hasRazorpayConstructor() ? 'loaded' : 'failed');
    },
    { once: true }
  );
  script.addEventListener(
    'error',
    () => {
      setScriptStatus(script, 'failed');
    },
    { once: true }
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
      if (!hasRazorpayConstructor()) {
        handleError();
        return;
      }
      retryCountRef.current = 0;
      setState({ isRazorpayLoaded: true, isRazorpayLoadFailed: false });
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
        const status = getScriptStatus(existingScript);
        if (status === 'loading') {
          attachListeners(existingScript);
          return;
        }

        // A completed, failed, or untracked tag cannot emit another useful
        // event. Replace it instead of leaving a remounted provider waiting.
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = RAZORPAY_SDK_ID;
      script.src = RAZORPAY_SDK_URL;
      script.async = true;
      setScriptStatus(script, 'loading');
      // These listeners intentionally survive provider unmounts so the tag
      // records its outcome for a later remount.
      trackScriptStatus(script);
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
