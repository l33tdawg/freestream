import React, { useState, useEffect } from 'react';
import { AppSettings } from '../../shared/types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: Props) {
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [ffmpegStatus, setFfmpegStatus] = useState<string>('Detecting...');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      window.freestream.getSettings().then(setSettings);
      window.freestream.detectFfmpeg().then((path) => {
        setFfmpegStatus(path ? `Found: ${path}` : 'Not found — install FFmpeg to enable fan-out');
      }).catch(() => setFfmpegStatus('Detection failed'));
    }
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
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-[17px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
          <p className="text-[12px] text-gray-500 mt-1">Configure your FreEstream preferences</p>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* RTMP Port */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">RTMP Ingest Port</label>
            <input
              type="number"
              value={settings.rtmpPort}
              onChange={(e) => update('rtmpPort', parseInt(e.target.value, 10) || 1935)}
              className="input-field w-36 tabular-nums"
              min={1024}
              max={65535}
            />
            <p className="text-[11px] text-gray-600 mt-1.5">Restart required after changing</p>
          </div>

          {/* FFmpeg */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">FFmpeg Path</label>
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

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--color-divider)' }} className="pt-4">
            {/* Auto Reconnect */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Auto Reconnect</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Retry failed destinations automatically</p>
              </div>
              <ToggleSwitch checked={settings.autoReconnect} onChange={() => update('autoReconnect', !settings.autoReconnect)} />
            </div>

            {settings.autoReconnect && (
              <div className="mt-4 animate-fade-in">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Max Retries</label>
                <input
                  type="number"
                  value={settings.maxRetries}
                  onChange={(e) => update('maxRetries', parseInt(e.target.value, 10) || 5)}
                  className="input-field w-24 tabular-nums"
                  min={1}
                  max={50}
                />
              </div>
            )}
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Appearance</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Switch between dark and light mode</p>
            </div>
            <ToggleSwitch checked={isDark} onChange={toggleTheme} />
          </div>

          {/* Minimize to tray */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Minimize to Tray</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Keep running when window is closed</p>
            </div>
            <ToggleSwitch checked={settings.minimizeToTray} onChange={() => update('minimizeToTray', !settings.minimizeToTray)} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button onClick={onClose} className="btn-secondary text-[13px]">Close</button>
            <button onClick={handleSave} className="btn-primary text-[13px]">
              {saved ? 'Saved' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
