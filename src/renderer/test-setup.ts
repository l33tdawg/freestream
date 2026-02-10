import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
  getSettings: vi.fn().mockResolvedValue({ theme: 'dark' }),
  updateSettings: vi.fn().mockResolvedValue(undefined),

  // FFmpeg
  detectFfmpeg: vi.fn(),

  // App
  getIngestUrl: vi.fn(),
  getPlatformPresets: vi.fn(),

  // Event listeners
  onIngestStatusChanged: vi.fn().mockReturnValue(() => {}),
  onDestinationStatusChanged: vi.fn().mockReturnValue(() => {}),
  onStreamError: vi.fn().mockReturnValue(() => {}),
};

Object.defineProperty(window, 'freestream', {
  value: mockFreestream,
  writable: true,
});
