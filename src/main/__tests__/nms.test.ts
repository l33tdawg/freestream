import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { NMSWrapper } from '../nms';

describe('NMSWrapper', () => {
  let nms: NMSWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset on to store handlers
    mockNmsInstance.on.mockImplementation(() => {});
    nms = new NMSWrapper(1935);
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

    it('emits ingestConnected when our stream publishes', () => {
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

    it('emits ingestDisconnected when our stream ends', () => {
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

    it('does not emit events for other streams', () => {
      const handler = vi.fn();
      nms.on('ingestConnected', handler);

      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];

      prePublishHandler('session-1', '/other/path', {});

      expect(handler).not.toHaveBeenCalled();
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

  describe('isOurStream (via prePublish behavior)', () => {
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

    it('rejects /live/other path', () => {
      const handler = vi.fn();
      nms.on('ingestConnected', handler);

      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];

      prePublishHandler('session-1', '/live/other', {});
      expect(handler).not.toHaveBeenCalled();
    });

    it('rejects /other/stream path', () => {
      const handler = vi.fn();
      nms.on('ingestConnected', handler);

      nms.start();

      const prePublishCall = mockNmsInstance.on.mock.calls.find(
        (c: any[]) => c[0] === 'prePublish',
      );
      const prePublishHandler = prePublishCall[1];

      prePublishHandler('session-1', '/other/stream', {});
      expect(handler).not.toHaveBeenCalled();
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
  });
});
