import { PlatformPreset, AppSettings, PlatformId } from '../shared/types';

export const PLATFORM_PRESETS: Record<string, PlatformPreset> = {
  twitch: {
    id: 'twitch',
    name: 'Twitch',
    defaultUrl: 'rtmp://live.twitch.tv/app/',
    requiresRtmps: false,
    color: '#9146FF',
    icon: '🟣',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    defaultUrl: 'rtmp://a.rtmp.youtube.com/live2/',
    requiresRtmps: false,
    color: '#FF0000',
    icon: '🔴',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    defaultUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    requiresRtmps: true,
    color: '#1877F2',
    icon: '🔵',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    defaultUrl: '',
    requiresRtmps: false,
    color: '#000000',
    icon: '⬛',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    defaultUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
    requiresRtmps: true,
    color: '#E4405F',
    icon: '🩷',
  },
  kick: {
    id: 'kick',
    name: 'Kick',
    defaultUrl: 'rtmps://fa723fc1b171.global-contribute.live-video.net:443/app/',
    requiresRtmps: true,
    color: '#53FC18',
    icon: '🟢',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    defaultUrl: '',
    requiresRtmps: false,
    color: '#000000',
    icon: '✖️',
  },
  rumble: {
    id: 'rumble',
    name: 'Rumble',
    defaultUrl: '',
    requiresRtmps: false,
    color: '#85C742',
    icon: '🟩',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn Live',
    defaultUrl: '',
    requiresRtmps: true,
    color: '#0A66C2',
    icon: '🔷',
  },
  trovo: {
    id: 'trovo',
    name: 'Trovo',
    defaultUrl: 'rtmp://livepush.trovo.live/live/',
    requiresRtmps: false,
    color: '#19D66B',
    icon: '🎮',
  },
  bilibili: {
    id: 'bilibili',
    name: 'Bilibili',
    defaultUrl: 'rtmp://live-push.bilivideo.com/live-bvc/',
    requiresRtmps: false,
    color: '#00A1D6',
    icon: '📺',
  },
  soop: {
    id: 'soop',
    name: 'SOOP',
    defaultUrl: 'rtmp://stream.sooplive.co.kr/app/',
    requiresRtmps: false,
    color: '#6A45FF',
    icon: '🟣',
  },
  mixcloud: {
    id: 'mixcloud',
    name: 'Mixcloud',
    defaultUrl: 'rtmp://rtmp.mixcloud.com/broadcast',
    requiresRtmps: false,
    color: '#5000FF',
    icon: '🎧',
  },
  custom: {
    id: 'custom',
    name: 'Custom RTMP',
    defaultUrl: '',
    requiresRtmps: false,
    color: '#6B7280',
    icon: '⚙️',
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  rtmpPort: 1935,
  ffmpegPath: '',
  bufferDuration: 0,
  autoReconnect: true,
  maxRetries: 5,
  minimizeToTray: true,
  startMinimized: false,
  theme: 'dark',
};

export interface PlatformEncodingPreset {
  bitrate: number;       // kbps
  resolution: '1080p' | '720p' | '480p';
  fps: number;
}

export const PLATFORM_ENCODING_PRESETS: Partial<Record<PlatformId, PlatformEncodingPreset>> = {
  twitch:    { bitrate: 6000, resolution: '1080p', fps: 60 },
  youtube:   { bitrate: 6000, resolution: '1080p', fps: 60 },
  facebook:  { bitrate: 4000, resolution: '1080p', fps: 30 },
  tiktok:    { bitrate: 4000, resolution: '1080p', fps: 30 },
  instagram: { bitrate: 3500, resolution: '720p',  fps: 30 },
  kick:      { bitrate: 6000, resolution: '1080p', fps: 60 },
  x:         { bitrate: 4000, resolution: '1080p', fps: 30 },
  linkedin:  { bitrate: 4000, resolution: '720p',  fps: 30 },
};

export const RESOLUTION_MAP: Record<string, string> = {
  '1080p': '1920:1080',
  '720p':  '1280:720',
  '480p':  '854:480',
};

export const APP_NAME = 'FreEstream';
export const RTMP_APP_NAME = 'live';
export const RTMP_STREAM_KEY = 'stream';
