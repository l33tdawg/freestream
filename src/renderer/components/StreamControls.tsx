import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { useTheme } from '../hooks/useTheme';

interface Props {
  isLive: boolean;
  ingestConnected: boolean;
  hasEnabledDestinations: boolean;
  onGoLive: () => Promise<void>;
  onStopAll: () => Promise<void>;
}

export default function StreamControls({ isLive, ingestConnected, hasEnabledDestinations, onGoLive, onStopAll }: Props) {
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();

  const handleGoLive = async () => {
    setLoading(true);
    try { await onGoLive(); } finally { setLoading(false); }
  };

  const handleStop = async () => {
    setLoading(true);
    try { await onStopAll(); } finally { setLoading(false); }
  };

  if (isLive) {
    return (
      <div className="flex justify-center">
        <Tooltip content="Stop streaming to all destinations" position="bottom">
          <button
            onClick={handleStop}
            disabled={loading}
            className="stream-btn px-5 py-2 text-white font-medium rounded-lg text-[13px] disabled:opacity-50 flex items-center gap-2 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
          >
            <div
              className="absolute inset-0 animate-pulse-slow opacity-20"
              style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)' }}
            />
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 relative" fill="currentColor" viewBox="0 0 20 20">
                <rect x="4" y="4" width="12" height="12" rx="2" />
              </svg>
            )}
            <span className="relative">Stop All Streams</span>
          </button>
        </Tooltip>
      </div>
    );
  }

  const disabled = loading || !ingestConnected || !hasEnabledDestinations;
  let hint = '';
  if (!ingestConnected) hint = 'Connect OBS to start restreaming';
  else if (!hasEnabledDestinations) hint = 'Enable at least one destination';

  return (
    <div className="flex flex-col items-center gap-2">
      <Tooltip content={disabled ? '' : 'Start restreaming to all enabled destinations'} position="bottom">
        <button
          onClick={handleGoLive}
          disabled={disabled}
          className="stream-btn px-5 py-2 font-medium rounded-lg text-[13px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 relative overflow-hidden group"
          style={{
            background: disabled
              ? 'var(--color-disabled-bg)'
              : 'linear-gradient(135deg, #e94560 0%, #c7304a 100%)',
            boxShadow: disabled
              ? 'none'
              : '0 2px 8px rgba(233, 69, 96, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            color: disabled ? 'var(--color-disabled-text)' : 'white',
          }}
        >
          {!disabled && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }}
            />
          )}
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5 relative" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
            </svg>
          )}
          <span className="relative">Start Restreaming</span>
        </button>
      </Tooltip>
      {hint && (
        <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {hint}
        </p>
      )}
    </div>
  );
}
