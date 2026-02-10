import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Destination } from '../../shared/types';

// Mock dependencies
const mockDestinations: Destination[] = [];

vi.mock('../config', () => ({
  getDestinations: vi.fn(() => [...mockDestinations]),
  setDestinations: vi.fn((dests: Destination[]) => {
    mockDestinations.length = 0;
    mockDestinations.push(...dests);
  }),
}));

vi.mock('../secrets', () => ({
  deleteStreamKey: vi.fn().mockResolvedValue(true),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

import { DestinationManager } from '../destination-manager';
import { getDestinations, setDestinations } from '../config';
import { deleteStreamKey } from '../secrets';

describe('DestinationManager', () => {
  let manager: DestinationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDestinations.length = 0;
    manager = new DestinationManager();
  });

  describe('getAll', () => {
    it('returns all destinations', () => {
      mockDestinations.push(
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
      );

      const result = manager.getAll();
      expect(result).toHaveLength(2);
      expect(getDestinations).toHaveBeenCalled();
    });

    it('returns empty array when no destinations exist', () => {
      const result = manager.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('getEnabled', () => {
    it('filters to only enabled destinations', () => {
      mockDestinations.push(
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
        {
          id: 'dest-3',
          platform: 'facebook',
          name: 'Facebook',
          url: 'rtmps://live-api-s.facebook.com:443/rtmp/',
          enabled: true,
          createdAt: 3000,
        },
      );

      const result = manager.getEnabled();
      expect(result).toHaveLength(2);
      expect(result.every((d) => d.enabled)).toBe(true);
    });

    it('returns empty array when no destinations are enabled', () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: false,
        createdAt: 1000,
      });

      const result = manager.getEnabled();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns the destination with matching ID', () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      });

      const result = manager.getById('dest-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('dest-1');
    });

    it('returns undefined for non-existent ID', () => {
      const result = manager.getById('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('add', () => {
    it('generates a UUID for the new destination', () => {
      const result = manager.add('twitch', 'My Twitch', 'rtmp://live.twitch.tv/app/');
      expect(result.id).toBe('mock-uuid-1234');
    });

    it('sets enabled to true by default', () => {
      const result = manager.add('twitch', 'My Twitch', 'rtmp://live.twitch.tv/app/');
      expect(result.enabled).toBe(true);
    });

    it('sets createdAt to current timestamp', () => {
      const before = Date.now();
      const result = manager.add('twitch', 'My Twitch', 'rtmp://live.twitch.tv/app/');
      const after = Date.now();
      expect(result.createdAt).toBeGreaterThanOrEqual(before);
      expect(result.createdAt).toBeLessThanOrEqual(after);
    });

    it('uses preset name when name is empty', () => {
      const result = manager.add('twitch', '', 'rtmp://live.twitch.tv/app/');
      expect(result.name).toBe('Twitch');
    });

    it('uses preset URL when url is empty', () => {
      const result = manager.add('twitch', 'My Twitch', '');
      expect(result.url).toBe('rtmp://live.twitch.tv/app/');
    });

    it('saves destination to config', () => {
      manager.add('youtube', 'My YouTube', 'rtmp://a.rtmp.youtube.com/live2/');
      expect(setDestinations).toHaveBeenCalled();
    });

    it('returns the newly created destination', () => {
      const result = manager.add('facebook', 'My FB', 'rtmps://live-api-s.facebook.com:443/rtmp/');
      expect(result.platform).toBe('facebook');
      expect(result.name).toBe('My FB');
      expect(result.url).toBe('rtmps://live-api-s.facebook.com:443/rtmp/');
    });
  });

  describe('update', () => {
    it('performs partial merge of updates', () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      });

      const result = manager.update('dest-1', { name: 'Updated Twitch' });
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Updated Twitch');
      expect(result!.url).toBe('rtmp://live.twitch.tv/app/');
      expect(result!.enabled).toBe(true);
    });

    it('returns null for non-existent ID', () => {
      const result = manager.update('nonexistent', { name: 'Test' });
      expect(result).toBeNull();
    });

    it('saves updated destinations to config', () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      });

      manager.update('dest-1', { enabled: false });
      expect(setDestinations).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes the destination with matching ID', async () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      });

      const result = await manager.remove('dest-1');
      expect(result).toBe(true);
      expect(setDestinations).toHaveBeenCalled();
    });

    it('calls deleteStreamKey for the removed destination', async () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      });

      await manager.remove('dest-1');
      expect(deleteStreamKey).toHaveBeenCalledWith('dest-1');
    });

    it('returns false for non-existent ID', async () => {
      const result = await manager.remove('nonexistent');
      expect(result).toBe(false);
    });

    it('does not call deleteStreamKey when ID does not exist', async () => {
      await manager.remove('nonexistent');
      expect(deleteStreamKey).not.toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('flips enabled from true to false', () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      });

      const result = manager.toggle('dest-1');
      expect(result).not.toBeNull();
      expect(result!.enabled).toBe(false);
    });

    it('flips enabled from false to true', () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: false,
        createdAt: 1000,
      });

      const result = manager.toggle('dest-1');
      expect(result).not.toBeNull();
      expect(result!.enabled).toBe(true);
    });

    it('returns null for non-existent ID', () => {
      const result = manager.toggle('nonexistent');
      expect(result).toBeNull();
    });

    it('saves toggled state to config', () => {
      mockDestinations.push({
        id: 'dest-1',
        platform: 'twitch',
        name: 'Twitch',
        url: 'rtmp://live.twitch.tv/app/',
        enabled: true,
        createdAt: 1000,
      });

      manager.toggle('dest-1');
      expect(setDestinations).toHaveBeenCalled();
    });
  });
});
