import React from 'react';
import { render } from '@testing-library/react';
import PlatformIcon from '../components/PlatformIcon';
import type { PlatformId } from '../../shared/types';

// jsdom normalizes hex CSS colors to rgb() format via style.color
const platforms: { platform: PlatformId; color: string }[] = [
  { platform: 'twitch', color: 'rgb(145, 70, 255)' },
  { platform: 'youtube', color: 'rgb(255, 0, 0)' },
  { platform: 'facebook', color: 'rgb(24, 119, 242)' },
  { platform: 'tiktok', color: 'rgb(255, 0, 80)' },
  { platform: 'instagram', color: 'rgb(228, 64, 95)' },
  { platform: 'kick', color: 'rgb(83, 252, 24)' },
  { platform: 'x', color: 'rgb(0, 0, 0)' },
  { platform: 'rumble', color: 'rgb(133, 199, 66)' },
  { platform: 'linkedin', color: 'rgb(10, 102, 194)' },
  { platform: 'trovo', color: 'rgb(25, 214, 107)' },
  { platform: 'bilibili', color: 'rgb(0, 161, 214)' },
  { platform: 'soop', color: 'rgb(106, 69, 255)' },
  { platform: 'mixcloud', color: 'rgb(80, 0, 255)' },
  { platform: 'custom', color: 'rgb(107, 114, 128)' },
];

describe('PlatformIcon', () => {
  it.each(platforms)('renders an SVG for "$platform"', ({ platform }) => {
    const { container } = render(<PlatformIcon platform={platform} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it.each(platforms)('applies brand color "$color" for "$platform"', ({ platform, color }) => {
    const { container } = render(<PlatformIcon platform={platform} />);
    const span = container.querySelector('span');
    expect(span?.style.color).toBe(color);
  });

  it.each(platforms)('renders without crashing for "$platform"', ({ platform }) => {
    expect(() => render(<PlatformIcon platform={platform} />)).not.toThrow();
  });

  it('uses default size of 24', () => {
    const { container } = render(<PlatformIcon platform="twitch" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('respects a custom size prop', () => {
    const { container } = render(<PlatformIcon platform="youtube" size={48} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('48');
    expect(svg?.getAttribute('height')).toBe('48');
  });

  it('respects a small size prop', () => {
    const { container } = render(<PlatformIcon platform="facebook" size={16} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('16');
    expect(svg?.getAttribute('height')).toBe('16');
  });

  it('applies custom className', () => {
    const { container } = render(<PlatformIcon platform="tiktok" className="my-custom-class" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('my-custom-class');
  });

  it('preserves default classes when custom className is added', () => {
    const { container } = render(<PlatformIcon platform="kick" className="extra" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('inline-flex');
    expect(span?.className).toContain('items-center');
    expect(span?.className).toContain('justify-center');
    expect(span?.className).toContain('extra');
  });

  it('applies empty className by default', () => {
    const { container } = render(<PlatformIcon platform="rumble" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('inline-flex');
    expect(span?.className).not.toContain('undefined');
  });

  it('renders the wrapper span with inline-flex layout', () => {
    const { container } = render(<PlatformIcon platform="linkedin" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('inline-flex');
    expect(span?.className).toContain('items-center');
    expect(span?.className).toContain('justify-center');
  });

  it('renders custom platform icon with stroke attributes', () => {
    const { container } = render(<PlatformIcon platform="custom" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('none');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('stroke-width')).toBe('1.5');
  });

  it('renders non-custom platform icons with fill=currentColor', () => {
    const { container } = render(<PlatformIcon platform="twitch" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
  });

  it('renders all 14 platforms', () => {
    expect(platforms).toHaveLength(14);
    for (const { platform } of platforms) {
      const { container } = render(<PlatformIcon platform={platform} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }
  });
});
