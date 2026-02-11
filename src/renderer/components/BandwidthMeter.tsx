import React from 'react';
import { DestinationStatus } from '../../shared/types';
import Tooltip from './Tooltip';

interface Props {
  destinationStatuses: Map<string, DestinationStatus>;
}

const MAX_MBPS = 50;
const SEGMENT_COUNT = 20;

function formatBitrate(kbps: number): string {
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(1)} Mbps`;
  }
  return `${Math.round(kbps)} kbps`;
}

function segmentColor(index: number, total: number): string {
  const ratio = index / total;
  if (ratio < 0.5) return '#22c55e'; // green
  if (ratio < 0.75) return '#eab308'; // yellow
  return '#ef4444'; // red
}

export default function BandwidthMeter({ destinationStatuses }: Props) {
  const liveStatuses = Array.from(destinationStatuses.values()).filter(
    (s) => s.health === 'live' && s.bitrate && s.bitrate > 0
  );

  if (liveStatuses.length === 0) return null;

  const totalKbps = liveStatuses.reduce((sum, s) => sum + (s.bitrate || 0), 0);
  const totalMbps = totalKbps / 1000;
  const fillRatio = Math.min(totalMbps / MAX_MBPS, 1);
  const filledSegments = Math.round(fillRatio * SEGMENT_COUNT);

  return (
    <div className="glass rounded-xl px-4 py-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Total Bandwidth
        </span>
        <Tooltip content={`${liveStatuses.length} live stream${liveStatuses.length !== 1 ? 's' : ''}`} position="left">
          <span className="text-[12px] font-mono tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
            {formatBitrate(totalKbps)}
            <span className="ml-1.5 text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
              ({liveStatuses.length} stream{liveStatuses.length !== 1 ? 's' : ''})
            </span>
          </span>
        </Tooltip>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <div
            key={i}
            className="h-[6px] flex-1 rounded-sm transition-all duration-300"
            style={{
              background: i < filledSegments
                ? segmentColor(i, SEGMENT_COUNT)
                : 'var(--color-meter-segment-off, rgba(255,255,255,0.06))',
            }}
          />
        ))}
      </div>
    </div>
  );
}
