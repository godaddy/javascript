import { useQueryClient } from '@tanstack/react-query';
import isEqual from 'fast-deep-equal';
import * as React from 'react';
import { type UseFormReturn, useFormContext } from 'react-hook-form';
import type { z } from 'zod';
import {
  type CheckoutFormData,
  useCheckoutContext,
} from '@/components/checkout/checkout';
import { useDraftOrder } from '@/components/checkout/order/use-draft-order';
import { useUpdateOrder } from '@/components/checkout/order/use-update-order';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import type {
  CheckoutSession,
  DraftOrder,
  UpdateDraftOrderInput,
} from '@/types';

export type DraftOrderPatch = Omit<UpdateDraftOrderInput['input'], 'context'>;

type DraftOrderSyncRegistrationId = string;

type DraftOrderSyncRegistrationContext = {
  values: CheckoutFormData;
  form: UseFormReturn<CheckoutFormData>;
  draftOrder?: DraftOrder | null;
  session?: CheckoutSession | null;
};

export type DraftOrderSyncRegistration = {
  id: DraftOrderSyncRegistrationId;
  fieldNames: string[];
  debounceMs?: number;
  /** Skips the registration when its values are unchanged or not yet valid. */
  enabled?: (context: DraftOrderSyncRegistrationContext) => boolean;
  buildPatch: (
    context: DraftOrderSyncRegistrationContext
  ) => DraftOrderPatch | null;
};

interface EnqueueDraftOrderPatchOptions {
  fieldNames?: string[];
  debounceMs?: number;
  immediate?: boolean;
  allowWhileConfirming?: boolean;
}

export interface FlushDraftOrderSyncOptions {
  /**
   * Rebuild patches from every registration using the current form values
   * instead of only the registrations marked dirty by background edits.
   */
  includeCurrentValues?: boolean;
  refetchLatestOrder?: boolean;
  /**
   * Registration patches are not rebuilt while checkout is confirming unless
   * the caller is the authoritative final checkout sync.
   */
  allowWhileConfirming?: boolean;
}

export interface FlushDraftOrderSyncResult {
  latestOrder?: DraftOrder | null;
  patchSent: boolean;
}

type PendingDraftOrderPatch = {
  patch: DraftOrderPatch;
  fieldNames: string[];
  registrationIds: string[];
};

interface DraftOrderSyncContextValue {
  enqueueDraftOrderPatch: (
    patch: DraftOrderPatch,
    options?: EnqueueDraftOrderPatchOptions
  ) => void;
  registerDraftOrderSync: (
    registration: DraftOrderSyncRegistration
  ) => () => void;
  markDraftOrderSyncDirty: (
    registrationId: DraftOrderSyncRegistrationId,
    options?: { immediate?: boolean; allowWhileConfirming?: boolean }
  ) => void;
  flushDraftOrderSync: (
    options?: FlushDraftOrderSyncOptions
  ) => Promise<FlushDraftOrderSyncResult>;
}

const DraftOrderSyncContext =
  React.createContext<DraftOrderSyncContextValue | null>(null);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasActualPatchContent(patch: DraftOrderPatch | null | undefined) {
  if (!patch) return false;

  return Object.entries(patch).some(
    ([inputKey, value]) =>
      inputKey !== 'context' && inputKey !== 'customerId' && value !== undefined
  );
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
  schema,
}: {
  children: React.ReactNode;
  /**
   * The same schema the form resolver uses. Registrations are skipped while
   * their fields are invalid so rejected values never reach the draft order.
   */
  schema?: z.ZodTypeAny;
}) {
  const updateDraftOrder = useUpdateOrder();
  const queryClient = useQueryClient();
  const { session, isConfirmingCheckout } = useCheckoutContext();
  const form = useFormContext<CheckoutFormData>();
  const draftOrderQuery = useDraftOrder();
  const registrationsRef = React.useRef<
    Map<DraftOrderSyncRegistrationId, DraftOrderSyncRegistration>
  >(new Map());
  const dirtyRegistrationIdsRef = React.useRef<Set<string>>(new Set());
  const pendingPatchEntriesRef = React.useRef<PendingDraftOrderPatch[]>([]);
  const pendingPatchRef = React.useRef<DraftOrderPatch | null>(null);
  const pendingFieldNamesRef = React.useRef<Set<string>>(new Set());
  const pendingRegistrationIdsRef = React.useRef<Set<string>>(new Set());
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = React.useRef(false);
  const drainPromiseRef = React.useRef<Promise<boolean> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const getCurrentDraftOrder = React.useCallback(() => {
    if (draftOrderQuery.data) return draftOrderQuery.data;

    if (session?.id) {
      const cached = queryClient.getQueryData<{
        checkoutSession?: { draftOrder?: DraftOrder | null };
      }>(checkoutQueryKeys.draftOrder(session.id));
      if (cached?.checkoutSession?.draftOrder) {
        return cached.checkoutSession.draftOrder;
      }
    }

    return null;
  }, [draftOrderQuery.data, queryClient, session]);

  const refetchLatestDraftOrder = React.useCallback(async () => {
    if (!session?.id) return getCurrentDraftOrder();

    // `throwOnError` keeps a failed in-confirm fetch from silently falling back
    // to a stale cached order that confirmation guards would then trust.
    const result = await draftOrderQuery.refetch({ throwOnError: true });
    return result.data ?? getCurrentDraftOrder();
  }, [draftOrderQuery, getCurrentDraftOrder, session?.id]);

  const syncPendingPatchRefs = React.useCallback(() => {
    pendingPatchRef.current = pendingPatchEntriesRef.current.reduce(
      (merged, entry) => mergeDraftOrderPatch(merged, entry.patch),
      null as DraftOrderPatch | null
    );
    pendingFieldNamesRef.current = new Set(
      pendingPatchEntriesRef.current.flatMap(entry => entry.fieldNames)
    );
    pendingRegistrationIdsRef.current = new Set(
      pendingPatchEntriesRef.current.flatMap(entry => entry.registrationIds)
    );
  }, []);

  const clearPendingPatches = React.useCallback(() => {
    pendingPatchEntriesRef.current = [];
    syncPendingPatchRefs();
  }, [syncPendingPatchRefs]);

  const queuePatch = React.useCallback(
    (
      patch: DraftOrderPatch,
      fieldNames: string[] = [],
      registrationIds: string[] = []
    ) => {
      pendingPatchEntriesRef.current.push({
        patch,
        fieldNames,
        registrationIds,
      });
      syncPendingPatchRefs();
    },
    [syncPendingPatchRefs]
  );

  const removePendingRegistrationPatches = React.useCallback(
    (registrationIds: string[]) => {
      if (!registrationIds.length) return;
      const registrationIdSet = new Set(registrationIds);
      pendingPatchEntriesRef.current = pendingPatchEntriesRef.current.filter(
        entry =>
          !entry.registrationIds.some(registrationId =>
            registrationIdSet.has(registrationId)
          )
      );
      syncPendingPatchRefs();
    },
    [syncPendingPatchRefs]
  );

  const drainQueue = React.useCallback(async () => {
    if (drainPromiseRef.current) return drainPromiseRef.current;

    drainPromiseRef.current = (async () => {
      if (inFlightRef.current) return false;

      let patchSent = false;

      while (pendingPatchRef.current) {
        const entries = pendingPatchEntriesRef.current;
        const patch = pendingPatchRef.current;

        if (!session) {
          clearPendingPatches();
          break;
        }
        const { channelId, storeId, draftOrder, customerId } = session;
        if (!channelId || !storeId || !draftOrder?.id) {
          clearPendingPatches();
          break;
        }

        const fieldSnapshots = new Map<keyof CheckoutFormData, unknown>();
        for (const fieldName of pendingFieldNamesRef.current) {
          fieldSnapshots.set(
            fieldName as keyof CheckoutFormData,
            form.getValues(fieldName as keyof CheckoutFormData)
          );
        }
        const fieldNames = [...pendingFieldNamesRef.current];
        const registrationIds = [...pendingRegistrationIdsRef.current];
        clearPendingPatches();
        inFlightRef.current = true;

        try {
          await updateDraftOrder.mutateAsync({
            input: {
              ...patch,
              context: { channelId, storeId },
              ...(customerId ? { customerId } : {}),
            },
          });
          patchSent = true;

          for (const fieldName of fieldNames) {
            const typedFieldName = fieldName as keyof CheckoutFormData;
            const submittedValue = fieldSnapshots.get(typedFieldName);
            const currentValue = form.getValues(typedFieldName);
            if (!isEqual(currentValue, submittedValue)) continue;
            form.resetField(typedFieldName, {
              defaultValue: currentValue,
            });
          }
        } catch (error) {
          pendingPatchEntriesRef.current = [
            ...entries,
            ...pendingPatchEntriesRef.current,
          ];
          syncPendingPatchRefs();
          for (const registrationId of registrationIds) {
            dirtyRegistrationIdsRef.current.add(registrationId);
          }
          throw error;
        } finally {
          inFlightRef.current = false;
        }
      }

      return patchSent;
    })();

    try {
      return await drainPromiseRef.current;
    } finally {
      drainPromiseRef.current = null;
    }
  }, [
    clearPendingPatches,
    form,
    session,
    syncPendingPatchRefs,
    updateDraftOrder,
  ]);

  /**
   * Field names the form schema currently rejects. RHF's own error state cannot
   * be used here: the form validates `onBlur`, so a debounced background sync
   * runs before `formState.errors` knows about the value being typed, and
   * `formState.isValid` is form-wide (false for any incomplete checkout).
   * Re-running the resolver schema keeps validation in one place, including
   * rules supplied through the `checkoutFormSchema` prop.
   */
  const getInvalidFieldNames = React.useCallback(
    (values: CheckoutFormData) => {
      const invalidFieldNames = new Set<string>();
      if (!schema) return invalidFieldNames;

      const result = schema.safeParse(values);
      if (result.success) return invalidFieldNames;

      for (const issue of result.error.issues) {
        const [fieldName] = issue.path;
        if (typeof fieldName === 'string') invalidFieldNames.add(fieldName);
      }

      return invalidFieldNames;
    },
    [schema]
  );

  const buildPatchFromRegistrations = React.useCallback(
    (ids: string[], draftOrder?: DraftOrder | null) => {
      const values = form.getValues();
      const invalidFieldNames = getInvalidFieldNames(values);
      const context: DraftOrderSyncRegistrationContext = {
        values,
        form,
        draftOrder,
        session,
      };
      let patch: DraftOrderPatch | null = null;
      const fieldNames = new Set<string>();
      const registrationIds = new Set<string>();

      for (const id of ids) {
        const registration = registrationsRef.current.get(id);
        if (!registration) continue;
        // Only the values the customer edited have to be valid. Untouched
        // fields can be invalid simply because the order is still incomplete
        // (for example missing names while the address is being filled in).
        if (
          registration.fieldNames.some(
            fieldName =>
              invalidFieldNames.has(fieldName) &&
              form.getFieldState(fieldName as keyof CheckoutFormData).isDirty
          )
        ) {
          continue;
        }
        if (registration.enabled?.(context) === false) continue;

        const registrationPatch = registration.buildPatch(context);
        if (!hasActualPatchContent(registrationPatch)) continue;

        patch = mergeDraftOrderPatch(
          patch,
          registrationPatch as DraftOrderPatch
        );
        registrationIds.add(id);
        for (const fieldName of registration.fieldNames) {
          fieldNames.add(fieldName);
        }
      }

      return {
        patch,
        fieldNames: [...fieldNames],
        registrationIds: [...registrationIds],
      };
    },
    [form, getInvalidFieldNames, session]
  );

  const flushDraftOrderSync = React.useCallback(
    async (
      options: FlushDraftOrderSyncOptions = {}
    ): Promise<FlushDraftOrderSyncResult> => {
      clearTimer();

      const canBuildRegistrationPatches =
        !isConfirmingCheckout || Boolean(options.allowWhileConfirming);

      // A patch the backend rejected stays queued, so rebuild the dirty
      // registrations from the current form values and merge them over it
      // before draining. Without this the queue keeps retrying the rejected
      // value and a corrected value never replaces it.
      if (canBuildRegistrationPatches && pendingPatchRef.current) {
        const queuedIds = [...dirtyRegistrationIdsRef.current];

        if (queuedIds.length) {
          const rebuilt = buildPatchFromRegistrations(
            queuedIds,
            getCurrentDraftOrder()
          );

          removePendingRegistrationPatches(queuedIds);

          for (const registrationId of queuedIds) {
            dirtyRegistrationIdsRef.current.delete(registrationId);
          }

          if (rebuilt.patch) {
            queuePatch(
              rebuilt.patch,
              rebuilt.fieldNames,
              rebuilt.registrationIds
            );
          }
        }
      }

      let patchSent = await drainQueue();
      let latestBeforePatch = options.includeCurrentValues
        ? await refetchLatestDraftOrder()
        : getCurrentDraftOrder();
      let ids: string[] = [];

      if (canBuildRegistrationPatches) {
        ids = options.includeCurrentValues
          ? [...registrationsRef.current.keys()]
          : [...dirtyRegistrationIdsRef.current];
      }

      if (ids.length) {
        latestBeforePatch ??= await refetchLatestDraftOrder();
        const { patch, fieldNames, registrationIds } =
          buildPatchFromRegistrations(ids, latestBeforePatch);

        if (patch) {
          for (const registrationId of registrationIds) {
            dirtyRegistrationIdsRef.current.delete(registrationId);
          }
          queuePatch(patch, fieldNames, registrationIds);
          patchSent = (await drainQueue()) || patchSent;
        }
      }

      const latestAfterPatch =
        options.refetchLatestOrder && patchSent
          ? await refetchLatestDraftOrder()
          : undefined;

      return {
        latestOrder: latestAfterPatch ?? latestBeforePatch,
        patchSent,
      };
    },
    [
      buildPatchFromRegistrations,
      clearTimer,
      drainQueue,
      getCurrentDraftOrder,
      isConfirmingCheckout,
      queuePatch,
      refetchLatestDraftOrder,
      removePendingRegistrationPatches,
    ]
  );

  const scheduleDebouncedFlush = React.useCallback(() => {
    clearTimer();

    const debounceMs = [...dirtyRegistrationIdsRef.current].reduce(
      (delay, registrationId) => {
        const registration = registrationsRef.current.get(registrationId);
        return Math.max(delay, registration?.debounceMs ?? 750);
      },
      0
    );

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flushDraftOrderSync().catch(() => {
        // The failed patch is restored in drainQueue's catch block. Ignore
        // background sync failures here so payment/explicit flush paths can
        // surface the recoverable error to the customer.
      });
    }, debounceMs || 750);
  }, [clearTimer, flushDraftOrderSync]);

  const enqueueDraftOrderPatch = React.useCallback(
    (patch: DraftOrderPatch, options: EnqueueDraftOrderPatchOptions = {}) => {
      if (isConfirmingCheckout && !options.allowWhileConfirming) return;

      queuePatch(patch, options.fieldNames);
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
    [clearTimer, drainQueue, isConfirmingCheckout, queuePatch]
  );

  const registerDraftOrderSync = React.useCallback(
    (registration: DraftOrderSyncRegistration) => {
      registrationsRef.current.set(registration.id, registration);

      return () => {
        const current = registrationsRef.current.get(registration.id);
        if (current === registration) {
          registrationsRef.current.delete(registration.id);
          dirtyRegistrationIdsRef.current.delete(registration.id);
        }
      };
    },
    []
  );

  const markDraftOrderSyncDirty = React.useCallback(
    (
      registrationId: DraftOrderSyncRegistrationId,
      options: { immediate?: boolean; allowWhileConfirming?: boolean } = {}
    ) => {
      if (isConfirmingCheckout && !options.allowWhileConfirming) return;
      if (!registrationsRef.current.has(registrationId)) return;

      dirtyRegistrationIdsRef.current.add(registrationId);

      if (options.immediate) {
        void flushDraftOrderSync({
          allowWhileConfirming: options.allowWhileConfirming,
        }).catch(() => {
          // Explicit callers can await flushDraftOrderSync directly when they
          // need errors. Dirty marks are background sync triggers.
        });
        return;
      }

      scheduleDebouncedFlush();
    },
    [flushDraftOrderSync, isConfirmingCheckout, scheduleDebouncedFlush]
  );

  React.useEffect(() => {
    if (!isConfirmingCheckout) return;
    clearTimer();
  }, [clearTimer, isConfirmingCheckout]);

  React.useEffect(() => clearTimer, [clearTimer]);

  const value = React.useMemo(
    () => ({
      enqueueDraftOrderPatch,
      flushDraftOrderSync,
      markDraftOrderSyncDirty,
      registerDraftOrderSync,
    }),
    [
      enqueueDraftOrderPatch,
      flushDraftOrderSync,
      markDraftOrderSyncDirty,
      registerDraftOrderSync,
    ]
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
