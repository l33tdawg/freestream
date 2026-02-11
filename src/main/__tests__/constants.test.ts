import { describe, it, expect } from 'vitest';
import {
  PLATFORM_PRESETS,
  DEFAULT_SETTINGS,
  APP_NAME,
  RTMP_APP_NAME,
  RTMP_STREAM_KEY,
} from '../constants';

describe('PLATFORM_PRESETS', () => {
  const expectedPlatforms = [
    'twitch', 'youtube', 'facebook', 'tiktok', 'instagram',
    'kick', 'x', 'rumble', 'linkedin', 'trovo', 'bilibili', 'soop',
    'mixcloud', 'custom',
  ];

  it('has entries for all 14 platforms', () => {
    expect(Object.keys(PLATFORM_PRESETS)).toEqual(expect.arrayContaining(expectedPlatforms));
    expect(Object.keys(PLATFORM_PRESETS)).toHaveLength(14);
  });

  it.each(expectedPlatforms)('%s has required fields', (platform) => {
    const preset = PLATFORM_PRESETS[platform];
    expect(preset).toBeDefined();
    expect(preset.id).toBe(platform);
    expect(typeof preset.name).toBe('string');
    expect(preset.name.length).toBeGreaterThan(0);
    expect(typeof preset.defaultUrl).toBe('string');
    expect(typeof preset.color).toBe('string');
    expect(preset.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(typeof preset.icon).toBe('string');
    expect(preset.icon.length).toBeGreaterThan(0);
    expect(typeof preset.requiresRtmps).toBe('boolean');
  });

  it('twitch has correct defaults', () => {
    expect(PLATFORM_PRESETS.twitch.name).toBe('Twitch');
    expect(PLATFORM_PRESETS.twitch.defaultUrl).toBe('rtmp://live.twitch.tv/app/');
    expect(PLATFORM_PRESETS.twitch.requiresRtmps).toBe(false);
  });

  it('youtube has correct defaults', () => {
    expect(PLATFORM_PRESETS.youtube.name).toBe('YouTube');
    expect(PLATFORM_PRESETS.youtube.defaultUrl).toBe('rtmp://a.rtmp.youtube.com/live2/');
  });

  it('facebook requires RTMPS', () => {
    expect(PLATFORM_PRESETS.facebook.requiresRtmps).toBe(true);
    expect(PLATFORM_PRESETS.facebook.defaultUrl).toMatch(/^rtmps:\/\//);
  });

  it('instagram requires RTMPS', () => {
    expect(PLATFORM_PRESETS.instagram.requiresRtmps).toBe(true);
    expect(PLATFORM_PRESETS.instagram.defaultUrl).toMatch(/^rtmps:\/\//);
  });

  it('tiktok has empty default URL', () => {
    expect(PLATFORM_PRESETS.tiktok.defaultUrl).toBe('');
  });

  it('kick requires RTMPS', () => {
    expect(PLATFORM_PRESETS.kick.name).toBe('Kick');
    expect(PLATFORM_PRESETS.kick.requiresRtmps).toBe(true);
    expect(PLATFORM_PRESETS.kick.defaultUrl).toMatch(/^rtmps:\/\//);
    expect(PLATFORM_PRESETS.kick.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('x has correct defaults', () => {
    expect(PLATFORM_PRESETS.x.name).toBe('X (Twitter)');
    expect(PLATFORM_PRESETS.x.defaultUrl).toBe('');
    expect(PLATFORM_PRESETS.x.requiresRtmps).toBe(false);
    expect(PLATFORM_PRESETS.x.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('rumble has correct defaults', () => {
    expect(PLATFORM_PRESETS.rumble.name).toBe('Rumble');
    expect(PLATFORM_PRESETS.rumble.defaultUrl).toBe('');
    expect(PLATFORM_PRESETS.rumble.requiresRtmps).toBe(false);
    expect(PLATFORM_PRESETS.rumble.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('linkedin requires RTMPS', () => {
    expect(PLATFORM_PRESETS.linkedin.name).toBe('LinkedIn Live');
    expect(PLATFORM_PRESETS.linkedin.requiresRtmps).toBe(true);
    expect(PLATFORM_PRESETS.linkedin.defaultUrl).toBe('');
    expect(PLATFORM_PRESETS.linkedin.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('trovo has correct defaults', () => {
    expect(PLATFORM_PRESETS.trovo.name).toBe('Trovo');
    expect(PLATFORM_PRESETS.trovo.requiresRtmps).toBe(false);
    expect(PLATFORM_PRESETS.trovo.defaultUrl).toMatch(/^rtmp:\/\//);
    expect(PLATFORM_PRESETS.trovo.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('bilibili has correct defaults', () => {
    expect(PLATFORM_PRESETS.bilibili.name).toBe('Bilibili');
    expect(PLATFORM_PRESETS.bilibili.requiresRtmps).toBe(false);
    expect(PLATFORM_PRESETS.bilibili.defaultUrl).toMatch(/^rtmp:\/\//);
    expect(PLATFORM_PRESETS.bilibili.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('soop has correct defaults', () => {
    expect(PLATFORM_PRESETS.soop.name).toBe('SOOP');
    expect(PLATFORM_PRESETS.soop.requiresRtmps).toBe(false);
    expect(PLATFORM_PRESETS.soop.defaultUrl).toMatch(/^rtmp:\/\//);
    expect(PLATFORM_PRESETS.soop.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('mixcloud has correct defaults', () => {
    expect(PLATFORM_PRESETS.mixcloud.name).toBe('Mixcloud');
    expect(PLATFORM_PRESETS.mixcloud.requiresRtmps).toBe(false);
    expect(PLATFORM_PRESETS.mixcloud.defaultUrl).toBe('rtmp://rtmp.mixcloud.com/broadcast');
    expect(PLATFORM_PRESETS.mixcloud.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('custom has empty default URL', () => {
    expect(PLATFORM_PRESETS.custom.defaultUrl).toBe('');
    expect(PLATFORM_PRESETS.custom.name).toBe('Custom RTMP');
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('has rtmpPort 1935', () => {
    expect(DEFAULT_SETTINGS.rtmpPort).toBe(1935);
  });

  it('has autoReconnect enabled', () => {
    expect(DEFAULT_SETTINGS.autoReconnect).toBe(true);
  });

  it('has maxRetries of 5', () => {
    expect(DEFAULT_SETTINGS.maxRetries).toBe(5);
  });

  it('has empty ffmpegPath', () => {
    expect(DEFAULT_SETTINGS.ffmpegPath).toBe('');
  });

  it('has bufferDuration of 0', () => {
    expect(DEFAULT_SETTINGS.bufferDuration).toBe(0);
  });

  it('has minimizeToTray enabled', () => {
    expect(DEFAULT_SETTINGS.minimizeToTray).toBe(true);
  });

  it('has startMinimized disabled', () => {
    expect(DEFAULT_SETTINGS.startMinimized).toBe(false);
  });

  it('has theme set to dark', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('dark');
  });
});

describe('App constants', () => {
  it('APP_NAME is FreEstream', () => {
    expect(APP_NAME).toBe('FreEstream');
  });

  it('RTMP_APP_NAME is live', () => {
    expect(RTMP_APP_NAME).toBe('live');
  });

  it('RTMP_STREAM_KEY is stream', () => {
    expect(RTMP_STREAM_KEY).toBe('stream');
  });
});
