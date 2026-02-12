export type PlatformId =
  | 'twitch'
  | 'youtube'
  | 'facebook'
  | 'tiktok'
  | 'instagram'
  | 'kick'
  | 'x'
  | 'rumble'
  | 'linkedin'
  | 'trovo'
  | 'bilibili'
  | 'soop'
  | 'mixcloud'
  | 'custom';

export type VideoEncoder = 'copy' | 'libx264' | 'h264_videotoolbox' | 'h264_nvenc' | 'h264_qsv' | 'h264_amf';
export type X264Preset = 'ultrafast' | 'veryfast' | 'medium';

export interface EncodingSettings {
  encoder: VideoEncoder;
  bitrate?: number;       // kbps
  resolution?: '1080p' | '720p' | '480p' | 'source';
  fps?: number | 'source';
  x264Preset?: X264Preset;
  rateControl?: 'cbr' | 'vbr';
  keyframeInterval?: number;  // seconds (e.g. 2)
}

export interface AvailableEncoders {
  hardware: VideoEncoder[];
  software: VideoEncoder[];
}

export interface PlatformPreset {
  id: PlatformId;
  name: string;
  defaultUrl: string;
  requiresRtmps: boolean;
  color: string;
  icon: string; // emoji fallback
}

export interface Destination {
  id: string;
  platform: PlatformId;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: number;
  encoding?: EncodingSettings;
}

export type DestinationHealth = 'idle' | 'connecting' | 'live' | 'error' | 'retrying';

export interface DestinationStatus {
  id: string;
  health: DestinationHealth;
  bitrate?: number;
  fps?: number;
  uptime?: number; // seconds
  droppedFrames?: number;
  error?: string;
  retryCount?: number;
  cpuPercent?: number; // per-FFmpeg-process CPU usage
}

export interface IngestStatus {
  connected: boolean;
  clientIp?: string;
  codec?: string;
  bitrate?: number;
  fps?: number;
  resolution?: string;
  audioCodec?: string;
  audioChannels?: number;
  sampleRate?: number;
  uptime?: number;
  previewUrl?: string;
}

export interface AppSettings {
  rtmpPort: number;
  ffmpegPath: string;
  bufferDuration: number;
  autoReconnect: boolean;
  maxRetries: number;
  minimizeToTray: boolean;
  startMinimized: boolean;
  theme: 'dark' | 'light';
}

export interface StreamStats {
  frame: number;
  fps: number;
  size: string;
  time: string;
  bitrate: number;
  speed: number;
}

// IPC channel names
export const IPC = {
  // Destinations
  GET_DESTINATIONS: 'destinations:get',
  ADD_DESTINATION: 'destinations:add',
  UPDATE_DESTINATION: 'destinations:update',
  REMOVE_DESTINATION: 'destinations:remove',
  TOGGLE_DESTINATION: 'destinations:toggle',

  // Stream keys (secrets)
  SET_STREAM_KEY: 'secrets:set-key',
  GET_STREAM_KEY: 'secrets:get-key',
  DELETE_STREAM_KEY: 'secrets:delete-key',

  // Streaming
  GO_LIVE: 'stream:go-live',
  STOP_ALL: 'stream:stop-all',
  STOP_DESTINATION: 'stream:stop-destination',
  GET_STREAM_STATUS: 'stream:get-status',

  // Events (main → renderer)
  INGEST_STATUS_CHANGED: 'event:ingest-status',
  DESTINATION_STATUS_CHANGED: 'event:destination-status',
  STREAM_ERROR: 'event:stream-error',

  // Settings
  GET_SETTINGS: 'settings:get',
  UPDATE_SETTINGS: 'settings:update',

  // FFmpeg
  DETECT_FFMPEG: 'ffmpeg:detect',
  DETECT_ENCODERS: 'ffmpeg:detect-encoders',

  // App
  GET_INGEST_URL: 'app:get-ingest-url',
  GET_ENCODING_PRESETS: 'app:get-encoding-presets',

} as const;
