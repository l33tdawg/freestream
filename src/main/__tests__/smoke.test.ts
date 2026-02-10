import { describe, it, expect } from 'vitest';

describe('main process test setup', () => {
  it('runs in node environment', () => {
    expect(typeof process.versions.node).toBe('string');
  });
});
