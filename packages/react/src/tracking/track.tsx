import type React from 'react';
import { createContext, useCallback, useContext, useReducer } from 'react';
import { ulid } from 'ulid';
import type { EventProperties } from '@/tracking/event-properties';
import type { eventIds } from '@/tracking/events';
import type { $Values } from '@/types';

export type TrackingEventId =
  | $Values<typeof eventIds>
  | `godaddy.checkout.${$Values<typeof eventIds>}`;

export enum TrackingEventType {
  IMPRESSION = 'impression',
  CLICK = 'click',
  EVENT = 'event',
}

export type TrackingEvent = {
  eventId: TrackingEventId;
  type: TrackingEventType;
  traceId?: string;
  properties?: EventProperties;
  date?: string;
};

type TrackingEventHandler = ({ event }: { event?: TrackingEvent }) => void;

// Global state
const trackingState = {
  traceId: '',
  commonProperties: {} as EventProperties,
  lastEvent: null as TrackingEvent | null,
  eventHandlers: {} as Record<string, TrackingEventHandler>,
  isTrackingEnabled: false,
  eventLog: [] as TrackingEvent[],
  maxEventLogLength: 50,
  subscribers: [] as ((event: TrackingEvent | null) => void)[],
};

// Get trace ID function
export function getTraceId() {
  if (typeof window === 'undefined') {
    return;
  }

  if (trackingState.traceId) {
    return trackingState.traceId;
  }

  const traceId =
    document
      .querySelector("meta[name='gd:traceId']")
      ?.getAttribute?.('content') || ulid();

  trackingState.traceId = traceId;
  return traceId;
}

// Main tracking function
export async function track({
  eventId,
  type = TrackingEventType.EVENT,
  properties,
}: {
  eventId: TrackingEventId;
  type?: TrackingEventType;
  properties?: EventProperties;
}) {
  const traceId = getTraceId();

  const event = {
    eventId: (eventId?.includes('godaddy.checkout')
      ? eventId
      : `godaddy.checkout.${eventId}`) as TrackingEventId,
    traceId,
    type,
    properties: {
      ...trackingState.commonProperties,
      ...properties,
    },
    date: new Date().toISOString(),
  };

  if (trackingState.isTrackingEnabled) {
    // Add to event log
    trackingState.eventLog = [
      ...trackingState.eventLog.slice(0, trackingState.maxEventLogLength - 1),
      event,
    ];

    // Process through handlers
    for (const handler of Object.values(trackingState.eventHandlers)) {
      try {
        handler?.({ event });
      } catch (_error) {
        // Ignore handler errors
      }
    }
  }

  // Update last event and notify subscribers
  trackingState.lastEvent = event;
  for (const callback of trackingState.subscribers) {
    try {
      callback(event);
    } catch (_error) {
      // Ignore subscriber errors
    }
  }
}

// React context
type TrackingContextType = {
  traceId: string;
  commonProperties: EventProperties;
  lastEvent: TrackingEvent | null;
  isTrackingEnabled: boolean;
  eventLog: TrackingEvent[];
  track: (props: {
    eventId: TrackingEventId;
    type?: TrackingEventType;
    properties?: EventProperties;
  }) => Promise<void>;
  setCommonProperties: (props: { commonProperties: EventProperties }) => void;
  setTraceId: (props: { traceId: string }) => void;
  setIsTrackingEnabled: (props: { isTrackingEnabled: boolean }) => void;
  addEventHandler: (props: {
    handlerId: string;
    handler: TrackingEventHandler;
  }) => void;
  subscribe: (callback: (event: TrackingEvent | null) => void) => () => void;
};

const TrackingContext = createContext<TrackingContextType | null>(null);

// Provider component
export const Track: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use reducer to force re-renders when global state changes
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Helper to update state and trigger re-render
  const updateState = useCallback(() => {
    forceUpdate();
  }, []);

  const setTraceId = useCallback(
    ({ traceId }: { traceId: string }) => {
      trackingState.traceId = traceId;
      updateState();
    },
    [updateState]
  );

  const setCommonProperties = useCallback(
    ({ commonProperties }: { commonProperties: EventProperties }) => {
      trackingState.commonProperties = commonProperties;
      updateState();
    },
    [updateState]
  );

  const setIsTrackingEnabled = useCallback(
    ({ isTrackingEnabled }: { isTrackingEnabled: boolean }) => {
      trackingState.isTrackingEnabled = isTrackingEnabled;
      updateState();
    },
    [updateState]
  );

  const addEventHandler = useCallback(
    ({
      handlerId,
      handler,
    }: {
      handlerId: string;
      handler: TrackingEventHandler;
    }) => {
      trackingState.eventHandlers[handlerId] = handler;
      updateState();
    },
    [updateState]
  );

  const subscribe = useCallback(
    (callback: (event: TrackingEvent | null) => void) => {
      trackingState.subscribers.push(callback);
      return () => {
        trackingState.subscribers = trackingState.subscribers.filter(
          cb => cb !== callback
        );
      };
    },
    []
  );

  const trackEvent = useCallback(
    async ({
      eventId,
      type,
      properties,
    }: {
      eventId: TrackingEventId;
      type?: TrackingEventType;
      properties?: EventProperties;
    }) => {
      await track({ eventId, type, properties });
      updateState();
    },
    [updateState]
  );

  const contextValue: TrackingContextType = {
    traceId: trackingState.traceId,
    commonProperties: trackingState.commonProperties,
    lastEvent: trackingState.lastEvent,
    isTrackingEnabled: trackingState.isTrackingEnabled,
    eventLog: trackingState.eventLog,
    track: trackEvent,
    setTraceId,
    setCommonProperties,
    setIsTrackingEnabled,
    addEventHandler,
    subscribe,
  };

  return (
    <TrackingContext.Provider value={contextValue}>
      {children}
    </TrackingContext.Provider>
  );
};

// Hook to use tracking functionality
export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};
