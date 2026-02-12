import { ChildProcess, exec, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { AvailableEncoders, Destination, DestinationStatus, EncodingSettings, StreamStats } from '../shared/types';
import { getSettings } from './config';
import { RESOLUTION_MAP } from './constants';
import { detectFfmpeg, detectEncoders } from './ffmpeg-detector';
import { getStreamKey } from './secrets';

/** Ensure URL and stream key are joined with a `/` separator */
function buildStreamUrl(url: string, key: string): string {
  const trimmedUrl = url.endsWith('/') ? url : url + '/';
  return trimmedUrl + key;
}

interface FFmpegInstance {
  process: ChildProcess;
  destination: Destination;
  status: DestinationStatus;
  retryCount: number;
  retryTimer?: NodeJS.Timeout;
  startTime?: number;
  stopping?: boolean;
}

export class FFmpegManager extends EventEmitter {
  private instances: Map<string, FFmpegInstance> = new Map();
  private ffmpegPath: string = 'ffmpeg';
  private ingestUrl: string = '';
  private running: boolean = false;
  private availableEncoders: AvailableEncoders = { hardware: [], software: ['libx264'] };

  constructor() {
    super();
  }

  setIngestUrl(url: string): void {
    this.ingestUrl = url;
  }

  async initialize(): Promise<string | null> {
    const settings = getSettings();
    const detected = await detectFfmpeg(settings.ffmpegPath);
    if (detected) {
      this.ffmpegPath = detected;
      this.availableEncoders = await detectEncoders(detected);
      console.log('[FFmpeg] Available HW encoders:', this.availableEncoders.hardware.join(', ') || 'none');
    }
    return detected;
  }

  getAvailableEncoders(): AvailableEncoders {
    return this.availableEncoders;
  }

  /** Test a stream key by attempting a short FFmpeg connection */
  async testConnection(url: string, streamKey: string): Promise<{ success: boolean; error?: string }> {
    const fullUrl = buildStreamUrl(url, streamKey);

    return new Promise((resolve) => {
      const args = [
        '-f', 'lavfi', '-i', 'color=black:s=160x90:r=1',
        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
        '-t', '3',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-b:v', '100k',
        '-c:a', 'aac', '-ar', '44100',
        '-f', 'flv',
        fullUrl,
      ];

      let stderr = '';
      let resolved = false;
      let gotFrames = false;

      const proc = spawn(this.ffmpegPath, args, {
        stdio: ['ignore', 'ignore', 'pipe'],
      });

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          proc.kill('SIGKILL');
          // If we got this far without error, connection is working
          resolve({ success: true });
        }
      }, 8000);

      proc.stderr?.on('data', (data: Buffer) => {
        const line = data.toString();
        stderr += line;
        // If FFmpeg is outputting frame stats, the connection is live
        if (/frame=\s*\d+/.test(line)) {
          gotFrames = true;
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            proc.kill('SIGTERM');
            resolve({ success: true });
          }
        }
      });

      proc.on('close', (code) => {
        clearTimeout(timeout);
        if (resolved) return;
        resolved = true;

        if (gotFrames || code === 0) {
          resolve({ success: true });
        } else if (stderr.includes('Authorization') || stderr.includes('Unauthorized') ||
                   stderr.includes('403') || stderr.includes('NetStream.Publish.BadName') ||
                   stderr.includes('Authentication')) {
          resolve({ success: false, error: 'Authentication failed — check your stream key' });
        } else if (stderr.includes('Connection refused') || stderr.includes('Connection timed out') ||
                   stderr.includes('No route to host') || stderr.includes('getaddrinfo')) {
          resolve({ success: false, error: 'Could not reach server — check the RTMP URL' });
        } else if (stderr.includes('Input/output error')) {
          resolve({ success: false, error: 'Connection rejected — check that your stream key is correct' });
        } else {
          // Extract the most specific error line from FFmpeg (skip generic summary lines)
          const lines = stderr.split('\n').filter(l => l.trim());
          const specificLine = lines.find(l =>
            l.includes('Server error') || l.includes('NetStream') || l.includes('RTMP_')
          );
          const fallback = lines[lines.length - 1] || `FFmpeg exited with code ${code}`;
          resolve({ success: false, error: (specificLine || fallback).substring(0, 200) });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: `FFmpeg error: ${err.message}` });
        }
      });
    });
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

    const fullUrl = buildStreamUrl(destination.url, streamKey);
    this.spawnFFmpeg(destination, fullUrl, 0);
  }

  private spawnFFmpeg(destination: Destination, targetUrl: string, retryCount: number): void {
    const settings = getSettings();
    const buf = settings.bufferDuration || 0;

    const inputFlags: string[] = ['-rw_timeout', '5000000'];
    if (buf > 0) {
      const usec = Math.round(buf * 1000000);
      inputFlags.push(
        '-fflags', '+genpts+discardcorrupt',
        '-analyzeduration', String(usec),
        '-probesize', String(usec),
      );
    }

    const encodingArgs = this.buildOutputArgs(destination);

    const outputFlags: string[] = [
      ...encodingArgs,
      '-f', 'flv',
      '-flvflags', 'no_duration_filesize',
    ];
    if (buf > 0) {
      const usec = Math.round(buf * 1000000);
      outputFlags.push(
        '-max_muxing_queue_size', '1024',
        '-max_interleave_delta', String(usec),
      );
    }

    const args = [
      ...inputFlags,
      '-i', this.ingestUrl,
      ...outputFlags,
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
          cpuPercent: instance.status.cpuPercent,
        };
        this.emitStatus(destination.id, instance.status);
      }
    });

    proc.on('close', (code) => {
      console.log(`[FFmpeg] ${destination.name} exited with code ${code}`);

      if (!this.running) return;

      const inst = this.instances.get(destination.id);
      if (!inst || inst.stopping) return;

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
            this.spawnFFmpeg(destination, buildStreamUrl(destination.url, key), inst.retryCount + 1);
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

    instance.stopping = true;

    if (instance.retryTimer) {
      clearTimeout(instance.retryTimer);
    }

    // Process may already be dead (e.g. in retry delay)
    if (instance.process.exitCode !== null || instance.process.killed) {
      this.instances.delete(id);
      this.emitStatus(id, { id, health: 'idle' });
      return;
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

  async pollCpuUsage(): Promise<void> {
    const pids: { id: string; pid: number }[] = [];
    for (const [id, inst] of this.instances) {
      if (inst.process.pid) {
        pids.push({ id, pid: inst.process.pid });
      }
    }
    if (pids.length === 0) return;

    try {
      const pidList = pids.map((p) => p.pid).join(',');
      const output = await new Promise<string>((resolve, reject) => {
        exec(`ps -p ${pidList} -o pid=,%cpu=`, (err, stdout) => {
          if (err) reject(err);
          else resolve(stdout);
        });
      });
      for (const line of output.trim().split('\n')) {
        const match = line.trim().match(/^(\d+)\s+([\d.]+)/);
        if (match) {
          const pid = parseInt(match[1], 10);
          const cpu = parseFloat(match[2]);
          const entry = pids.find((p) => p.pid === pid);
          if (entry) {
            const inst = this.instances.get(entry.id);
            if (inst) {
              inst.status.cpuPercent = Math.round(cpu);
            }
          }
        }
      }
    } catch {
      // ps not available (Windows) — leave cpuPercent undefined
    }
  }

  private buildOutputArgs(destination: Destination): string[] {
    const enc = destination.encoding;
    if (!enc || enc.encoder === 'copy') {
      return ['-c', 'copy'];
    }

    const args: string[] = ['-c:v', enc.encoder];

    // Bitrate + rate control
    if (enc.bitrate) {
      const br = `${enc.bitrate}k`;
      const mode = enc.rateControl || 'cbr';
      if (mode === 'vbr') {
        args.push('-b:v', br, '-maxrate', `${Math.round(enc.bitrate * 1.5)}k`, '-bufsize', `${enc.bitrate * 2}k`);
      } else {
        // CBR: strict — bufsize = bitrate
        args.push('-b:v', br, '-maxrate', br, '-bufsize', `${enc.bitrate}k`);
      }
    }

    // libx264-specific flags
    if (enc.encoder === 'libx264') {
      args.push('-preset', enc.x264Preset || 'veryfast', '-tune', 'zerolatency');
    }

    // Resolution scale filter
    if (enc.resolution && enc.resolution !== 'source') {
      const dims = RESOLUTION_MAP[enc.resolution];
      if (dims) {
        args.push('-vf', `scale=${dims}`);
      }
    }

    // Frame rate
    if (enc.fps && enc.fps !== 'source') {
      args.push('-r', String(enc.fps));
    }

    // Keyframe interval
    if (enc.keyframeInterval && enc.keyframeInterval > 0) {
      if (enc.fps && enc.fps !== 'source') {
        // Explicit FPS: use -g (frames between keyframes)
        args.push('-g', String(Number(enc.fps) * enc.keyframeInterval));
      } else {
        // Source/unknown FPS: use time-based expression
        args.push('-force_key_frames', `expr:gte(t,n_forced*${enc.keyframeInterval})`);
      }
    }

    // Audio always passthrough
    args.push('-c:a', 'copy');

    return args;
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
