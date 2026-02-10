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
};

vi.mock('child_process', () => ({
  spawn: vi.fn(() => mockProc),
  execFile: vi.fn(),
}));

vi.mock('../config', () => ({
  getSettings: vi.fn(() => ({
    rtmpPort: 1935,
    ffmpegPath: '',
    autoReconnect: true,
    maxRetries: 5,
    minimizeToTray: true,
    startMinimized: false,
  })),
}));

vi.mock('../ffmpeg-detector', () => ({
  detectFfmpeg: vi.fn().mockResolvedValue('/usr/bin/ffmpeg'),
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
        autoReconnect: true,
        maxRetries: 0,
        minimizeToTray: true,
        startMinimized: false,
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
        autoReconnect: false,
        maxRetries: 5,
        minimizeToTray: true,
        startMinimized: false,
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
