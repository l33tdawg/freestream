import React, { useState, useEffect } from 'react';
import { AppSettings, Destination } from '../../shared/types';

type Tab = 'ingest' | 'streaming' | 'general' | 'about';

const tabs: { id: Tab; label: string }[] = [
  { id: 'ingest', label: 'Ingest' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'general', label: 'General' },
  { id: 'about', label: 'About' },
];

const techStack = ['Electron', 'React', 'FFmpeg', 'Node.js', 'TypeScript'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [ffmpegStatus, setFfmpegStatus] = useState<string>('Detecting...');
  const [saved, setSaved] = useState(false);
  const [ingestUrl, setIngestUrl] = useState('');
  const [networkUrl, setNetworkUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [copiedField, setCopiedField] = useState<'url' | 'key' | 'network' | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [encodingPresets, setEncodingPresets] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      window.freestream.getSettings().then(setSettings);
      window.freestream.detectFfmpeg().then((path: string) => {
        setFfmpegStatus(path ? `Found: ${path}` : 'Not found — install FFmpeg to enable fan-out');
      }).catch(() => setFfmpegStatus('Detection failed'));
      window.freestream.getIngestUrl().then(setIngestUrl);
      window.freestream.getNetworkIngestUrl().then(setNetworkUrl);
      window.freestream.getIngestStreamKey().then(setStreamKey);
      window.freestream.getDestinations().then(setDestinations).catch(() => {});
      window.freestream.getEncodingPresets().then(setEncodingPresets).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (open) setActiveTab('ingest');
  }, [open]);

  if (!open || !settings) return null;

  const handleSave = async () => {
    await window.freestream.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: keyof AppSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const copyField = async (value: string, field: 'url' | 'key' | 'network') => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className="toggle-track"
      style={{ background: checked ? '#e94560' : 'var(--color-toggle-off)' }}
    >
      <div className="toggle-thumb" style={{ left: checked ? '22px' : '3px' }} />
    </button>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-lg flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <h2 className="text-[17px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
          <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Configure your FreEstream preferences</p>

          {/* Tab bar */}
          <div className="flex gap-0 mt-4" style={{ borderBottom: '1px solid var(--color-divider)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 text-[12px] font-medium transition-colors duration-200 relative"
                style={{
                  color: activeTab === tab.id ? '#e94560' : 'var(--color-text-muted)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#e94560' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          {/* Ingest Tab */}
          {activeTab === 'ingest' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>Ingest Server</label>
              {/* Server URL */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Server URL
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200"
                  style={{ background: 'var(--color-ingest-box-bg)', border: '1px solid var(--color-ingest-box-border)' }}
                  onClick={() => copyField(ingestUrl, 'url')}
                >
                  <code className="text-[13px] flex-1 truncate font-mono" style={{ color: 'var(--color-text-muted)' }}>{ingestUrl}</code>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all duration-200 ${copiedField === 'url' ? 'bg-success/20 text-success' : ''}`}
                    style={copiedField !== 'url' ? { color: 'var(--color-text-muted)', background: 'var(--color-copy-btn-bg)' } : {}}
                  >
                    {copiedField === 'url' ? 'Copied' : 'Copy'}
                  </span>
                </div>
              </div>

              {/* Stream Key */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Stream Key
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200"
                  style={{ background: 'var(--color-ingest-box-bg)', border: '1px solid var(--color-ingest-box-border)' }}
                  onClick={() => copyField(streamKey, 'key')}
                >
                  <code className="text-[13px] flex-1 truncate font-mono" style={{ color: 'var(--color-text-muted)' }}>{streamKey}</code>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all duration-200 ${copiedField === 'key' ? 'bg-success/20 text-success' : ''}`}
                    style={copiedField !== 'key' ? { color: 'var(--color-text-muted)', background: 'var(--color-copy-btn-bg)' } : {}}
                  >
                    {copiedField === 'key' ? 'Copied' : 'Copy'}
                  </span>
                </div>
              </div>

              {/* Network URL */}
              {networkUrl && networkUrl !== ingestUrl && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Network URL <span className="normal-case font-normal">(for remote OBS)</span>
                  </label>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200"
                    style={{ background: 'var(--color-ingest-box-bg)', border: '1px solid var(--color-ingest-box-border)' }}
                    onClick={() => copyField(networkUrl, 'network')}
                  >
                    <code className="text-[13px] flex-1 truncate font-mono" style={{ color: 'var(--color-text-muted)' }}>{networkUrl}</code>
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all duration-200 ${copiedField === 'network' ? 'bg-success/20 text-success' : ''}`}
                      style={copiedField !== 'network' ? { color: 'var(--color-text-muted)', background: 'var(--color-copy-btn-bg)' } : {}}
                    >
                      {copiedField === 'network' ? 'Copied' : 'Copy'}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                In OBS, set the <strong>Server</strong> to the URL above and <strong>Stream Key</strong> to <code className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--color-code-bg)', color: 'var(--color-text-secondary)' }}>{streamKey}</code>
              </p>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--color-divider)' }} className="pt-3" />

              {/* RTMP Port */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>RTMP Ingest Port</label>
                <input
                  type="number"
                  value={settings.rtmpPort}
                  onChange={(e) => update('rtmpPort', parseInt(e.target.value, 10) || 1935)}
                  className="input-field w-36 text-[13px] tabular-nums"
                  min={1024}
                  max={65535}
                />
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>Restart required after changing</p>
              </div>
            </div>
          )}

          {/* Streaming Tab */}
          {activeTab === 'streaming' && (
            <div className="space-y-5">
              {/* Recommended Source Settings */}
              {(() => {
                const enabled = destinations.filter((d) => d.enabled);
                if (enabled.length === 0) return null;

                const withPresets = enabled.filter((d) => encodingPresets[d.platform]);
                if (withPresets.length === 0) return null;

                // Find highest common denominator for all enabled destinations
                let maxBitrate = 0;
                let maxRes = '720p';
                let maxFps = 30;
                const resRank: Record<string, number> = { '480p': 0, '720p': 1, '1080p': 2 };

                for (const d of withPresets) {
                  const p = encodingPresets[d.platform];
                  if (p.bitrate > maxBitrate) maxBitrate = p.bitrate;
                  if ((resRank[p.resolution] || 0) > (resRank[maxRes] || 0)) maxRes = p.resolution;
                  if (p.fps > maxFps) maxFps = p.fps;
                }

                // Count how many destinations are compatible with these settings
                const compatible = withPresets.filter((d) => {
                  const p = encodingPresets[d.platform];
                  return p.bitrate >= maxBitrate && (resRank[p.resolution] || 0) >= (resRank[maxRes] || 0) && p.fps >= maxFps;
                });

                const needsReencode = withPresets.filter((d) => {
                  const p = encodingPresets[d.platform];
                  return p.bitrate < maxBitrate || (resRank[p.resolution] || 0) < (resRank[maxRes] || 0) || p.fps < maxFps;
                });

                return (
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#60a5fa' }}>
                      Recommended Source Settings
                    </p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {maxRes} at {maxFps} fps, {maxBitrate.toLocaleString()} kbps
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      Compatible with {compatible.length} of {withPresets.length} destination{withPresets.length !== 1 ? 's' : ''} via passthrough.
                      {needsReencode.length > 0 && (
                        <> {needsReencode.map((d) => d.name).join(', ')} will need re-encoding.</>
                      )}
                    </p>
                  </div>
                );
              })()}

              {/* FFmpeg */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>FFmpeg Path</label>
                <input
                  type="text"
                  value={settings.ffmpegPath}
                  onChange={(e) => update('ffmpegPath', e.target.value)}
                  className="input-field font-mono text-[13px]"
                  placeholder="Auto-detect (leave empty)"
                />
                <p className="text-[11px] mt-1.5">
                  <span className={ffmpegStatus.includes('Found') ? 'text-success' : 'text-danger'}>
                    {ffmpegStatus}
                  </span>
                </p>
              </div>

              {/* Buffer Duration */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Buffer Duration</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.5}
                    value={settings.bufferDuration ?? 0}
                    onChange={(e) => update('bufferDuration', parseFloat(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-[13px] font-mono w-10 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                    {(settings.bufferDuration ?? 0).toFixed(1)}s
                  </span>
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  {(settings.bufferDuration ?? 0) === 0
                    ? 'No buffer — lowest latency, but may drop frames on unstable connections'
                    : `${(settings.bufferDuration ?? 0).toFixed(1)}s buffer — reduces frame drops at the cost of added latency`}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>Takes effect on next stream start</p>
              </div>

              {/* Auto Reconnect */}
              <div style={{ borderTop: '1px solid var(--color-divider)' }} className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Auto Reconnect</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Retry failed destinations automatically</p>
                  </div>
                  <ToggleSwitch checked={settings.autoReconnect} onChange={() => update('autoReconnect', !settings.autoReconnect)} />
                </div>

                {settings.autoReconnect && (
                  <div className="mt-4 animate-fade-in">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Max Retries</label>
                    <input
                      type="number"
                      value={settings.maxRetries}
                      onChange={(e) => update('maxRetries', parseInt(e.target.value, 10) || 5)}
                      className="input-field w-24 text-[13px] tabular-nums"
                      min={1}
                      max={50}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Minimize to Tray</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Keep running when window is closed</p>
                </div>
                <ToggleSwitch checked={settings.minimizeToTray} onChange={() => update('minimizeToTray', !settings.minimizeToTray)} />
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="flex flex-col items-center text-center py-2">
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #e94560, #ff6b81)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                FreEstream
              </h1>

              <span
                className="mt-2 inline-block text-[11px] font-semibold tracking-widest uppercase px-2.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(233, 69, 96, 0.15)',
                  color: '#e94560',
                }}
              >
                v1.3.0
              </span>

              <p className="mt-4 text-[14px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Free multi-streaming for everyone
              </p>

              <p className="mt-2 text-[12px] leading-relaxed max-w-[280px]" style={{ color: 'var(--color-text-muted)' }}>
                Fan out a single RTMP ingest to multiple streaming platforms simultaneously.
                No subscriptions, no limits, completely free.
              </p>

              <div className="w-full my-5" style={{ borderTop: '1px solid var(--color-divider)' }} />

              <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Built by
              </p>
              <p
                className="mt-1.5 text-[15px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #e94560, #ff6b81)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Dhillon '<span style={{ WebkitTextFillColor: 'inherit' }}>l33tdawg</span>' Kannabhiran
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: 'var(--color-pill-bg)',
                      color: 'var(--color-pill-text)',
                      border: '1px solid var(--color-pill-border)',
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="w-full my-5" style={{ borderTop: '1px solid var(--color-divider)' }} />

              <p className="text-[11px] italic" style={{ color: 'var(--color-text-muted)' }}>
                Made with love for the streaming community
              </p>
            </div>
          )}
        </div>

        {/* Sticky actions */}
        <div className="px-6 py-4 flex justify-end gap-2.5 flex-shrink-0" style={{ borderTop: '1px solid var(--color-divider)' }}>
          <button onClick={onClose} className="btn-secondary text-[13px]">Close</button>
          {activeTab !== 'about' && (
            <button onClick={handleSave} className="btn-primary text-[13px]">
              {saved ? 'Saved' : 'Save Settings'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
