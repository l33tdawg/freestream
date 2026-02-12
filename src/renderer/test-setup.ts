import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock mpegts.js for StreamPreview component
vi.mock('mpegts.js', () => ({
  default: {
    isSupported: () => false,
    Events: { ERROR: 'error' },
    createPlayer: () => ({
      attachMediaElement: vi.fn(),
      load: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      unload: vi.fn(),
      detachMediaElement: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
    }),
  },
}));

const mockFreestream = {
  // Destinations
  getDestinations: vi.fn(),
  addDestination: vi.fn(),
  updateDestination: vi.fn(),
  removeDestination: vi.fn(),
  toggleDestination: vi.fn(),

  // Streaming
  goLive: vi.fn(),
  stopAll: vi.fn(),
  stopDestination: vi.fn(),
  getStreamStatus: vi.fn(),

  // Stream keys
  setStreamKey: vi.fn(),
  getStreamKey: vi.fn(),
  deleteStreamKey: vi.fn(),

  // Settings
  getSettings: vi.fn().mockResolvedValue({ theme: 'dark', bufferDuration: 0 }),
  updateSettings: vi.fn().mockResolvedValue(undefined),

  // FFmpeg
  detectFfmpeg: vi.fn(),
  detectEncoders: vi.fn().mockResolvedValue({ hardware: [], software: ['libx264'] }),
  getEncodingPresets: vi.fn().mockResolvedValue({}),

  // App
  getIngestUrl: vi.fn(),
  getIngestStreamKey: vi.fn(),
  getNetworkIngestUrl: vi.fn(),
  getPlatformPresets: vi.fn(),

  // Stream key verification
  testConnection: vi.fn(),

  // Event listeners
  onIngestStatusChanged: vi.fn().mockReturnValue(() => {}),
  onDestinationStatusChanged: vi.fn().mockReturnValue(() => {}),
  onStreamError: vi.fn().mockReturnValue(() => {}),
};

Object.defineProperty(window, 'freestream', {
  value: mockFreestream,
  writable: true,
});
