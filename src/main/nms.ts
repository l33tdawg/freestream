import NodeMediaServer from 'node-media-server';
import { EventEmitter } from 'events';
import { IngestStatus } from '../shared/types';
import { RTMP_APP_NAME } from './constants';

export class NMSWrapper extends EventEmitter {
  private nms: any = null;
  private port: number;
  private _ingestStatus: IngestStatus = { connected: false };

  constructor(port: number = 1935) {
    super();
    this.port = port;
  }

  get ingestStatus(): IngestStatus {
    return { ...this._ingestStatus };
  }

  start(): void {
    const config = {
      logType: 0, // quiet
      rtmp: {
        port: this.port,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: this.port + 8000, // e.g. 9935 — NMS HTTP API
        allow_origin: '*',
      },
    };

    this.nms = new NodeMediaServer(config);

    this.nms.on('prePublish', (id: string, streamPath: string, args: any) => {
      console.log(`[NMS] prePublish: ${streamPath} from session ${id}`);
      if (this.isOurStream(streamPath)) {
        const session = this.nms.getSession(id);
        this._ingestStatus = {
          connected: true,
          clientIp: session?.ip || 'unknown',
        };
        this.emit('ingestConnected', this._ingestStatus);
      }
    });

    this.nms.on('postPublish', (id: string, streamPath: string, args: any) => {
      console.log(`[NMS] postPublish: ${streamPath}`);
    });

    this.nms.on('donePublish', (id: string, streamPath: string, args: any) => {
      console.log(`[NMS] donePublish: ${streamPath}`);
      if (this.isOurStream(streamPath)) {
        this._ingestStatus = { connected: false };
        this.emit('ingestDisconnected');
      }
    });

    this.nms.run();
    console.log(`[NMS] RTMP server started on port ${this.port}`);
  }

  stop(): void {
    if (this.nms) {
      this.nms.stop();
      this.nms = null;
      this._ingestStatus = { connected: false };
      console.log('[NMS] RTMP server stopped');
    }
  }

  getIngestUrl(): string {
    return `rtmp://localhost:${this.port}/${RTMP_APP_NAME}/stream`;
  }

  private isOurStream(streamPath: string): boolean {
    return streamPath === `/${RTMP_APP_NAME}/stream`;
  }
}
