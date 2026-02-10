import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import type { IngestStatus, DestinationStatus } from '../../shared/types';

import { StreamMonitor } from '../stream-monitor';

describe('StreamMonitor', () => {
  let mockNms: EventEmitter & { ingestStatus: IngestStatus };
  let mockFfmpegManager: EventEmitter & { getAllStatuses: () => DestinationStatus[] };
  let monitor: StreamMonitor;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create mock NMS
    const nmsEmitter = new EventEmitter();
    mockNms = Object.assign(nmsEmitter, {
      ingestStatus: { connected: false } as IngestStatus,
    });

    // Create mock FFmpegManager
    const ffmpegEmitter = new EventEmitter();
    mockFfmpegManager = Object.assign(ffmpegEmitter, {
      getAllStatuses: vi.fn().mockReturnValue([]),
    });

    monitor = new StreamMonitor(mockNms as any, mockFfmpegManager as any);
  });

  afterEach(() => {
    monitor.stopPolling();
    vi.useRealTimers();
  });

  describe('event forwarding', () => {
    it('forwards NMS ingestConnected events as ingestStatusChanged', () => {
      const handler = vi.fn();
      monitor.on('ingestStatusChanged', handler);

      const status: IngestStatus = { connected: true, clientIp: '192.168.1.1' };
      mockNms.emit('ingestConnected', status);

      expect(handler).toHaveBeenCalledWith(status);
    });

    it('forwards NMS ingestDisconnected events as ingestStatusChanged with connected=false', () => {
      const handler = vi.fn();
      monitor.on('ingestStatusChanged', handler);

      mockNms.emit('ingestDisconnected');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ connected: false }),
      );
    });

    it('forwards FFmpegManager statusChanged events as destinationStatusChanged', () => {
      const handler = vi.fn();
      monitor.on('destinationStatusChanged', handler);

      const status: DestinationStatus = { id: 'dest-1', health: 'live', bitrate: 2500, fps: 30 };
      mockFfmpegManager.emit('statusChanged', status);

      expect(handler).toHaveBeenCalledWith(status);
    });
  });

  describe('getIngestStatus', () => {
    it('returns NMS ingest status', () => {
      mockNms.ingestStatus = { connected: true, clientIp: '10.0.0.1' };
      const status = monitor.getIngestStatus();
      expect(status).toEqual({ connected: true, clientIp: '10.0.0.1' });
    });

    it('returns disconnected status initially', () => {
      const status = monitor.getIngestStatus();
      expect(status.connected).toBe(false);
    });
  });

  describe('getDestinationStatuses', () => {
    it('returns statuses from FFmpegManager', () => {
      const statuses: DestinationStatus[] = [
        { id: 'dest-1', health: 'live', bitrate: 2500 },
        { id: 'dest-2', health: 'connecting' },
      ];
      vi.mocked(mockFfmpegManager.getAllStatuses).mockReturnValue(statuses);

      const result = monitor.getDestinationStatuses();
      expect(result).toEqual(statuses);
    });

    it('returns empty array when no destinations', () => {
      const result = monitor.getDestinationStatuses();
      expect(result).toEqual([]);
    });
  });

  describe('startPolling', () => {
    it('re-emits destination statuses at the given interval', () => {
      const statuses: DestinationStatus[] = [
        { id: 'dest-1', health: 'live', bitrate: 2500 },
      ];
      vi.mocked(mockFfmpegManager.getAllStatuses).mockReturnValue(statuses);

      const handler = vi.fn();
      monitor.on('destinationStatusChanged', handler);

      monitor.startPolling(1000);

      // Advance past one interval
      vi.advanceTimersByTime(1000);
      expect(handler).toHaveBeenCalledWith(statuses[0]);

      // Advance past another interval
      handler.mockClear();
      vi.advanceTimersByTime(1000);
      expect(handler).toHaveBeenCalledWith(statuses[0]);
    });

    it('uses default interval of 2000ms', () => {
      const statuses: DestinationStatus[] = [
        { id: 'dest-1', health: 'live' },
      ];
      vi.mocked(mockFfmpegManager.getAllStatuses).mockReturnValue(statuses);

      const handler = vi.fn();
      monitor.on('destinationStatusChanged', handler);

      monitor.startPolling();

      // Not yet at 2000ms
      vi.advanceTimersByTime(1999);
      expect(handler).not.toHaveBeenCalled();

      // At 2000ms
      vi.advanceTimersByTime(1);
      expect(handler).toHaveBeenCalled();
    });

    it('clears previous polling interval when called again', () => {
      const handler = vi.fn();
      monitor.on('destinationStatusChanged', handler);

      const statuses: DestinationStatus[] = [{ id: 'dest-1', health: 'live' }];
      vi.mocked(mockFfmpegManager.getAllStatuses).mockReturnValue(statuses);

      monitor.startPolling(1000);
      monitor.startPolling(5000);

      // Only the 5000ms interval should be active
      vi.advanceTimersByTime(1000);
      expect(handler).not.toHaveBeenCalled();

      vi.advanceTimersByTime(4000);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('stopPolling', () => {
    it('stops emitting destination statuses', () => {
      const statuses: DestinationStatus[] = [
        { id: 'dest-1', health: 'live' },
      ];
      vi.mocked(mockFfmpegManager.getAllStatuses).mockReturnValue(statuses);

      const handler = vi.fn();
      monitor.on('destinationStatusChanged', handler);

      monitor.startPolling(1000);
      vi.advanceTimersByTime(1000);
      expect(handler).toHaveBeenCalledTimes(1);

      monitor.stopPolling();
      handler.mockClear();

      vi.advanceTimersByTime(5000);
      expect(handler).not.toHaveBeenCalled();
    });

    it('is safe to call when not polling', () => {
      expect(() => monitor.stopPolling()).not.toThrow();
    });
  });
});
