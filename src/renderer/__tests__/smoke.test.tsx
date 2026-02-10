import { describe, it, expect } from 'vitest';

describe('renderer test setup', () => {
  it('has window.freestream mock available', () => {
    expect(window.freestream).toBeDefined();
    expect(window.freestream.getDestinations).toBeDefined();
    expect(window.freestream.goLive).toBeDefined();
  });

  it('runs in jsdom environment', () => {
    expect(typeof document).toBe('object');
  });
});
