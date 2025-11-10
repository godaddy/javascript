'use client';

import React, { useEffect } from 'react';
import type { TrackingProperties } from '@/tracking/event-properties';
import { Track, useTracking } from '@/tracking/track';
import type { CheckoutSession } from '@/types';

declare global {
  interface Window {
    _expDataLayer: unknown[];
  }
}

export function TrackingProvider({
  children,
  session,
  trackingEnabled = false,
  trackingProperties,
}: {
  children: React.ReactNode;
  session?: CheckoutSession | null;
  trackingEnabled?: boolean;
  trackingProperties?: TrackingProperties;
}) {
  return (
    <Track>
      <TrackingInitializer
        session={session}
        trackingEnabled={trackingEnabled}
        trackingProperties={trackingProperties}
      />
      {children}
    </Track>
  );
}

// Helper component to initialize tracking using the hook
function TrackingInitializer({
  session,
  trackingEnabled,
  trackingProperties = {},
}: {
  session?: CheckoutSession | null;
  trackingEnabled: boolean;
  trackingProperties?: TrackingProperties;
}) {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const tracking = useTracking();

  useEffect(() => {
    if (
      session?.id &&
      trackingEnabled &&
      !tracking.isTrackingEnabled &&
      !isInitialized
    ) {
      setIsInitialized(true);
      // Enable tracking
      tracking.setIsTrackingEnabled({ isTrackingEnabled: trackingEnabled });

      // Set common properties
      tracking.setCommonProperties({
        commonProperties: {
          draftOrderId: session?.draftOrder?.id || '',
          storeId: session?.storeId || '',
          channelId: session?.channelId || '',
          customerId: session?.customerId || '',
          ...trackingProperties,
        },
      });

      // Add event handlers
      tracking.addEventHandler({
        handlerId: 'traffic',
        handler: ({ event }) => {
          window._expDataLayer = window._expDataLayer || [];
          window._expDataLayer?.push?.({
            schema: 'add_event',
            version: 'v1',
            data: {
              type: event?.type,
              eid: event?.eventId,
              custom_properties: {
                eventId: event?.eventId,
                traceId: event?.traceId,
                ...event?.properties,
              },
            },
            targets: ['fullstory'],
          });
        },
      });
    }
  }, [tracking, session, trackingEnabled, isInitialized, trackingProperties]);

  return null;
}
