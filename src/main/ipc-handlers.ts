import { ipcMain, BrowserWindow } from 'electron';
import { IPC, PlatformId } from '../shared/types';
import { DestinationManager } from './destination-manager';
import { FFmpegManager } from './ffmpeg-manager';
import { StreamMonitor } from './stream-monitor';
import { NMSWrapper } from './nms';
import { PLATFORM_PRESETS } from './constants';
import { getSettings, updateSettings } from './config';
import { setStreamKey, getStreamKey, deleteStreamKey } from './secrets';
import { detectFfmpeg } from './ffmpeg-detector';

export function registerIpcHandlers(
  mainWindow: BrowserWindow,
  nms: NMSWrapper,
  ffmpegManager: FFmpegManager,
  destinationManager: DestinationManager,
  streamMonitor: StreamMonitor
): void {
  // --- Destinations ---
  ipcMain.handle(IPC.GET_DESTINATIONS, () => {
    return destinationManager.getAll();
  });

  ipcMain.handle(IPC.ADD_DESTINATION, async (_event, platform: PlatformId, name: string, url: string, streamKey: string) => {
    const dest = destinationManager.add(platform, name, url);
    if (streamKey) {
      await setStreamKey(dest.id, streamKey);
    }
    return dest;
  });

  ipcMain.handle(IPC.UPDATE_DESTINATION, async (_event, id: string, updates: any, streamKey?: string) => {
    const dest = destinationManager.update(id, updates);
    if (streamKey !== undefined && streamKey !== null) {
      await setStreamKey(id, streamKey);
    }
    return dest;
  });

  ipcMain.handle(IPC.REMOVE_DESTINATION, async (_event, id: string) => {
    if (ffmpegManager.isRunning()) {
      await ffmpegManager.stopDestination(id);
    }
    return destinationManager.remove(id);
  });

  ipcMain.handle(IPC.TOGGLE_DESTINATION, (_event, id: string) => {
    return destinationManager.toggle(id);
  });

  // --- Secrets ---
  ipcMain.handle(IPC.SET_STREAM_KEY, async (_event, destinationId: string, key: string) => {
    await setStreamKey(destinationId, key);
    return true;
  });

  ipcMain.handle(IPC.GET_STREAM_KEY, async (_event, destinationId: string) => {
    return getStreamKey(destinationId);
  });

  ipcMain.handle(IPC.DELETE_STREAM_KEY, async (_event, destinationId: string) => {
    return deleteStreamKey(destinationId);
  });

  // --- Streaming ---
  ipcMain.handle(IPC.GO_LIVE, async () => {
    const destinations = destinationManager.getEnabled();
    if (destinations.length === 0) {
      return { success: false, error: 'No enabled destinations' };
    }

    if (!nms.ingestStatus.connected) {
      return { success: false, error: 'No ingest stream connected. Start streaming from OBS first.' };
    }

    try {
      // Use the actual RTMP path OBS is publishing to
      ffmpegManager.setIngestUrl(nms.getIngestUrl());
      await ffmpegManager.startAll(destinations);
      streamMonitor.startPolling();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(IPC.STOP_ALL, async () => {
    streamMonitor.stopPolling();
    await ffmpegManager.stopAll();
    return { success: true };
  });

  ipcMain.handle(IPC.STOP_DESTINATION, async (_event, id: string) => {
    await ffmpegManager.stopDestination(id);
    return { success: true };
  });

  ipcMain.handle(IPC.GET_STREAM_STATUS, () => {
    return {
      ingest: streamMonitor.getIngestStatus(),
      destinations: streamMonitor.getDestinationStatuses(),
      isLive: ffmpegManager.isRunning(),
    };
  });

  // --- Settings ---
  ipcMain.handle(IPC.GET_SETTINGS, () => {
    return getSettings();
  });

  ipcMain.handle(IPC.UPDATE_SETTINGS, (_event, updates: any) => {
    return updateSettings(updates);
  });

  // --- FFmpeg ---
  ipcMain.handle(IPC.DETECT_FFMPEG, async () => {
    const settings = getSettings();
    return detectFfmpeg(settings.ffmpegPath);
  });

  // --- App ---
  ipcMain.handle(IPC.GET_INGEST_URL, () => {
    return nms.getIngestServerUrl();
  });

  ipcMain.handle('app:get-ingest-stream-key', () => {
    return nms.getIngestStreamKey();
  });

  ipcMain.handle('app:get-network-ingest-url', () => {
    return nms.getNetworkIngestUrl();
  });

  ipcMain.handle('app:get-platform-presets', () => {
    return PLATFORM_PRESETS;
  });

  // --- Stream key verification ---
  ipcMain.handle('stream:test-connection', async (_event, url: string, streamKey: string) => {
    return ffmpegManager.testConnection(url, streamKey);
  });

  // --- Forward events to renderer ---
  streamMonitor.on('ingestStatusChanged', (status) => {
    mainWindow.webContents.send(IPC.INGEST_STATUS_CHANGED, status);
  });

  streamMonitor.on('destinationStatusChanged', (status) => {
    mainWindow.webContents.send(IPC.DESTINATION_STATUS_CHANGED, status);
  });
}
