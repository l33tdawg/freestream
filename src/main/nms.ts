import NodeMediaServer from 'node-media-server';
import { EventEmitter } from 'events';
import http from 'http';
import os from 'os';
import { IngestStatus } from '../shared/types';
import { RTMP_APP_NAME, RTMP_STREAM_KEY } from './constants';
import { log } from './logger';
// RTMP_APP_NAME/RTMP_STREAM_KEY used as defaults when no stream is connected

export class NMSWrapper extends EventEmitter {
  private nms: any = null;
  private port: number;
  private httpPort: number;
  private _ingestStatus: IngestStatus = { connected: false };
  private _currentStreamPath: string | null = null;
  private _connectTime: number = 0;
  private _prevBytes: number = 0;
  private _prevBytesTime: number = 0;
  private _statsInterval?: NodeJS.Timeout;

  constructor(port: number = 1935) {
    super();
    this.port = port;
    this.httpPort = port + 8000;
  }

  get ingestStatus(): IngestStatus {
    return { ...this._ingestStatus };
  }

  start(): void {
    const config = {
      logType: 1, // show basic logs for connection debugging
      rtmp: {
        port: this.port,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: this.httpPort,
        allow_origin: '*',
      },
    };

    this.nms = new NodeMediaServer(config);

    this.nms.on('prePublish', (id: string, streamPath: string, args: any) => {
      log('nms', 'info', `prePublish: ${streamPath} from session ${id}`);
      let clientIp = 'unknown';
      try {
        const session = this.nms.getSession(id);
        clientIp = session?.ip || 'unknown';
      } catch (err) {
        log('nms', 'warn', `Could not get session info: ${err}`);
      }
      this._currentStreamPath = streamPath;
      this._connectTime = Date.now();
      this._prevBytes = 0;
      this._prevBytesTime = Date.now();
      this._ingestStatus = {
        connected: true,
        clientIp,
        previewUrl: this.getHttpFlvUrl(),
      };
      this.emit('ingestConnected', this._ingestStatus);
      this.startStatsPolling();
    });

    this.nms.on('postPublish', (id: string, streamPath: string, args: any) => {
      log('nms', 'info', `postPublish: ${streamPath}`);
    });

    this.nms.on('donePublish', (id: string, streamPath: string, args: any) => {
      log('nms', 'info', `donePublish: ${streamPath}`);
      this.stopStatsPolling();
      this._currentStreamPath = null;
      this._ingestStatus = { connected: false };
      this.emit('ingestDisconnected');
    });

    this.nms.run();
    log('nms', 'info', `RTMP server started on port ${this.port}`);
  }

  stop(): void {
    this.stopStatsPolling();
    if (this.nms) {
      this.nms.stop();
      this.nms = null;
      this._ingestStatus = { connected: false };
      log('nms', 'info', 'RTMP server stopped');
    }
  }

  /** Full RTMP URL for FFmpeg input — uses actual published path when available */
  getIngestUrl(): string {
    if (this._currentStreamPath) {
      return `rtmp://localhost:${this.port}${this._currentStreamPath}`;
    }
    return `rtmp://localhost:${this.port}/${RTMP_APP_NAME}/${RTMP_STREAM_KEY}`;
  }

  /** Server URL to display in UI (for OBS Server field) */
  getIngestServerUrl(): string {
    return `rtmp://localhost:${this.port}/${RTMP_APP_NAME}`;
  }

  /** Network-accessible URL for remote OBS connections */
  getNetworkIngestUrl(): string {
    const ip = this.getLocalIp();
    if (ip) {
      return `rtmp://${ip}:${this.port}/${RTMP_APP_NAME}`;
    }
    return `rtmp://0.0.0.0:${this.port}/${RTMP_APP_NAME}`;
  }

  /** Get the first non-internal IPv4 address */
  private getLocalIp(): string | null {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return null;
  }

  /** Stream key to display in UI (for OBS Stream Key field) */
  getIngestStreamKey(): string {
    return RTMP_STREAM_KEY;
  }

  /** HTTP-FLV URL for live preview in renderer */
  getHttpFlvUrl(): string {
    if (this._currentStreamPath) {
      return `http://localhost:${this.httpPort}${this._currentStreamPath}.flv`;
    }
    return `http://localhost:${this.httpPort}/${RTMP_APP_NAME}/${RTMP_STREAM_KEY}.flv`;
  }

  private startStatsPolling(): void {
    this.stopStatsPolling();
    // Wait a moment for stream metadata to populate in NMS
    setTimeout(() => {
      this.fetchStats();
      this._statsInterval = setInterval(() => this.fetchStats(), 2000);
    }, 1500);
  }

  private stopStatsPolling(): void {
    if (this._statsInterval) {
      clearInterval(this._statsInterval);
      this._statsInterval = undefined;
    }
  }

  private fetchStats(): void {
    if (!this._ingestStatus.connected) return;

    const req = http.get(`http://localhost:${this.httpPort}/api/streams`, (res) => {
      let body = '';
      res.on('data', (chunk: string) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          this.parseApiStats(json);
        } catch {
          // ignore parse errors
        }
      });
    });
    req.on('error', () => {}); // ignore network errors
    req.setTimeout(2000, () => req.destroy());
  }

  private parseApiStats(data: any): void {
    try {
      // NMS API returns nested structure: { "<app>": { "<stream>": { publisher: {...} } } }
      // Try the current stream path first, fall back to defaults
      const pathParts = this._currentStreamPath?.split('/').filter(Boolean) || [RTMP_APP_NAME, RTMP_STREAM_KEY];
      const appName = pathParts[0] || RTMP_APP_NAME;
      const streamKey = pathParts[1] || RTMP_STREAM_KEY;

      const app = data?.[appName];
      if (!app) return;

      const stream = app?.[streamKey];
      if (!stream?.publisher) return;

      const pub = stream.publisher;
      const video = pub.video;
      const audio = pub.audio;

      // Calculate bitrate from bytes delta
      const now = Date.now();
      const bytes = pub.bytes || 0;
      let bitrate = this._ingestStatus.bitrate || 0;

      if (this._prevBytes > 0 && this._prevBytesTime > 0) {
        const deltaBytes = bytes - this._prevBytes;
        const deltaSeconds = (now - this._prevBytesTime) / 1000;
        if (deltaSeconds > 0 && deltaBytes >= 0) {
          bitrate = Math.round((deltaBytes * 8) / (deltaSeconds * 1000)); // kbps
        }
      }
      this._prevBytes = bytes;
      this._prevBytesTime = now;

      const uptime = Math.floor((Date.now() - this._connectTime) / 1000);

      this._ingestStatus = {
        connected: true,
        clientIp: this._ingestStatus.clientIp,
        codec: video?.codec || undefined,
        fps: video?.fps || undefined,
        resolution: video?.width && video?.height ? `${video.width}x${video.height}` : undefined,
        bitrate,
        audioCodec: audio?.codec || undefined,
        audioChannels: audio?.channels || undefined,
        sampleRate: audio?.samplerate || undefined,
        uptime,
        previewUrl: this.getHttpFlvUrl(),
      };

      this.emit('ingestStatsUpdated', this._ingestStatus);
    } catch {
      // ignore
    }
  }
}
