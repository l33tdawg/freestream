import React from 'react';
import { DestinationHealth } from '../../shared/types';
import Tooltip from './Tooltip';

interface Props {
  health: DestinationHealth;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const config: Record<DestinationHealth, { color: string; glow: string; label: string; tooltip: string; pulse: boolean }> = {
  idle: { color: '', glow: '', label: 'Idle', tooltip: 'Not streaming', pulse: false },
  connecting: { color: 'bg-yellow-400', glow: 'shadow-[0_0_6px_rgba(250,204,21,0.4)]', label: 'Connecting', tooltip: 'Connecting to server', pulse: true },
  live: { color: 'bg-success', glow: 'shadow-[0_0_6px_rgba(52,211,153,0.4)]', label: 'Live', tooltip: 'Stream is live', pulse: false },
  error: { color: 'bg-red-400', glow: 'shadow-[0_0_6px_rgba(248,113,113,0.4)]', label: 'Error', tooltip: 'Stream error occurred', pulse: false },
  retrying: { color: 'bg-orange-400', glow: 'shadow-[0_0_6px_rgba(251,146,60,0.4)]', label: 'Retrying', tooltip: 'Attempting to reconnect', pulse: true },
};

const sizes = {
  sm: 'w-[6px] h-[6px]',
  md: 'w-2 h-2',
};

export default function HealthIndicator({ health, size = 'md', showLabel = true }: Props) {
  const { color, glow, label, tooltip, pulse } = config[health];

  return (
    <Tooltip content={tooltip} position="top">
      <div className="flex items-center gap-1.5">
        <div
          className={`${sizes[size]} rounded-full ${color} ${glow} ${pulse ? 'animate-pulse' : ''}`}
          style={health === 'idle' ? { background: 'var(--color-text-muted)' } : undefined}
        />
        {showLabel && (
          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
        )}
      </div>
    </Tooltip>
  );
}
