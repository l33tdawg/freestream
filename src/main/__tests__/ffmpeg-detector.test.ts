import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child_process
vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

import { detectFfmpeg } from '../ffmpeg-detector';
import { execFile } from 'child_process';
import { existsSync } from 'fs';

// Helper to set up execFile mock behavior
function mockExecFileResult(shouldSucceed: boolean | ((cmd: string) => boolean)) {
  vi.mocked(execFile).mockImplementation(
    (cmd: string, args: any, options: any, callback?: any) => {
      const cb = callback || options;
      const success =
        typeof shouldSucceed === 'function' ? shouldSucceed(cmd as string) : shouldSucceed;

      if (success) {
        cb(null, 'ffmpeg version 6.0 Copyright (c) 2000-2023', '');
      } else {
        cb(new Error('not found'), '', '');
      }
      return {} as any;
    },
  );
}

describe('ffmpeg-detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectFfmpeg', () => {
    it('returns custom path if valid', async () => {
      mockExecFileResult(true);

      const result = await detectFfmpeg('/custom/path/ffmpeg');
      expect(result).toBe('/custom/path/ffmpeg');
    });

    it('tries PATH when custom path is not provided', async () => {
      mockExecFileResult((cmd) => cmd === 'ffmpeg');

      const result = await detectFfmpeg();
      expect(result).toBe('ffmpeg');
    });

    it('tries PATH when custom path is empty string', async () => {
      mockExecFileResult((cmd) => cmd === 'ffmpeg');

      const result = await detectFfmpeg('');
      expect(result).toBe('ffmpeg');
    });

    it('tries common locations when PATH fails', async () => {
      // ffmpeg not in PATH, but exists at /usr/local/bin/ffmpeg
      mockExecFileResult((cmd) => cmd === '/usr/local/bin/ffmpeg');
      vi.mocked(existsSync).mockImplementation(
        (p) => p === '/usr/local/bin/ffmpeg',
      );

      const result = await detectFfmpeg();
      expect(result).toBe('/usr/local/bin/ffmpeg');
    });

    it('tries /opt/homebrew/bin/ffmpeg on macOS', async () => {
      mockExecFileResult((cmd) => cmd === '/opt/homebrew/bin/ffmpeg');
      vi.mocked(existsSync).mockImplementation(
        (p) => p === '/opt/homebrew/bin/ffmpeg',
      );

      const result = await detectFfmpeg();
      expect(result).toBe('/opt/homebrew/bin/ffmpeg');
    });

    it('returns null when ffmpeg is not found anywhere', async () => {
      mockExecFileResult(false);
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await detectFfmpeg();
      expect(result).toBeNull();
    });

    it('skips custom path when it is whitespace only', async () => {
      mockExecFileResult((cmd) => cmd === 'ffmpeg');

      const result = await detectFfmpeg('   ');
      expect(result).toBe('ffmpeg');
    });

    it('returns null when custom path is invalid and nothing else found', async () => {
      mockExecFileResult(false);
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await detectFfmpeg('/nonexistent/ffmpeg');
      expect(result).toBeNull();
    });

    it('prefers custom path over PATH', async () => {
      // Both custom and PATH work
      mockExecFileResult(true);

      const result = await detectFfmpeg('/my/ffmpeg');
      expect(result).toBe('/my/ffmpeg');
    });
  });
});
