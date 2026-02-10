import React, { useState, useEffect } from 'react';
import { PlatformId, PlatformPreset } from '../../shared/types';
import StreamKeyInput from './StreamKeyInput';
import PlatformIcon from './PlatformIcon';
import { useTheme } from '../hooks/useTheme';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (platform: PlatformId, name: string, url: string, streamKey: string) => void;
}

interface PlatformGuide {
  steps: string;
  link: string;
  linkLabel: string;
  warning?: string;
  note?: string;
}

const platformGuides: Record<PlatformId, PlatformGuide> = {
  twitch: {
    steps: 'Get your stream key from Twitch Dashboard → Settings → Stream. Copy your Primary Stream Key.',
    link: 'https://dashboard.twitch.tv/u/settings/stream',
    linkLabel: 'Open Twitch Dashboard',
  },
  youtube: {
    steps: 'Go to YouTube Studio → Go Live → Stream. Copy the Stream URL and Stream Key from the encoder setup.',
    link: 'https://studio.youtube.com/channel/UC/livestreaming',
    linkLabel: 'Open YouTube Studio',
  },
  facebook: {
    steps: 'Go to Facebook Live Producer → Create Live Video → select "Streaming Software". Copy the Server URL and Stream Key.',
    link: 'https://www.facebook.com/live/producer',
    linkLabel: 'Open Live Producer',
    note: 'You must create a new live video each session. The stream key changes every time.',
  },
  tiktok: {
    steps: 'Open TikTok LIVE Studio or go to LIVE Center on desktop. Copy the Server URL and Stream Key provided.',
    link: 'https://www.tiktok.com/studio',
    linkLabel: 'Open TikTok Studio',
    warning: 'Requires LIVE access (typically 1,000+ followers)',
    note: 'TikTok provides a unique server URL per session — you\'ll need to update it each time.',
  },
  instagram: {
    steps: 'Use Instagram\'s Live Producer to get your stream key. Go to the Instagram desktop website and start a live session.',
    link: 'https://www.instagram.com/live/producer',
    linkLabel: 'Open Live Producer',
    warning: 'Requires 1,000+ followers and eligible account',
    note: 'Stream key expires each session. 1-hour max duration. Must stop on Instagram first.',
  },
  kick: {
    steps: 'Go to Kick Dashboard → Settings → Stream. Copy your Stream Key.',
    link: 'https://kick.com/dashboard/settings',
    linkLabel: 'Open Kick Dashboard',
    note: 'Kick uses RTMPS. No follower requirements — open to all users.',
  },
  x: {
    steps: 'Go to X Media Studio → Producer → Sources tab → Create Source. Copy the Server URL and Stream Key.',
    link: 'https://studio.x.com',
    linkLabel: 'Open X Media Studio',
    warning: 'Requires X Premium or Premium+ subscription',
    note: 'The RTMP URL is dynamically assigned per source. Paste the full URL provided by X.',
  },
  rumble: {
    steps: 'Go to Rumble → Go Live → Get Streamer Configuration. Copy the Server URL and Stream Key.',
    link: 'https://rumble.com/live',
    linkLabel: 'Open Rumble Live',
    note: 'Stream keys are case-sensitive. URL is generated per session.',
  },
  linkedin: {
    steps: 'Schedule a LinkedIn Live event → select "Custom Stream (RTMP)" → copy the Server URL and Stream Key.',
    link: 'https://www.linkedin.com/video/golive',
    linkLabel: 'Go Live on LinkedIn',
    warning: 'Must schedule an event first',
    note: 'RTMP credentials only available 1 hour before scheduled start. Uses RTMPS.',
  },
  trovo: {
    steps: 'Go to Trovo Creator Studio → start a live session. Copy the RTMP URL and Stream Key.',
    link: 'https://studio.trovo.live',
    linkLabel: 'Open Trovo Studio',
    note: 'Gaming-focused platform by Tencent. No follower requirements.',
  },
  bilibili: {
    steps: 'Go to Bilibili Live Center → Start Live → copy the RTMP URL and Stream Key.',
    link: 'https://link.bilibili.com/p/center/index',
    linkLabel: 'Open Bilibili Live Center',
    note: 'Primarily Chinese audience. May require Chinese phone number for verification.',
  },
  soop: {
    steps: 'Go to SOOP Dashboard → Encoder Settings. Copy the Server URL and Stream Key.',
    link: 'https://www.sooplive.co.kr',
    linkLabel: 'Open SOOP',
    note: 'Formerly AfreecaTV. Regional servers available (Korea, US, UK, Singapore, Brazil).',
  },
  custom: {
    steps: 'Enter your custom RTMP or RTMPS server URL and stream key. Works with any RTMP-compatible service.',
    link: '',
    linkLabel: '',
    note: 'Compatible with DLive, Vimeo, Steam, Dacast, Nimo TV, and any other RTMP service.',
  },
};

export default function AddDestinationDialog({ open, onClose, onAdd }: Props) {
  const { isDark } = useTheme();
  const [presets, setPresets] = useState<Record<string, PlatformPreset>>({});
  const [platform, setPlatform] = useState<PlatformId>('twitch');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    window.freestream.getPlatformPresets().then(setPresets);
  }, []);

  useEffect(() => {
    if (presets[platform]) {
      setName(presets[platform].name);
      setUrl(presets[platform].defaultUrl);
    }
    setTestResult(null);
  }, [platform, presets]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(platform, name, url, streamKey);
    resetForm();
    onClose();
  };

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

  const resetForm = () => {
    setPlatform('twitch');
    setName('');
    setUrl('');
    setStreamKey('');
    setTesting(false);
    setTestResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const guide = platformGuides[platform];
  const preset = presets[platform];
  const platformColor = preset?.color || '#6B7280';

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-[17px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add Destination</h2>
          <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Choose a platform and configure your stream</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Platform grid */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
              Platform
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.values(presets).map((p) => {
                const isSelected = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`relative p-3.5 rounded-xl text-center transition-all duration-200 group ${
                      isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      background: isSelected
                        ? `${p.color}15`
                        : 'var(--color-platform-unselected-bg)',
                      border: `1px solid ${
                        isSelected ? `${p.color}40` : 'var(--color-platform-unselected-border)'
                      }`,
                      boxShadow: isSelected
                        ? `0 2px 12px ${p.color}20, inset 0 1px 0 ${p.color}15`
                        : 'none',
                    }}
                  >
                    {/* Selected indicator dot */}
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                        style={{ background: p.color }}
                      />
                    )}
                    <div className="flex flex-col items-center gap-2">
                      <PlatformIcon
                        platform={p.id}
                        size={22}
                        className={`transition-all duration-200 ${
                          isSelected ? '' : 'opacity-50 group-hover:opacity-80'
                        }`}
                      />
                      <span
                        className="text-[11px] font-medium transition-colors duration-200"
                        style={{ color: isSelected ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}
                      >
                        {p.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform setup guide */}
          {guide && (
            <div
              className="rounded-xl p-3.5 transition-all duration-300 animate-fade-in"
              style={{
                background: `${platformColor}08`,
                border: `1px solid ${platformColor}18`,
                borderLeft: `3px solid ${platformColor}60`,
              }}
            >
              <div className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: platformColor }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1 space-y-2">
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {guide.steps}
                  </p>

                  {guide.warning && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-[11px] text-amber-400 font-medium">{guide.warning}</span>
                    </div>
                  )}

                  {guide.note && (
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      {guide.note}
                    </p>
                  )}

                  {guide.link && (
                    <a
                      href={guide.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors duration-150 hover:brightness-125"
                      style={{ color: platformColor }}
                    >
                      {guide.linkLabel}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="My Twitch Channel"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              RTMP URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-field font-mono text-[13px]"
              placeholder="rtmp://..."
            />
          </div>

          {/* Stream Key */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Stream Key
            </label>
            <StreamKeyInput value={streamKey} onChange={setStreamKey} />
            <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <svg className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
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

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-1">
            <button type="button" onClick={handleClose} className="btn-secondary text-[13px]">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px]"
              disabled={!name || !streamKey}
            >
              <span className="flex items-center gap-2">
                <PlatformIcon platform={platform} size={14} />
                Add Destination
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
