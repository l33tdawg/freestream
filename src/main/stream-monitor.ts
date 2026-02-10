import { EventEmitter } from 'events';
import { NMSWrapper } from './nms';
import { FFmpegManager } from './ffmpeg-manager';
import { IngestStatus, DestinationStatus } from '../shared/types';

export class StreamMonitor extends EventEmitter {
  private nms: NMSWrapper;
  private ffmpegManager: FFmpegManager;
  private pollInterval?: NodeJS.Timeout;

  constructor(nms: NMSWrapper, ffmpegManager: FFmpegManager) {
    super();
    this.nms = nms;
    this.ffmpegManager = ffmpegManager;

    // Forward NMS events
    this.nms.on('ingestConnected', (status: IngestStatus) => {
      this.emit('ingestStatusChanged', status);
    });

    this.nms.on('ingestDisconnected', () => {
      this.emit('ingestStatusChanged', { connected: false } as IngestStatus);
    });

    // Forward NMS stats updates (bitrate, fps, resolution, etc.)
    this.nms.on('ingestStatsUpdated', (status: IngestStatus) => {
      this.emit('ingestStatusChanged', status);
    });

    // Forward FFmpeg status events
    this.ffmpegManager.on('statusChanged', (status: DestinationStatus) => {
      this.emit('destinationStatusChanged', status);
    });
  }

  getIngestStatus(): IngestStatus {
    return this.nms.ingestStatus;
  }

  getDestinationStatuses(): DestinationStatus[] {
    return this.ffmpegManager.getAllStatuses();
  }

  startPolling(intervalMs: number = 2000): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      // Re-emit all current statuses for UI refresh
      const statuses = this.ffmpegManager.getAllStatuses();
      for (const status of statuses) {
        this.emit('destinationStatusChanged', status);
      }
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }
}
