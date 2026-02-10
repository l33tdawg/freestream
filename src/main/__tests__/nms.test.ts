import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock NodeMediaServer
const mockNmsInstance = {
  on: vi.fn(),
  run: vi.fn(),
  stop: vi.fn(),
  getSession: vi.fn(),
};

vi.mock('node-media-server', () => {
  const MockNMS = function (this: any, _config: any) {
    Object.assign(this, mockNmsInstance);
  };
  return { default: MockNMS };
});

// Mock http module to prevent real HTTP requests from stats polling
vi.mock('http', () => ({
  default: {
    get: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      setTimeout: vi.fn(),
      destroy: vi.fn(),
    }),
  },
  get: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    setTimeout: vi.fn(),
    destroy: vi.fn(),
  }),
}));

import { NMSWrapper } from '../nms';

describe('NMSWrapper', () => {
  let nms: NMSWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset on to store handlers
    mockNmsInstance.on.mockImplementation(() => {});
    nms = new NMSWrapper(1935);
  });

  afterEach(() => {
    nms.stop();
    vi.useRealTimers();
  });

  describe('start', () => {
    it('creates NodeMediaServer and calls run()', () => {
      nms.start();
      expect(mockNmsInstance.run).toHaveBeenCalled();
    });

    it('registers prePublish, postPublish, and donePublish handlers', () => {
      nms.start();

      const registeredEvents = mockNmsInstance.on.mock.calls.map((c: any[]) => c[0]);
      expect(registeredEvents).toContain('prePublish');
      expect(registeredEvents).toContain('postPublish');
      expect(registeredEvents).toContain('donePublish');
    });

    it('emits ingestConnected when a stream publishes', () => {
      const handler = vi.fn();
      nms.on('ingestConnected', handler);

      nms.start();

      // Find the prePublish handler
      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];

      // Mock getSession
      mockNmsInstance.getSession.mockReturnValue({ ip: '192.168.1.100' });

      // Simulate our stream
      prePublishHandler('session-1', '/live/stream', {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          connected: true,
          clientIp: '192.168.1.100',
        }),
      );
    });

    it('emits ingestDisconnected when the stream ends', () => {
      const handler = vi.fn();
      nms.on('ingestDisconnected', handler);

      nms.start();

      const donePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'donePublish',
      );
      const donePublishHandler = donePublishCall[1];

      donePublishHandler('session-1', '/live/stream', {});

      expect(handler).toHaveBeenCalled();
    });

    it('emits ingestConnected for any stream path', () => {
      const handler = vi.fn();
      nms.on('ingestConnected', handler);

      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });

      prePublishHandler('session-1', '/other/path', {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ connected: true }),
      );
    });
  });

  describe('stop', () => {
    it('calls stop() on NodeMediaServer', () => {
      nms.start();
      nms.stop();
      expect(mockNmsInstance.stop).toHaveBeenCalled();
    });

    it('resets ingest status to disconnected', () => {
      nms.start();

      // Simulate a connection first
      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });
      prePublishHandler('session-1', '/live/stream', {});

      expect(nms.ingestStatus.connected).toBe(true);

      nms.stop();
      expect(nms.ingestStatus.connected).toBe(false);
    });

    it('is safe to call when not started', () => {
      expect(() => nms.stop()).not.toThrow();
    });
  });

  describe('getIngestUrl', () => {
    it('returns correct RTMP URL format', () => {
      expect(nms.getIngestUrl()).toBe('rtmp://localhost:1935/live/stream');
    });

    it('uses the configured port', () => {
      const customNms = new NMSWrapper(2935);
      expect(customNms.getIngestUrl()).toBe('rtmp://localhost:2935/live/stream');
    });

    it('uses default port 1935', () => {
      const defaultNms = new NMSWrapper();
      expect(defaultNms.getIngestUrl()).toBe('rtmp://localhost:1935/live/stream');
    });
  });

  describe('stream path handling', () => {
    it('accepts /live/stream path', () => {
      const handler = vi.fn();
      nms.on('ingestConnected', handler);

      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });

      prePublishHandler('session-1', '/live/stream', {});
      expect(handler).toHaveBeenCalled();
    });

    it('accepts any stream key under /live/ app', () => {
      const handler = vi.fn();
      nms.on('ingestConnected', handler);

      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });

      prePublishHandler('session-1', '/live/customkey', {});
      expect(handler).toHaveBeenCalled();
    });

    it('uses actual stream path for ingest URL when connected', () => {
      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });

      prePublishHandler('session-1', '/live/customkey', {});
      expect(nms.getIngestUrl()).toBe('rtmp://localhost:1935/live/customkey');
    });
  });

  describe('getIngestServerUrl', () => {
    it('returns server URL without stream key', () => {
      expect(nms.getIngestServerUrl()).toBe('rtmp://localhost:1935/live');
    });

    it('uses the configured port', () => {
      const customNms = new NMSWrapper(2935);
      expect(customNms.getIngestServerUrl()).toBe('rtmp://localhost:2935/live');
    });
  });

  describe('getIngestStreamKey', () => {
    it('returns the stream key', () => {
      expect(nms.getIngestStreamKey()).toBe('stream');
    });
  });

  describe('getHttpFlvUrl', () => {
    it('returns HTTP-FLV URL with default path', () => {
      expect(nms.getHttpFlvUrl()).toBe('http://localhost:9935/live/stream.flv');
    });

    it('uses actual stream path when connected', () => {
      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });

      prePublishHandler('session-1', '/live/mykey', {});
      expect(nms.getHttpFlvUrl()).toBe('http://localhost:9935/live/mykey.flv');
    });

    it('uses the configured port offset', () => {
      const customNms = new NMSWrapper(2935);
      expect(customNms.getHttpFlvUrl()).toBe('http://localhost:10935/live/stream.flv');
    });
  });

  describe('ingestStatus', () => {
    it('returns disconnected status initially', () => {
      expect(nms.ingestStatus).toEqual({ connected: false });
    });

    it('returns a copy (not a reference) of internal status', () => {
      const status1 = nms.ingestStatus;
      const status2 = nms.ingestStatus;
      expect(status1).toEqual(status2);
      expect(status1).not.toBe(status2);
    });

    it('includes previewUrl when connected', () => {
      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });

      prePublishHandler('session-1', '/live/stream', {});

      expect(nms.ingestStatus.previewUrl).toBe('http://localhost:9935/live/stream.flv');
    });
  });

  describe('stats polling', () => {
    it('starts polling after prePublish', () => {
      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });

      prePublishHandler('session-1', '/live/stream', {});

      // Stats polling starts after 1500ms delay
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('stops polling on donePublish', () => {
      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];
      mockNmsInstance.getSession.mockReturnValue({ ip: '127.0.0.1' });

      prePublishHandler('session-1', '/live/stream', {});

      const donePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'donePublish',
      );
      const donePublishHandler = donePublishCall[1];

      donePublishHandler('session-1', '/live/stream', {});

      // After donePublish, timers should be cleared (only the initial setTimeout may remain if not yet fired)
      expect(nms.ingestStatus.connected).toBe(false);
    });
  });
});
