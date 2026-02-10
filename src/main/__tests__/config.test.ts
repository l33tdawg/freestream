import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mockStore is available when vi.mock factory runs (hoisted)
const { mockStore } = vi.hoisted(() => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
  };
  return { mockStore };
});

vi.mock('electron-store', () => {
  function MockStore() {
    return mockStore;
  }
  return { default: MockStore };
});

import { getSettings, updateSettings, getDestinations, setDestinations } from '../config';
import { DEFAULT_SETTINGS } from '../constants';
import type { AppSettings, Destination } from '../../shared/types';

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('returns settings from store', () => {
      mockStore.get.mockReturnValue(DEFAULT_SETTINGS);
      const settings = getSettings();
      expect(mockStore.get).toHaveBeenCalledWith('settings');
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('returns defaults when store is empty', () => {
      mockStore.get.mockReturnValue(DEFAULT_SETTINGS);
      const settings = getSettings();
      expect(settings.rtmpPort).toBe(1935);
      expect(settings.autoReconnect).toBe(true);
      expect(settings.maxRetries).toBe(5);
    });
  });

  describe('updateSettings', () => {
    it('does a partial merge with current settings', () => {
      mockStore.get.mockReturnValue({ ...DEFAULT_SETTINGS });
      const result = updateSettings({ rtmpPort: 1936 });
      expect(mockStore.set).toHaveBeenCalledWith('settings', {
        ...DEFAULT_SETTINGS,
        rtmpPort: 1936,
      });
      expect(result.rtmpPort).toBe(1936);
      expect(result.autoReconnect).toBe(true);
    });

    it('can update multiple fields at once', () => {
      mockStore.get.mockReturnValue({ ...DEFAULT_SETTINGS });
      const result = updateSettings({ rtmpPort: 2000, maxRetries: 10 });
      expect(result.rtmpPort).toBe(2000);
      expect(result.maxRetries).toBe(10);
      expect(result.autoReconnect).toBe(true);
    });

    it('preserves existing fields when updating', () => {
      const current: AppSettings = {
        ...DEFAULT_SETTINGS,
        ffmpegPath: '/usr/local/bin/ffmpeg',
      };
      mockStore.get.mockReturnValue(current);
      const result = updateSettings({ autoReconnect: false });
      expect(result.ffmpegPath).toBe('/usr/local/bin/ffmpeg');
      expect(result.autoReconnect).toBe(false);
    });
  });

  describe('getDestinations', () => {
    it('returns destinations from store', () => {
      const destinations: Destination[] = [
        {
          id: 'test-1',
          platform: 'twitch',
          name: 'Twitch',
          url: 'rtmp://live.twitch.tv/app/',
          enabled: true,
          createdAt: Date.now(),
        },
      ];
      mockStore.get.mockReturnValue(destinations);
      const result = getDestinations();
      expect(mockStore.get).toHaveBeenCalledWith('destinations');
      expect(result).toEqual(destinations);
    });

    it('returns empty array when no destinations', () => {
      mockStore.get.mockReturnValue([]);
      const result = getDestinations();
      expect(result).toEqual([]);
    });
  });

  describe('setDestinations', () => {
    it('saves destinations to store', () => {
      const destinations: Destination[] = [
        {
          id: 'test-1',
          platform: 'youtube',
          name: 'YouTube',
          url: 'rtmp://a.rtmp.youtube.com/live2/',
          enabled: true,
          createdAt: Date.now(),
        },
      ];
      setDestinations(destinations);
      expect(mockStore.set).toHaveBeenCalledWith('destinations', destinations);
    });
  });

  describe('round-trip', () => {
    it('getDestinations returns what setDestinations saved', () => {
      const destinations: Destination[] = [
        {
          id: 'dest-1',
          platform: 'facebook',
          name: 'Facebook',
          url: 'rtmps://live-api-s.facebook.com:443/rtmp/',
          enabled: false,
          createdAt: 1000,
        },
        {
          id: 'dest-2',
          platform: 'twitch',
          name: 'Twitch',
          url: 'rtmp://live.twitch.tv/app/',
          enabled: true,
          createdAt: 2000,
        },
      ];

      mockStore.set.mockImplementation(() => {});
      mockStore.get.mockReturnValue(destinations);

      setDestinations(destinations);
      const result = getDestinations();
      expect(result).toEqual(destinations);
    });
  });
});
