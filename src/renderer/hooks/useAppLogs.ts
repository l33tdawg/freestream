import { useState, useEffect, useCallback } from 'react';
import { LogEntry } from '../../shared/types';

const MAX_LOGS = 500;

export function useAppLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const unsubscribe = window.freestream.onLogMessage((entry: LogEntry) => {
      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
      });
    });
    return unsubscribe;
  }, []);

  const clear = useCallback(() => setLogs([]), []);

  return { logs, clear };
}
