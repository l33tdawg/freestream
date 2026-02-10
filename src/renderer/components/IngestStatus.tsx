import React from 'react';
import { IngestStatus as IngestStatusType } from '../../shared/types';
import StreamPreview from './StreamPreview';
import Tooltip from './Tooltip';

interface Props {
  status: IngestStatusType;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatBitrate(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${kbps} kbps`;
}

export default function IngestStatus({ status }: Props) {
  const hasStats = status.bitrate || status.fps || status.resolution || status.codec;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Ingest Server</h3>
        <Tooltip content={status.connected ? 'RTMP ingest is receiving data' : 'Start streaming from OBS to connect'} position="left">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  status.connected ? 'bg-success' : ''
                }`}
                style={!status.connected ? { background: 'var(--color-text-muted)' } : undefined}
              />
              {status.connected && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-success animate-ping opacity-40" />
              )}
            </div>
            <span className={`text-xs font-medium ${status.connected ? 'text-success' : ''}`} style={!status.connected ? { color: 'var(--color-text-muted)' } : undefined}>
              {status.connected ? 'OBS Connected' : 'Waiting for OBS'}
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Connected state: preview + stats */}
      {status.connected && (
        <>
          {/* Stream preview */}
          {status.previewUrl && (
            <StreamPreview previewUrl={status.previewUrl} />
          )}

          {/* Stats bar */}
          {hasStats && (
            <div
              className="flex items-center gap-3 mt-3 px-3 py-2 rounded-xl flex-wrap"
              style={{
                background: 'var(--color-ingest-box-bg)',
                border: '1px solid var(--color-ingest-box-border)',
              }}
            >
              {status.resolution && (
                <Tooltip content="Video resolution" position="top">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21z" />
                    </svg>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>{status.resolution}</span>
                  </div>
                </Tooltip>
              )}

              {status.codec && (
                <Tooltip content="Video codec" position="top">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(233, 69, 96, 0.1)', color: '#e94560' }}
                  >
                    {status.codec}
                  </span>
                </Tooltip>
              )}

              {status.audioCodec && (
                <Tooltip content={`Audio: ${status.audioCodec}${status.sampleRate ? ` ${status.sampleRate / 1000}kHz` : ''}${status.audioChannels ? ` ${status.audioChannels}ch` : ''}`} position="top">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}
                  >
                    {status.audioCodec}
                  </span>
                </Tooltip>
              )}

              {status.fps !== undefined && status.fps > 0 && (
                <Tooltip content="Frames per second" position="top">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>{status.fps}</span>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>fps</span>
                  </div>
                </Tooltip>
              )}

              {status.bitrate !== undefined && status.bitrate > 0 && (
                <Tooltip content="Stream bitrate" position="top">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatBitrate(status.bitrate)}</span>
                  </div>
                </Tooltip>
              )}

              {status.uptime !== undefined && status.uptime > 0 && (
                <Tooltip content="Connection uptime" position="top">
                  <div className="flex items-center gap-1 ml-auto">
                    <svg className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatUptime(status.uptime)}</span>
                  </div>
                </Tooltip>
              )}
            </div>
          )}

          {/* Connected from IP */}
          {status.clientIp && (
            <div className="mt-2">
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Connected from {status.clientIp}
              </p>
            </div>
          )}
        </>
      )}

      {/* Disconnected state: minimal waiting message */}
      {!status.connected && (
        <div className="py-4 text-center">
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Waiting for OBS connection...
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
            See Settings for setup info
          </p>
        </div>
      )}
    </div>
  );
}
