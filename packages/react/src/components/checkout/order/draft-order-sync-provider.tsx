import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  type CheckoutFormData,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { useUpdateOrder } from '@/components/checkout/order/use-update-order';
import type { UpdateDraftOrderInput } from '@/types';

export type DraftOrderPatch = Omit<UpdateDraftOrderInput['input'], 'context'>;

interface EnqueueDraftOrderPatchOptions {
  fieldNames?: string[];
  debounceMs?: number;
  immediate?: boolean;
}

interface DraftOrderSyncContextValue {
  enqueueDraftOrderPatch: (
    patch: DraftOrderPatch,
    options?: EnqueueDraftOrderPatchOptions
  ) => void;
  flushDraftOrderSync: () => Promise<void>;
}

const DraftOrderSyncContext =
  React.createContext<DraftOrderSyncContextValue | null>(null);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeDraftOrderPatch<T>(
  base: T | null | undefined,
  patch: T
): T {
  if (!base) return patch;

  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return patch;
  }

  const result: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };

  for (const [key, patchValue] of Object.entries(
    patch as Record<string, unknown>
  )) {
    if (patchValue === undefined) continue;

    const baseValue = result[key];

    if (patchValue === null) {
      result[key] = null;
      continue;
    }

    if (Array.isArray(patchValue)) {
      result[key] = patchValue;
      continue;
    }

    if (isPlainObject(baseValue) && isPlainObject(patchValue)) {
      result[key] = mergeDraftOrderPatch(baseValue, patchValue);
      continue;
    }

    result[key] = patchValue;
  }

  return result as T;
}

export function DraftOrderSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const updateDraftOrder = useUpdateOrder();
  const { session, isConfirmingCheckout } = useCheckoutContext();
  const form = useFormContext<CheckoutFormData>();
  const pendingPatchRef = React.useRef<DraftOrderPatch | null>(null);
  const pendingFieldNamesRef = React.useRef<Set<string>>(new Set());
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = React.useRef(false);
  const drainPromiseRef = React.useRef<Promise<void> | null>(null);
  const idleWaitersRef = React.useRef<Array<() => void>>([]);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resolveIdleWaiters = React.useCallback(() => {
    if (timerRef.current || pendingPatchRef.current || inFlightRef.current) {
      return;
    }

    const waiters = idleWaitersRef.current;
    idleWaitersRef.current = [];
    for (const resolve of waiters) {
      resolve();
    }
  }, []);

  const drainQueue = React.useCallback(async () => {
    if (drainPromiseRef.current) return drainPromiseRef.current;

    drainPromiseRef.current = (async () => {
      if (inFlightRef.current) return;

      while (pendingPatchRef.current) {
        const patch = pendingPatchRef.current;

        if (!session) {
          pendingPatchRef.current = null;
          pendingFieldNamesRef.current = new Set();
          break;
        }
        const { channelId, storeId, draftOrder, customerId } = session;
        if (!channelId || !storeId || !draftOrder?.id) {
          pendingPatchRef.current = null;
          pendingFieldNamesRef.current = new Set();
          break;
        }

        const fieldNames = [...pendingFieldNamesRef.current];
        pendingPatchRef.current = null;
        pendingFieldNamesRef.current = new Set();
        inFlightRef.current = true;

        try {
          await updateDraftOrder.mutateAsync({
            input: {
              ...patch,
              context: { channelId, storeId },
              ...(customerId ? { customerId } : {}),
            },
          });

          for (const fieldName of fieldNames) {
            const currentValue = form.getValues(
              fieldName as keyof CheckoutFormData
            );
            form.resetField(fieldName as keyof CheckoutFormData, {
              defaultValue: currentValue,
            });
          }
        } catch (error) {
          pendingPatchRef.current = pendingPatchRef.current
            ? mergeDraftOrderPatch(patch, pendingPatchRef.current)
            : patch;
          for (const fieldName of fieldNames) {
            pendingFieldNamesRef.current.add(fieldName);
          }
          throw error;
        } finally {
          inFlightRef.current = false;
        }
      }

      resolveIdleWaiters();
    })();

    try {
      await drainPromiseRef.current;
    } finally {
      drainPromiseRef.current = null;
      resolveIdleWaiters();
    }
  }, [form, resolveIdleWaiters, session, updateDraftOrder]);

  const enqueueDraftOrderPatch = React.useCallback(
    (patch: DraftOrderPatch, options: EnqueueDraftOrderPatchOptions = {}) => {
      if (isConfirmingCheckout) return;

      pendingPatchRef.current = mergeDraftOrderPatch(
        pendingPatchRef.current,
        patch
      );

      for (const fieldName of options.fieldNames ?? []) {
        pendingFieldNamesRef.current.add(fieldName);
      }

      clearTimer();

      const drainQueueSafely = () => {
        void drainQueue().catch(() => {
          // The failed patch is restored in drainQueue's catch block. Ignore
          // background sync failures here so payment/explicit flush paths can
          // surface the recoverable error to the customer.
        });
      };

      if (options.immediate) {
        drainQueueSafely();
        return;
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        drainQueueSafely();
      }, options.debounceMs ?? 750);
    },
    [clearTimer, drainQueue, isConfirmingCheckout]
  );

  const flushDraftOrderSync = React.useCallback(async () => {
    clearTimer();
    await drainQueue();

    if (!timerRef.current && !pendingPatchRef.current && !inFlightRef.current) {
      return;
    }

    await new Promise<void>(resolve => {
      idleWaitersRef.current.push(resolve);
      resolveIdleWaiters();
    });
  }, [clearTimer, drainQueue, resolveIdleWaiters]);

  React.useEffect(() => {
    if (!isConfirmingCheckout) return;

    clearTimer();
    pendingPatchRef.current = null;
    pendingFieldNamesRef.current = new Set();
  }, [clearTimer, isConfirmingCheckout]);

  React.useEffect(() => clearTimer, [clearTimer]);

  const value = React.useMemo(
    () => ({ enqueueDraftOrderPatch, flushDraftOrderSync }),
    [enqueueDraftOrderPatch, flushDraftOrderSync]
  );

  return (
    <DraftOrderSyncContext.Provider value={value}>
      {children}
    </DraftOrderSyncContext.Provider>
  );
}

export function useDraftOrderSyncQueue() {
  const context = React.useContext(DraftOrderSyncContext);
  if (!context) {
    throw new Error(
      'useDraftOrderSyncQueue must be used within DraftOrderSyncProvider'
    );
  }
  return context;
}
