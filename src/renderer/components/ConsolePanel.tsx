import React, { useRef, useEffect, useState } from 'react';
import { LogEntry } from '../../shared/types';

interface Props {
  open: boolean;
  logs: LogEntry[];
  onClear: () => void;
  onClose: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  ffmpeg: '#60a5fa',  // blue-400
  nms: '#a78bfa',     // violet-400
  app: '#34d399',     // emerald-400
};

const LEVEL_COLORS: Record<string, string> = {
  error: '#f87171',   // red-400
  warn: '#fbbf24',    // amber-400
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

export default function ConsolePanel({ open, logs, onClear, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
  };

  return (
    <div
      className="flex-shrink-0 overflow-hidden transition-all duration-200"
      style={{
        height: open ? 200 : 0,
        borderTop: open ? '1px solid var(--color-border)' : 'none',
        background: 'var(--color-surface)',
      }}
    >
      {/* Header */}
      <div
        className="h-8 flex items-center justify-between px-3 select-none flex-shrink-0"
        style={{
          background: 'var(--color-surface-raised)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3M5.25 20.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Console</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md tabular-nums"
            style={{
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface)',
            }}
          >
            {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Clear button */}
          <button
            onClick={onClear}
            className="p-1 rounded transition-colors duration-150"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'var(--color-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            title="Clear logs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors duration-150"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'var(--color-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            title="Close console"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-auto overflow-x-hidden"
        style={{ height: 'calc(100% - 32px)' }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>No log messages yet</span>
          </div>
        ) : (
          <div className="px-3 py-1">
            {logs.map((entry) => (
              <div key={entry.id} className="font-mono text-[11px] leading-[18px] whitespace-pre-wrap break-all">
                <span style={{ color: 'var(--color-text-faint)' }}>
                  [{formatTime(entry.timestamp)}]
                </span>{' '}
                <span style={{ color: SOURCE_COLORS[entry.source] || 'var(--color-text-muted)' }}>
                  [{entry.source.toUpperCase()}]
                </span>{' '}
                <span style={{ color: LEVEL_COLORS[entry.level] || 'var(--color-text-secondary)' }}>
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
