import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { Destination, DestinationStatus, StreamStats } from '../shared/types';
import { getSettings } from './config';
import { detectFfmpeg } from './ffmpeg-detector';
import { getStreamKey } from './secrets';

interface FFmpegInstance {
  process: ChildProcess;
  destination: Destination;
  status: DestinationStatus;
  retryCount: number;
  retryTimer?: NodeJS.Timeout;
  startTime?: number;
}

export class FFmpegManager extends EventEmitter {
  private instances: Map<string, FFmpegInstance> = new Map();
  private ffmpegPath: string = 'ffmpeg';
  private ingestUrl: string;
  private running: boolean = false;

  constructor(ingestUrl: string) {
    super();
    this.ingestUrl = ingestUrl;
  }

  async initialize(): Promise<string | null> {
    const settings = getSettings();
    const detected = await detectFfmpeg(settings.ffmpegPath);
    if (detected) {
      this.ffmpegPath = detected;
    }
    return detected;
  }

  async startDestination(destination: Destination): Promise<void> {
    if (this.instances.has(destination.id)) {
      await this.stopDestination(destination.id);
    }

    const streamKey = await getStreamKey(destination.id);
    if (!streamKey) {
      this.emitStatus(destination.id, {
        id: destination.id,
        health: 'error',
        error: 'No stream key configured',
      });
      return;
    }

    const fullUrl = destination.url + streamKey;
    this.spawnFFmpeg(destination, fullUrl, 0);
  }

  private spawnFFmpeg(destination: Destination, targetUrl: string, retryCount: number): void {
    const args = [
      '-rw_timeout', '5000000',
      '-i', this.ingestUrl,
      '-c', 'copy',
      '-f', 'flv',
      '-flvflags', 'no_duration_filesize',
      targetUrl,
    ];

    console.log(`[FFmpeg] Starting for ${destination.name} (attempt ${retryCount + 1})`);

    const proc = spawn(this.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const instance: FFmpegInstance = {
      process: proc,
      destination,
      status: {
        id: destination.id,
        health: 'connecting',
        retryCount,
      },
      retryCount,
      startTime: Date.now(),
    };

    this.instances.set(destination.id, instance);
    this.emitStatus(destination.id, instance.status);

    let hasGoneConnected = false;

    proc.stderr?.on('data', (data: Buffer) => {
      const line = data.toString();

      const stats = this.parseStats(line);
      if (stats) {
        if (!hasGoneConnected) {
          hasGoneConnected = true;
          instance.startTime = Date.now();
        }
        instance.status = {
          id: destination.id,
          health: 'live',
          bitrate: stats.bitrate,
          fps: stats.fps,
          uptime: instance.startTime ? Math.floor((Date.now() - instance.startTime) / 1000) : 0,
          retryCount: instance.retryCount,
        };
        this.emitStatus(destination.id, instance.status);
      }
    });

    proc.on('close', (code) => {
      console.log(`[FFmpeg] ${destination.name} exited with code ${code}`);

      if (!this.running) return;

      const inst = this.instances.get(destination.id);
      if (!inst) return;

      const settings = getSettings();
      if (settings.autoReconnect && inst.retryCount < settings.maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, inst.retryCount), 60000);
        console.log(`[FFmpeg] Retrying ${destination.name} in ${delay}ms`);

        this.emitStatus(destination.id, {
          id: destination.id,
          health: 'retrying',
          retryCount: inst.retryCount + 1,
          error: `Disconnected (exit code ${code}). Retrying...`,
        });

        inst.retryTimer = setTimeout(async () => {
          const key = await getStreamKey(destination.id);
          if (key && this.running) {
            this.spawnFFmpeg(destination, destination.url + key, inst.retryCount + 1);
          }
        }, delay);
      } else {
        this.emitStatus(destination.id, {
          id: destination.id,
          health: 'error',
          error: `Disconnected (exit code ${code}). Max retries reached.`,
          retryCount: inst.retryCount,
        });
        this.instances.delete(destination.id);
      }
    });

    proc.on('error', (err) => {
      console.error(`[FFmpeg] Process error for ${destination.name}:`, err.message);
      this.emitStatus(destination.id, {
        id: destination.id,
        health: 'error',
        error: err.message,
      });
    });
  }

  async stopDestination(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) return;

    if (instance.retryTimer) {
      clearTimeout(instance.retryTimer);
    }

    instance.process.kill('SIGTERM');

    // Give it a moment to terminate gracefully
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        instance.process.kill('SIGKILL');
        resolve();
      }, 3000);

      instance.process.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    this.instances.delete(id);
    this.emitStatus(id, { id, health: 'idle' });
  }

  async startAll(destinations: Destination[]): Promise<void> {
    this.running = true;
    const enabled = destinations.filter((d) => d.enabled);
    await Promise.all(enabled.map((d) => this.startDestination(d)));
  }

  async stopAll(): Promise<void> {
    this.running = false;
    const ids = Array.from(this.instances.keys());
    await Promise.all(ids.map((id) => this.stopDestination(id)));
  }

  getStatus(id: string): DestinationStatus | null {
    return this.instances.get(id)?.status || null;
  }

  getAllStatuses(): DestinationStatus[] {
    return Array.from(this.instances.values()).map((i) => i.status);
  }

  isRunning(): boolean {
    return this.running;
  }

  private parseStats(line: string): StreamStats | null {
    // FFmpeg outputs stats like:
    // frame= 1234 fps=30.0 q=-1.0 size= 5632kB time=00:00:41.23 bitrate=1119.1kbits/s speed=1.00x
    const frameMatch = line.match(/frame=\s*(\d+)/);
    const fpsMatch = line.match(/fps=\s*([\d.]+)/);
    const sizeMatch = line.match(/size=\s*(\S+)/);
    const timeMatch = line.match(/time=\s*([\d:.]+)/);
    const bitrateMatch = line.match(/bitrate=\s*([\d.]+)kbits/);
    const speedMatch = line.match(/speed=\s*([\d.]+)x/);

    if (!frameMatch) return null;

    return {
      frame: parseInt(frameMatch[1], 10),
      fps: fpsMatch ? parseFloat(fpsMatch[1]) : 0,
      size: sizeMatch ? sizeMatch[1] : '0kB',
      time: timeMatch ? timeMatch[1] : '00:00:00.00',
      bitrate: bitrateMatch ? parseFloat(bitrateMatch[1]) : 0,
      speed: speedMatch ? parseFloat(speedMatch[1]) : 0,
    };
  }

  private emitStatus(id: string, status: DestinationStatus): void {
    this.emit('statusChanged', status);
  }
}
