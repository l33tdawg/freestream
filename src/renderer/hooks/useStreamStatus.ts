import { useState, useEffect, useCallback } from 'react';
import { IngestStatus, DestinationStatus } from '../../shared/types';

interface StreamState {
  ingest: IngestStatus;
  destinationStatuses: Map<string, DestinationStatus>;
  isLive: boolean;
}

export function useStreamStatus() {
  const [state, setState] = useState<StreamState>({
    ingest: { connected: false },
    destinationStatuses: new Map(),
    isLive: false,
  });

  // Poll for initial status
  const refresh = useCallback(async () => {
    try {
      const status = await window.freestream.getStreamStatus();
      setState((prev) => {
        const map = new Map(prev.destinationStatuses);
        for (const ds of status.destinations) {
          map.set(ds.id, ds);
        }
        return {
          ingest: status.ingest,
          destinationStatuses: map,
          isLive: status.isLive,
        };
      });
    } catch (err) {
      console.error('Failed to get stream status:', err);
    }
  }, []);

  useEffect(() => {
    refresh();

    const unsubIngest = window.freestream.onIngestStatusChanged((status: IngestStatus) => {
      setState((prev) => ({ ...prev, ingest: status }));
    });

    const unsubDest = window.freestream.onDestinationStatusChanged((status: DestinationStatus) => {
      setState((prev) => {
        const map = new Map(prev.destinationStatuses);
        map.set(status.id, status);
        return { ...prev, destinationStatuses: map };
      });
    });

    return () => {
      unsubIngest();
      unsubDest();
    };
  }, [refresh]);

  return {
    ingest: state.ingest,
    destinationStatuses: state.destinationStatuses,
    isLive: state.isLive,
    refresh,
  };
}
