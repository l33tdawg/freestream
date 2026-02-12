import React, { useState, useEffect } from 'react';
import { AvailableEncoders, Destination, EncodingSettings, VideoEncoder } from '../../shared/types';
import StreamKeyInput from './StreamKeyInput';
import PlatformIcon from './PlatformIcon';
import { useTheme } from '../hooks/useTheme';

interface Props {
  destination: Destination | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Destination>, streamKey?: string) => void;
}

export default function EditDestinationDialog({ destination, open, onClose, onSave }: Props) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [loadedKey, setLoadedKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [encodingEnabled, setEncodingEnabled] = useState(false);
  const [encoding, setEncoding] = useState<EncodingSettings>({ encoder: 'copy' });
  const [availableEncoders, setAvailableEncoders] = useState<AvailableEncoders>({ hardware: [], software: ['libx264'] });
  const [platformPresets, setPlatformPresets] = useState<Record<string, any>>({});

  useEffect(() => {
    if (destination && open) {
      setName(destination.name);
      setUrl(destination.url);
      setStreamKey('');
      setLoadedKey(false);
      setTestResult(null);

      const hasEncoding = !!destination.encoding && destination.encoding.encoder !== 'copy';
      setEncodingEnabled(hasEncoding);
      setEncoding(destination.encoding || { encoder: 'copy' });

      window.freestream.getStreamKey(destination.id).then((key) => {
        if (key) setStreamKey(key);
        setLoadedKey(true);
      });
      window.freestream.detectEncoders().then(setAvailableEncoders).catch(() => {});
      window.freestream.getEncodingPresets().then(setPlatformPresets).catch(() => {});
    }
  }, [destination, open]);

  const handleTest = async () => {
    if (!url || !streamKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.freestream.testConnection(url, streamKey);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: 'Test failed unexpectedly' });
    } finally {
      setTesting(false);
    }
  };

  if (!open || !destination) return null;

  const encoderLabel = (enc: VideoEncoder): string => {
    const labels: Record<VideoEncoder, string> = {
      'copy': 'Passthrough',
      'libx264': 'x264 (Software)',
      'h264_videotoolbox': 'VideoToolbox (macOS)',
      'h264_nvenc': 'NVENC (NVIDIA)',
      'h264_qsv': 'Quick Sync (Intel)',
      'h264_amf': 'AMF (AMD)',
    };
    return labels[enc] || enc;
  };

  const applyPlatformPreset = () => {
    const preset = platformPresets[destination.platform];
    if (!preset) return;
    const bestEncoder: VideoEncoder = availableEncoders.hardware[0] || 'libx264';
    setEncoding({
      encoder: bestEncoder,
      bitrate: preset.bitrate,
      resolution: preset.resolution,
      fps: preset.fps,
      x264Preset: bestEncoder === 'libx264' ? 'veryfast' : undefined,
      rateControl: preset.rateControl || 'cbr',
      keyframeInterval: preset.keyframeInterval || 2,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const encodingSettings = encodingEnabled ? encoding : undefined;
    onSave(destination.id, { name, url, encoding: encodingSettings }, streamKey || undefined);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={destination.platform} size={20} />
            <div>
              <h2 className="text-[17px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Edit Destination</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Update your streaming destination settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>RTMP URL</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input-field font-mono text-[13px]" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Stream Key</label>
            <StreamKeyInput
              value={streamKey}
              onChange={setStreamKey}
              placeholder={loadedKey ? 'Enter new stream key' : 'Loading...'}
            />
            <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <svg className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Stored securely in your OS keychain
            </p>
          </div>

          {/* Test Connection */}
          {url && streamKey && (
            <div>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="btn-secondary text-[12px] w-full flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Testing connection...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Test Connection
                  </>
                )}
              </button>
              {testResult && (
                <div
                  className="mt-2 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2"
                  style={{
                    background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    color: testResult.success ? '#22c55e' : '#ef4444',
                  }}
                >
                  {testResult.success ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{testResult.success ? 'Connection successful — stream key is valid' : testResult.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Encoding Settings */}
          <div style={{ borderTop: '1px solid var(--color-divider)' }} className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Encoding</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {encodingEnabled ? 'Re-encode stream for this destination' : 'Passthrough — only enable if your source doesn\'t match this platform\'s requirements'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !encodingEnabled;
                  setEncodingEnabled(next);
                  if (!next) setEncoding({ encoder: 'copy' });
                  else if (encoding.encoder === 'copy') {
                    const bestEncoder = availableEncoders.hardware[0] || 'libx264';
                    const preset = platformPresets[destination.platform];
                    setEncoding({
                      encoder: bestEncoder,
                      bitrate: preset?.bitrate || 4000,
                      resolution: preset?.resolution || '1080p',
                      fps: preset?.fps || 30,
                      x264Preset: bestEncoder === 'libx264' ? 'veryfast' : undefined,
                      rateControl: preset?.rateControl || 'cbr',
                      keyframeInterval: preset?.keyframeInterval || 2,
                    });
                  }
                }}
                className="toggle-track"
                style={{ background: encodingEnabled ? '#e94560' : 'var(--color-toggle-off)' }}
              >
                <div className="toggle-thumb" style={{ left: encodingEnabled ? '22px' : '3px' }} />
              </button>
            </div>

            {encodingEnabled && (
              <div className="space-y-3 animate-fade-in">
                {/* Platform preset button */}
                {platformPresets[destination.platform] && (
                  <button
                    type="button"
                    onClick={applyPlatformPreset}
                    className="btn-secondary text-[12px] w-full"
                  >
                    Use {destination.name} recommended settings
                  </button>
                )}

                {/* Encoder */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Encoder</label>
                  <select
                    value={encoding.encoder}
                    onChange={(e) => setEncoding({ ...encoding, encoder: e.target.value as VideoEncoder })}
                    className="input-field text-[13px]"
                  >
                    {availableEncoders.hardware.map((enc) => (
                      <option key={enc} value={enc}>{encoderLabel(enc)}</option>
                    ))}
                    <option value="libx264">{encoderLabel('libx264')}</option>
                  </select>
                </div>

                {/* Software encoder warning */}
                {encoding.encoder === 'libx264' && availableEncoders.hardware.length > 0 && (
                  <div
                    className="px-3 py-2 rounded-lg text-[12px] flex items-start gap-2"
                    style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}
                  >
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>Software encoding uses significant CPU. Consider using <strong>{encoderLabel(availableEncoders.hardware[0])}</strong> instead.</span>
                  </div>
                )}

                {/* Bitrate */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Bitrate (kbps)</label>
                  <input
                    type="number"
                    value={encoding.bitrate || ''}
                    onChange={(e) => setEncoding({ ...encoding, bitrate: parseInt(e.target.value, 10) || undefined })}
                    className="input-field text-[13px] tabular-nums"
                    placeholder="e.g. 4000"
                    min={500}
                    max={50000}
                  />
                </div>

                {/* Rate Control & Keyframe Interval row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Rate Control</label>
                    <select
                      value={encoding.rateControl || 'cbr'}
                      onChange={(e) => setEncoding({ ...encoding, rateControl: e.target.value as 'cbr' | 'vbr' })}
                      className="input-field text-[13px]"
                    >
                      <option value="cbr">CBR (Constant)</option>
                      <option value="vbr">VBR (Variable)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Keyframe Interval (s)</label>
                    <input
                      type="number"
                      value={encoding.keyframeInterval ?? 2}
                      onChange={(e) => setEncoding({ ...encoding, keyframeInterval: parseInt(e.target.value, 10) || 2 })}
                      className="input-field text-[13px] tabular-nums"
                      min={1}
                      max={10}
                    />
                  </div>
                </div>

                {/* Resolution & FPS row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Resolution</label>
                    <select
                      value={encoding.resolution || 'source'}
                      onChange={(e) => setEncoding({ ...encoding, resolution: e.target.value as any })}
                      className="input-field text-[13px]"
                    >
                      <option value="source">Source</option>
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Frame Rate</label>
                    <select
                      value={encoding.fps || 'source'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEncoding({ ...encoding, fps: val === 'source' ? 'source' : parseInt(val, 10) });
                      }}
                      className="input-field text-[13px]"
                    >
                      <option value="source">Source</option>
                      <option value="60">60 fps</option>
                      <option value="30">30 fps</option>
                    </select>
                  </div>
                </div>

                {/* x264 Preset */}
                {encoding.encoder === 'libx264' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>x264 Preset</label>
                    <select
                      value={encoding.x264Preset || 'veryfast'}
                      onChange={(e) => setEncoding({ ...encoding, x264Preset: e.target.value as any })}
                      className="input-field text-[13px]"
                    >
                      <option value="ultrafast">Ultrafast</option>
                      <option value="veryfast">Veryfast</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-[13px]">Cancel</button>
            <button type="submit" className="btn-primary text-[13px]">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
