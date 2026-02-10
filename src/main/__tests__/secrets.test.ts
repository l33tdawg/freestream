import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSetPassword, mockGetPassword, mockDeletePassword } = vi.hoisted(() => ({
  mockSetPassword: vi.fn(),
  mockGetPassword: vi.fn(),
  mockDeletePassword: vi.fn(),
}));

vi.mock('keytar', () => ({
  setPassword: mockSetPassword,
  getPassword: mockGetPassword,
  deletePassword: mockDeletePassword,
}));

import { setStreamKey, getStreamKey, deleteStreamKey } from '../secrets';

describe('secrets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setStreamKey', () => {
    it('stores key using keytar with correct service name', async () => {
      mockSetPassword.mockResolvedValue(undefined);
      await setStreamKey('dest-1', 'my-stream-key');
      expect(mockSetPassword).toHaveBeenCalledWith('FreEstream', 'dest-1', 'my-stream-key');
    });

    it('uses FreEstream as the service name', async () => {
      mockSetPassword.mockResolvedValue(undefined);
      await setStreamKey('any-id', 'key');
      expect(mockSetPassword.mock.calls[0][0]).toBe('FreEstream');
    });
  });

  describe('getStreamKey', () => {
    it('retrieves key from keytar', async () => {
      mockGetPassword.mockResolvedValue('my-secret-key');
      const result = await getStreamKey('dest-1');
      expect(mockGetPassword).toHaveBeenCalledWith('FreEstream', 'dest-1');
      expect(result).toBe('my-secret-key');
    });

    it('returns null when no key exists', async () => {
      mockGetPassword.mockResolvedValue(null);
      const result = await getStreamKey('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deleteStreamKey', () => {
    it('deletes key from keytar', async () => {
      mockDeletePassword.mockResolvedValue(true);
      const result = await deleteStreamKey('dest-1');
      expect(mockDeletePassword).toHaveBeenCalledWith('FreEstream', 'dest-1');
      expect(result).toBe(true);
    });

    it('returns false when key does not exist', async () => {
      mockDeletePassword.mockResolvedValue(false);
      const result = await deleteStreamKey('nonexistent');
      expect(result).toBe(false);
    });
  });
});
