import React, { useState, useEffect } from 'react';
import { IngestStatus as IngestStatusType } from '../../shared/types';
import Tooltip from './Tooltip';
import { useTheme } from '../hooks/useTheme';

interface Props {
  status: IngestStatusType;
}

export default function IngestStatus({ status }: Props) {
  const [ingestUrl, setIngestUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    window.freestream.getIngestUrl().then(setIngestUrl);
  }, []);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(ingestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      <Tooltip content={copied ? 'Copied to clipboard!' : 'Copy ingest URL to clipboard'} position="bottom">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 group cursor-pointer transition-all duration-200"
          style={{
            background: 'var(--color-ingest-box-bg)',
            border: '1px solid var(--color-ingest-box-border)',
          }}
          onClick={copyUrl}
        >
          <code className="text-[13px] flex-1 truncate font-mono" style={{ color: 'var(--color-text-muted)' }}>{ingestUrl}</code>
          <span
            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all duration-200 ${
              copied
                ? 'bg-success/20 text-success'
                : ''
            }`}
            style={!copied ? { color: 'var(--color-text-muted)' } : undefined}
            style={!copied ? { background: 'var(--color-copy-btn-bg)' } : {}}
          >
            {copied ? 'Copied' : 'Copy'}
          </span>
        </div>
      </Tooltip>

      {status.connected && status.clientIp && (
        <p className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Connected from {status.clientIp}
        </p>
      )}

      {!status.connected && (
        <p className="mt-2.5 text-[11px] text-gray-600 leading-relaxed">
          Set OBS to stream to this URL with stream key <code className="text-gray-400 font-mono px-1 py-0.5 rounded" style={{ background: 'var(--color-code-bg)' }}>stream</code>
        </p>
      )}
    </div>
  );
}
