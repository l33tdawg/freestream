import React from 'react';
import { Destination, DestinationStatus, PlatformPreset } from '../../shared/types';
import HealthIndicator from './HealthIndicator';
import PlatformIcon from './PlatformIcon';
import Tooltip from './Tooltip';
import { useTheme } from '../hooks/useTheme';

interface Props {
  destination: Destination;
  preset?: PlatformPreset;
  status?: DestinationStatus;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function formatBitrate(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${Math.round(kbps)} kbps`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function DestinationCard({ destination, preset, status, onToggle, onEdit, onRemove }: Props) {
  const { isDark } = useTheme();
  const health = status?.health || 'idle';
  const platformColor = preset?.color || '#6B7280';
  const isLive = health === 'live';

  return (
    <div
      className={`glass-hover rounded-2xl p-4 flex items-center gap-4 animate-slide-up transition-all duration-300 ${
        !destination.enabled ? 'opacity-40' : ''
      }`}
      style={isLive ? {
        borderColor: `${platformColor}33`,
        boxShadow: `0 2px 16px ${platformColor}18, inset 0 1px 0 var(--color-highlight-inset)`,
      } : undefined}
    >
      {/* Platform icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          isLive ? 'scale-105' : ''
        }`}
        style={{
          background: `${platformColor}18`,
          boxShadow: isLive
            ? `0 0 12px ${platformColor}30, inset 0 1px 0 ${platformColor}20`
            : `inset 0 1px 0 ${platformColor}20`,
        }}
      >
        <PlatformIcon platform={destination.platform} size={20} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-[14px] font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>{destination.name}</h4>
          <HealthIndicator health={health} size="sm" showLabel={health !== 'idle'} />
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          {status?.bitrate != null && status.bitrate > 0 ? (
            <>
              <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{formatBitrate(status.bitrate)}</span>
              {status?.fps != null && status.fps > 0 && (
                <>
                  <span style={{ color: 'var(--color-text-faint)' }}>|</span>
                  <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{status.fps} fps</span>
                </>
              )}
              {status?.uptime != null && status.uptime > 0 && (
                <>
                  <span style={{ color: 'var(--color-text-faint)' }}>|</span>
                  <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{formatUptime(status.uptime)}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>{destination.url || 'No URL configured'}</span>
          )}
        </div>
        {status?.error && (
          <p className="text-[11px] text-red-400/80 mt-1 truncate">{status.error}</p>
        )}
        {status?.retryCount != null && status.retryCount > 0 && (
          <p className="text-[11px] text-orange-400/70 mt-0.5">Retry {status.retryCount}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Toggle */}
        <Tooltip content={destination.enabled ? 'Disable destination' : 'Enable destination'} position="top">
          <button
            onClick={onToggle}
            className="toggle-track"
            style={{ background: destination.enabled ? '#e94560' : 'var(--color-toggle-off)' }}
          >
            <div
              className="toggle-thumb"
              style={{ left: destination.enabled ? '22px' : '3px' }}
            />
          </button>
        </Tooltip>

        {/* Edit */}
        <Tooltip content="Edit destination" position="top">
          <button
            onClick={onEdit}
            className="p-2 rounded-xl transition-all duration-150"
            style={{ background: 'transparent', color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
          </button>
        </Tooltip>

        {/* Remove */}
        <Tooltip content="Remove destination" position="top">
          <button
            onClick={onRemove}
            className="p-2 rounded-xl transition-all duration-150 hover:text-red-400"
            style={{ color: 'var(--color-text-muted)', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
