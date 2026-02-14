import { contextBridge, ipcRenderer } from 'electron';

// IPC channel names inlined — sandboxed preload cannot require() relative modules
const IPC = {
  GET_DESTINATIONS: 'destinations:get',
  ADD_DESTINATION: 'destinations:add',
  UPDATE_DESTINATION: 'destinations:update',
  REMOVE_DESTINATION: 'destinations:remove',
  TOGGLE_DESTINATION: 'destinations:toggle',
  SET_STREAM_KEY: 'secrets:set-key',
  GET_STREAM_KEY: 'secrets:get-key',
  GO_LIVE: 'stream:go-live',
  STOP_ALL: 'stream:stop-all',
  STOP_DESTINATION: 'stream:stop-destination',
  GET_STREAM_STATUS: 'stream:get-status',
  INGEST_STATUS_CHANGED: 'event:ingest-status',
  DESTINATION_STATUS_CHANGED: 'event:destination-status',
  GET_SETTINGS: 'settings:get',
  UPDATE_SETTINGS: 'settings:update',
  DETECT_FFMPEG: 'ffmpeg:detect',
  DETECT_ENCODERS: 'ffmpeg:detect-encoders',
  GET_INGEST_URL: 'app:get-ingest-url',
  GET_ENCODING_PRESETS: 'app:get-encoding-presets',
  LOG_MESSAGE: 'event:log-message',
} as const;

const api = {
  // Destinations
  getDestinations: () => ipcRenderer.invoke(IPC.GET_DESTINATIONS),
  addDestination: (platform: string, name: string, url: string, streamKey: string) =>
    ipcRenderer.invoke(IPC.ADD_DESTINATION, platform, name, url, streamKey),
  updateDestination: (id: string, updates: any, streamKey?: string) =>
    ipcRenderer.invoke(IPC.UPDATE_DESTINATION, id, updates, streamKey),
  removeDestination: (id: string) => ipcRenderer.invoke(IPC.REMOVE_DESTINATION, id),
  toggleDestination: (id: string) => ipcRenderer.invoke(IPC.TOGGLE_DESTINATION, id),

  // Stream keys
  setStreamKey: (destinationId: string, key: string) =>
    ipcRenderer.invoke(IPC.SET_STREAM_KEY, destinationId, key),
  getStreamKey: (destinationId: string) =>
    ipcRenderer.invoke(IPC.GET_STREAM_KEY, destinationId),

  // Streaming
  goLive: () => ipcRenderer.invoke(IPC.GO_LIVE),
  stopAll: () => ipcRenderer.invoke(IPC.STOP_ALL),
  stopDestination: (id: string) => ipcRenderer.invoke(IPC.STOP_DESTINATION, id),
  getStreamStatus: () => ipcRenderer.invoke(IPC.GET_STREAM_STATUS),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  updateSettings: (updates: any) => ipcRenderer.invoke(IPC.UPDATE_SETTINGS, updates),

  // FFmpeg
  detectFfmpeg: () => ipcRenderer.invoke(IPC.DETECT_FFMPEG),
  detectEncoders: () => ipcRenderer.invoke(IPC.DETECT_ENCODERS),
  getEncodingPresets: () => ipcRenderer.invoke(IPC.GET_ENCODING_PRESETS),

  // App
  getIngestUrl: () => ipcRenderer.invoke(IPC.GET_INGEST_URL),
  getIngestStreamKey: () => ipcRenderer.invoke('app:get-ingest-stream-key'),
  getNetworkIngestUrl: () => ipcRenderer.invoke('app:get-network-ingest-url'),
  getPlatformPresets: () => ipcRenderer.invoke('app:get-platform-presets'),

  // Stream key verification
  testConnection: (url: string, streamKey: string) =>
    ipcRenderer.invoke('stream:test-connection', url, streamKey),

  // Event listeners
  onIngestStatusChanged: (callback: (status: any) => void) => {
    const listener = (_event: any, status: any) => callback(status);
    ipcRenderer.on(IPC.INGEST_STATUS_CHANGED, listener);
    return () => ipcRenderer.removeListener(IPC.INGEST_STATUS_CHANGED, listener);
  },
  onDestinationStatusChanged: (callback: (status: any) => void) => {
    const listener = (_event: any, status: any) => callback(status);
    ipcRenderer.on(IPC.DESTINATION_STATUS_CHANGED, listener);
    return () => ipcRenderer.removeListener(IPC.DESTINATION_STATUS_CHANGED, listener);
  },
  onLogMessage: (callback: (entry: any) => void) => {
    const listener = (_event: any, entry: any) => callback(entry);
    ipcRenderer.on(IPC.LOG_MESSAGE, listener);
    return () => ipcRenderer.removeListener(IPC.LOG_MESSAGE, listener);
  },
};

contextBridge.exposeInMainWorld('freestream', api);

export type FreEstreamAPI = typeof api;
