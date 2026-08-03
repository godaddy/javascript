import * as React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  type DraftOrderSyncRegistration,
  useDraftOrderSyncQueue,
} from '@/components/checkout/order/draft-order-sync-provider';

/**
 * Registers how a form section maps its current values to a draft-order patch.
 * The provider owns when that patch is built and sent, which lets the final
 * pre-confirmation sync rebuild every registered patch from the latest form
 * values instead of relying on debounced background effects.
 */
export function useRegisterDraftOrderFieldSync(
  registration: DraftOrderSyncRegistration
) {
  const { registerDraftOrderSync } = useDraftOrderSyncQueue();

  React.useEffect(
    () => registerDraftOrderSync(registration),
    [registerDraftOrderSync, registration]
  );
}

/** Flags a registration for debounced background sync when its fields change. */
export function useDraftOrderFieldDirtyMarker({
  id,
  fieldNames,
  disabled,
}: {
  id: string;
  fieldNames: string[];
  disabled?: boolean;
}) {
  const { control } = useFormContext();
  const { markDraftOrderSyncDirty } = useDraftOrderSyncQueue();
  const values = useWatch({ control, name: fieldNames });
  const snapshot = JSON.stringify(values ?? null);
  const previousSnapshotRef = React.useRef(snapshot);

  React.useLayoutEffect(() => {
    if (previousSnapshotRef.current === snapshot) return;
    previousSnapshotRef.current = snapshot;

    if (!disabled) {
      markDraftOrderSyncDirty(id);
    }
  }, [disabled, id, markDraftOrderSyncDirty, snapshot]);
}
