import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import type { Destination, DestinationStatus } from '../../shared/types';

// Mock child_process
const mockProc = {
  stderr: new EventEmitter(),
  stdout: new EventEmitter(),
  on: vi.fn(),
  kill: vi.fn(),
  pid: 12345,
  exitCode: null as number | null,
  killed: false,
};

vi.mock('child_process', () => ({
  spawn: vi.fn(() => mockProc),
  execFile: vi.fn(),
}));

vi.mock('../config', () => ({
  getSettings: vi.fn(() => ({
    rtmpPort: 1935,
    ffmpegPath: '',
    bufferDuration: 0,
    autoReconnect: true,
    maxRetries: 5,
    minimizeToTray: true,
    startMinimized: false,
  })),
}));

vi.mock('../ffmpeg-detector', () => ({
  detectFfmpeg: vi.fn().mockResolvedValue('/usr/bin/ffmpeg'),
  detectEncoders: vi.fn().mockResolvedValue({ hardware: ['h264_videotoolbox'], software: ['libx264'] }),
}));

vi.mock('../secrets', () => ({
  getStreamKey: vi.fn().mockResolvedValue('test-stream-key'),
}));

import { FFmpegManager } from '../ffmpeg-manager';
import { spawn } from 'child_process';
import { getStreamKey } from '../secrets';
import { getSettings } from '../config';

describe('FFmpegManager', () => {
  let manager: FFmpegManager;
  const ingestUrl = 'rtmp://localhost:1935/live/stream';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset mock process
    mockProc.stderr = new EventEmitter();
    mockProc.stdout = new EventEmitter();
    mockProc.on = vi.fn();
    mockProc.kill = vi.fn();
    mockProc.exitCode = null;
    mockProc.killed = false;

    manager = new FFmpegManager();
    manager.setIngestUrl(ingestUrl);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parseStats', () => {
    it('extracts frame, fps, bitrate from FFmpeg output', () => {
      // Access private method via prototype
      const parseStats = (manager as any).parseStats.bind(manager);

      const line =
        'frame= 1234 fps=30.0 q=-1.0 size= 5632kB time=00:00:41.23 bitrate=1119.1kbits/s speed=1.00x';
      const stats = parseStats(line);

      expect(stats).not.toBeNull();
      expect(stats.frame).toBe(1234);
      expect(stats.fps).toBe(30.0);
      expect(stats.size).toBe('5632kB');
      expect(stats.time).toBe('00:00:41.23');
      expect(stats.bitrate).toBe(1119.1);
      expect(stats.speed).toBe(1.0);
    });

    it('returns null for non-stats lines', () => {
      const parseStats = (manager as any).parseStats.bind(manager);

      expect(parseStats('ffmpeg version 6.0')).toBeNull();
      expect(parseStats('Input #0, flv, from')).toBeNull();
      expect(parseStats('')).toBeNull();
    });

    it('handles partial stats (only frame)', () => {
      const parseStats = (manager as any).parseStats.bind(manager);

      const line = 'frame= 100 fps=0.0 q=0.0 size= 0kB time=00:00:00.00 bitrate=N/A speed=N/A';
      const stats = parseStats(line);

      expect(stats).not.toBeNull();
      expect(stats.frame).toBe(100);
      expect(stats.fps).toBe(0);
      expect(stats.bitrate).toBe(0);
      expect(stats.speed).toBe(0);
    });
  });

  describe('buildOutputArgs', () => {
    const baseDest: Destination = {
      id: 'dest-1',
      platform: 'twitch',
      name: 'Twitch',
      url: 'rtmp://live.twitch.tv/app/',
      enabled: true,
      createdAt: 1000,
    };

    it('returns passthrough when no encoding settings', () => {
      const buildOutputArgs = (manager as any).buildOutputArgs.bind(manager);
      const args = buildOutputArgs(baseDest);
      expect(args).toEqual(['-c', 'copy']);
    });

    it('returns passthrough when encoder is copy', () => {
      const buildOutputArgs = (manager as any).buildOutputArgs.bind(manager);
      const dest = { ...baseDest, encoding: { encoder: 'copy' as const } };
      const args = buildOutputArgs(dest);
      expect(args).toEqual(['-c', 'copy']);
    });

    it('builds HW encoder args without preset flags', () => {
      const buildOutputArgs = (manager as any).buildOutputArgs.bind(manager);
      const dest = {
        ...baseDest,
        encoding: {
          encoder: 'h264_videotoolbox' as const,
          bitrate: 4000,
          resolution: '720p' as const,
          fps: 30,
        },
      };
      const args = buildOutputArgs(dest);

      expect(args).toContain('-c:v');
      expect(args).toContain('h264_videotoolbox');
      expect(args).toContain('-b:v');
      expect(args).toContain('4000k');
      expect(args).toContain('-vf');
      expect(args).toContain('scale=1280:720');
      expect(args).toContain('-r');
      expect(args).toContain('30');
      expect(args).toContain('-c:a');
      expect(args).toContain('copy');
      // No preset or tune flags for HW encoder
      expect(args).not.toContain('-preset');
      expect(args).not.toContain('-tune');
    });

    it('builds libx264 args with preset and tune', () => {
      const buildOutputArgs = (manager as any).buildOutputArgs.bind(manager);
      const dest = {
        ...baseDest,
        encoding: {
          encoder: 'libx264' as const,
          bitrate: 3500,
          resolution: '720p' as const,
          fps: 30,
          x264Preset: 'veryfast' as const,
        },
      };
      const args = buildOutputArgs(dest);

      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('-preset');
      expect(args).toContain('veryfast');
      expect(args).toContain('-tune');
      expect(args).toContain('zerolatency');
      expect(args).toContain('-b:v');
      expect(args).toContain('3500k');
      expect(args).toContain('-vf');
      expect(args).toContain('scale=1280:720');
      expect(args).toContain('-r');
      expect(args).toContain('30');
    });

    it('audio always copies', () => {
      const buildOutputArgs = (manager as any).buildOutputArgs.bind(manager);
      const dest = {
        ...baseDest,
        encoding: {
          encoder: 'h264_nvenc' as const,
          bitrate: 6000,
        },
      };
      const args = buildOutputArgs(dest);
      const caIdx = args.indexOf('-c:a');
      expect(caIdx).toBeGreaterThan(-1);
      expect(args[caIdx + 1]).toBe('copy');
    });

    it('skips resolution filter when set to source', () => {
      const buildOutputArgs = (manager as any).buildOutputArgs.bind(manager);
      const dest = {
        ...baseDest,
        encoding: {
          encoder: 'h264_videotoolbox' as const,
          resolution: 'source' as const,
        },
      };
      const args = buildOutputArgs(dest);
      expect(args).not.toContain('-vf');
    });

    it('skips fps when set to source', () => {
      const buildOutputArgs = (manager as any).buildOutputArgs.bind(manager);
      const dest = {
        ...baseDest,
        encoding: {
          encoder: 'h264_videotoolbox' as const,
          fps: 'source' as const,
        },
      };
      const args = buildOutputArgs(dest);
      expect(args).not.toContain('-r');
    });
  });

  describe('initialize', () => {
    it('detects ffmpeg path', async () => {
      const result = await manager.initialize();
      expect(result).toBe('/usr/bin/ffmpeg');
    });
  });

  describe('startDestination', () => {
    const destination: Destination = {
      id: 'dest-1',
      platform: 'twitch',
      name: 'Twitch',
      url: 'rtmp://live.twitch.tv/app/',
      enabled: true,
      createdAt: 1000,
    };

    it('spawns ffmpeg with correct arguments', async () => {
      await manager.startDestination(destination);

      expect(spawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining([
          '-i',
          ingestUrl,
          '-c',
          'copy',
          '-f',
          'flv',
          'rtmp://live.twitch.tv/app/test-stream-key',
        ]),
        expect.objectContaining({
          stdio: ['ignore', 'pipe', 'pipe'],
        }),
      );
    });

    it('emits error status when no stream key is configured', async () => {
      vi.mocked(getStreamKey).mockResolvedValueOnce(null);

      const statusHandler = vi.fn();
      manager.on('statusChanged', statusHandler);

      await manager.startDestination(destination);

      expect(statusHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dest-1',
          health: 'error',
          error: 'No stream key configured',
        }),
      );
    });

    it('spawns ffmpeg with encoding args when encoding is set', async () => {
      const encodedDest: Destination = {
        ...destination,
        encoding: {
          encoder: 'h264_videotoolbox',
          bitrate: 3500,
          resolution: '720p',
          fps: 30,
        },
      };

      await manager.startDestination(encodedDest);

      const args = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(args).toContain('-c:v');
      expect(args).toContain('h264_videotoolbox');
      expect(args).toContain('-b:v');
      expect(args).toContain('3500k');
      expect(args).not.toContain('-c');  // should not have plain '-c copy'
    });

    it('emits connecting status when process starts', async () => {
      const statusHandler = vi.fn();
      manager.on('statusChanged', statusHandler);

      await manager.startDestination(destination);

      expect(statusHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dest-1',
          health: 'connecting',
        }),
      );
    });
  });

  describe('buffer duration flags', () => {
    const destination: Destination = {
      id: 'dest-1',
      platform: 'twitch',
      name: 'Twitch',
      url: 'rtmp://live.twitch.tv/app/',
      enabled: true,
      createdAt: 1000,
    };

    it('does not inject buffer flags when bufferDuration is 0', async () => {
      vi.mocked(getSettings).mockReturnValue({
        rtmpPort: 1935,
        ffmpegPath: '',
        bufferDuration: 0,
        autoReconnect: true,
        maxRetries: 5,
        minimizeToTray: true,
        startMinimized: false,
        theme: 'dark',
      });

      await manager.startDestination(destination);

      const args = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(args).not.toContain('-fflags');
      expect(args).not.toContain('-analyzeduration');
      expect(args).not.toContain('-probesize');
      expect(args).not.toContain('-max_muxing_queue_size');
      expect(args).not.toContain('-max_interleave_delta');
    });

    it('injects input-side buffer flags when bufferDuration > 0', async () => {
      vi.mocked(getSettings).mockReturnValue({
        rtmpPort: 1935,
        ffmpegPath: '',
        bufferDuration: 2,
        autoReconnect: true,
        maxRetries: 5,
        minimizeToTray: true,
        startMinimized: false,
        theme: 'dark',
      });

      await manager.startDestination(destination);

      const args = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(args).toContain('-fflags');
      expect(args).toContain('+genpts');
      expect(args).toContain('-analyzeduration');
      expect(args).toContain('2000000');
      expect(args).toContain('-probesize');
    });

    it('injects output-side buffer flags when bufferDuration > 0', async () => {
      vi.mocked(getSettings).mockReturnValue({
        rtmpPort: 1935,
        ffmpegPath: '',
        bufferDuration: 1.5,
        autoReconnect: true,
        maxRetries: 5,
        minimizeToTray: true,
        startMinimized: false,
        theme: 'dark',
      });

      await manager.startDestination(destination);

      const args = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(args).toContain('-max_muxing_queue_size');
      expect(args).toContain('4096');
    });

    it('places buffer input flags before -i and output flags after -c copy', async () => {
      vi.mocked(getSettings).mockReturnValue({
        rtmpPort: 1935,
        ffmpegPath: '',
        bufferDuration: 2,
        autoReconnect: true,
        maxRetries: 5,
        minimizeToTray: true,
        startMinimized: false,
        theme: 'dark',
      });

      await manager.startDestination(destination);

      const args = vi.mocked(spawn).mock.calls[0][1] as string[];
      const iIndex = args.indexOf('-i');
      const fflagsIndex = args.indexOf('-fflags');
      const maxMuxIndex = args.indexOf('-max_muxing_queue_size');
      const cIndex = args.indexOf('-c');

      // Input flags before -i
      expect(fflagsIndex).toBeLessThan(iIndex);
      // Output flags after -c copy
      expect(maxMuxIndex).toBeGreaterThan(cIndex);
    });
  });

  describe('stopDestination', () => {
    const destination: Destination = {
      id: 'dest-1',
      platform: 'twitch',
      name: 'Twitch',
      url: 'rtmp://live.twitch.tv/app/',
      enabled: true,
      createdAt: 1000,
    };

    it('sends SIGTERM to the process', async () => {
      // Set up the mock process to immediately emit 'close' on kill
      mockProc.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'close') {
          // Schedule the close callback
          setTimeout(() => handler(0), 10);
        }
        return mockProc;
      });

      await manager.startDestination(destination);

      const stopPromise = manager.stopDestination('dest-1');
      vi.advanceTimersByTime(100);
      await stopPromise;

      expect(mockProc.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('does nothing for non-existent destination', async () => {
      await manager.stopDestination('nonexistent');
      expect(mockProc.kill).not.toHaveBeenCalled();
    });

    it('emits idle status after stopping', async () => {
      mockProc.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'close') {
          setTimeout(() => handler(0), 10);
        }
        return mockProc;
      });

      await manager.startDestination(destination);

      const statusHandler = vi.fn();
      manager.on('statusChanged', statusHandler);

      const stopPromise = manager.stopDestination('dest-1');
      vi.advanceTimersByTime(100);
      await stopPromise;

      expect(statusHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dest-1',
          health: 'idle',
        }),
      );
    });
  });

  describe('stopAll', () => {
    it('sets running to false', async () => {
      await manager.stopAll();
      expect(manager.isRunning()).toBe(false);
    });
  });

  describe('startAll', () => {
    it('sets running to true and starts enabled destinations', async () => {
      const destinations: Destination[] = [
        {
          id: 'dest-1',
          platform: 'twitch',
          name: 'Twitch',
          url: 'rtmp://live.twitch.tv/app/',
          enabled: true,
          createdAt: 1000,
        },
        {
          id: 'dest-2',
          platform: 'youtube',
          name: 'YouTube',
          url: 'rtmp://a.rtmp.youtube.com/live2/',
          enabled: false,
          createdAt: 2000,
        },
      ];

      await manager.startAll(destinations);

      expect(manager.isRunning()).toBe(true);
      // Only the enabled destination should have spawned
      expect(spawn).toHaveBeenCalledTimes(1);
    });
  });

  describe('status tracking', () => {
    it('getStatus returns null for unknown destination', () => {
      expect(manager.getStatus('nonexistent')).toBeNull();
    });

    it('getAllStatuses returns empty array initially', () => {
      expect(manager.getAllStatuses()).toEqual([]);
    });

    it('getStatus returns status after starting a destination', async () => {
      const destination: Destination = {
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      };

      await manager.startDestination(destination);

      const status = manager.getStatus('dest-1');
      expect(status).not.toBeNull();
      expect(status!.id).toBe('dest-1');
      expect(status!.health).toBe('connecting');
    });
  });

  describe('reconnect logic', () => {
    it('retries on process close when autoReconnect is enabled and running', async () => {
      const destination: Destination = {
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      };

      let closeHandler: Function | null = null;
      mockProc.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'close') {
          closeHandler = handler;
        }
        return mockProc;
      });

      // Start the destination
      (manager as any).running = true;
      await manager.startDestination(destination);

      // Simulate close
      const statusHandler = vi.fn();
      manager.on('statusChanged', statusHandler);

      if (closeHandler) {
        closeHandler(1);
      }

      // Should emit retrying status
      expect(statusHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dest-1',
          health: 'retrying',
        }),
      );
    });

    it('emits error when max retries reached', async () => {
      vi.mocked(getSettings).mockReturnValue({
        rtmpPort: 1935,
        ffmpegPath: '',
        bufferDuration: 0,
        autoReconnect: true,
        maxRetries: 0,
        minimizeToTray: true,
        startMinimized: false,
        theme: 'dark',
      });

      const destination: Destination = {
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      };

      let closeHandler: Function | null = null;
      mockProc.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'close') {
          closeHandler = handler;
        }
        return mockProc;
      });

      (manager as any).running = true;
      await manager.startDestination(destination);

      const statusHandler = vi.fn();
      manager.on('statusChanged', statusHandler);

      if (closeHandler) {
        closeHandler(1);
      }

      expect(statusHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dest-1',
          health: 'error',
          error: expect.stringContaining('Max retries reached'),
        }),
      );
    });

    it('does not retry when autoReconnect is disabled', async () => {
      vi.mocked(getSettings).mockReturnValue({
        rtmpPort: 1935,
        ffmpegPath: '',
        bufferDuration: 0,
        autoReconnect: false,
        maxRetries: 5,
        minimizeToTray: true,
        startMinimized: false,
        theme: 'dark',
      });

      const destination: Destination = {
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      };

      let closeHandler: Function | null = null;
      mockProc.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'close') {
          closeHandler = handler;
        }
        return mockProc;
      });

      (manager as any).running = true;
      await manager.startDestination(destination);

      const statusHandler = vi.fn();
      manager.on('statusChanged', statusHandler);

      if (closeHandler) {
        closeHandler(1);
      }

      expect(statusHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dest-1',
          health: 'error',
        }),
      );
    });
  });

  describe('isRunning', () => {
    it('returns false initially', () => {
      expect(manager.isRunning()).toBe(false);
    });
  });
});
