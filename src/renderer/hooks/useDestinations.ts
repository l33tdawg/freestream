import { useState, useEffect, useCallback } from 'react';
import { Destination, PlatformId } from '../../shared/types';

export function useDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const dests = await window.freestream.getDestinations();
      setDestinations(dests);
    } catch (err) {
      console.error('Failed to load destinations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (platform: PlatformId, name: string, url: string, streamKey: string) => {
      const dest = await window.freestream.addDestination(platform, name, url, streamKey);
      await refresh();
      return dest;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, updates: Partial<Destination>, streamKey?: string) => {
      await window.freestream.updateDestination(id, updates, streamKey);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await window.freestream.removeDestination(id);
      await refresh();
    },
    [refresh]
  );

  const toggle = useCallback(
    async (id: string) => {
      await window.freestream.toggleDestination(id);
      await refresh();
    },
    [refresh]
  );

  return { destinations, loading, add, update, remove, toggle, refresh };
}
