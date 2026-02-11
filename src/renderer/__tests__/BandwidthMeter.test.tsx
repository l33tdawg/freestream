import React from 'react';
import { render, screen } from '@testing-library/react';
import BandwidthMeter from '../components/BandwidthMeter';
import { DestinationStatus } from '../../shared/types';

describe('BandwidthMeter', () => {
  it('renders nothing when no destinations are live', () => {
    const statuses = new Map<string, DestinationStatus>();
    const { container } = render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all destinations are idle', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'idle' }],
      ['d2', { id: 'd2', health: 'connecting' }],
    ]);
    const { container } = render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when live destinations have no bitrate', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'live', bitrate: 0 }],
    ]);
    const { container } = render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when at least one destination is live with bitrate', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'live', bitrate: 5000 }],
    ]);
    render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(screen.getByText('Total Bandwidth')).toBeInTheDocument();
  });

  it('displays total bitrate in Mbps for values >= 1000 kbps', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'live', bitrate: 6000 }],
      ['d2', { id: 'd2', health: 'live', bitrate: 4500 }],
    ]);
    render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(screen.getByText('10.5 Mbps')).toBeInTheDocument();
  });

  it('displays total bitrate in kbps for values < 1000 kbps', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'live', bitrate: 500 }],
    ]);
    render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(screen.getByText('500 kbps')).toBeInTheDocument();
  });

  it('shows correct stream count for single stream', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'live', bitrate: 5000 }],
    ]);
    render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(screen.getByText('(1 stream)')).toBeInTheDocument();
  });

  it('shows correct stream count for multiple streams', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'live', bitrate: 5000 }],
      ['d2', { id: 'd2', health: 'live', bitrate: 3000 }],
      ['d3', { id: 'd3', health: 'live', bitrate: 2000 }],
    ]);
    render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(screen.getByText('(3 streams)')).toBeInTheDocument();
  });

  it('only counts live destinations with bitrate > 0', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'live', bitrate: 5000 }],
      ['d2', { id: 'd2', health: 'idle' }],
      ['d3', { id: 'd3', health: 'error', bitrate: 0 }],
      ['d4', { id: 'd4', health: 'live', bitrate: 3000 }],
    ]);
    render(<BandwidthMeter destinationStatuses={statuses} />);
    expect(screen.getByText('(2 streams)')).toBeInTheDocument();
    expect(screen.getByText('8.0 Mbps')).toBeInTheDocument();
  });

  it('renders 20 bar segments', () => {
    const statuses = new Map<string, DestinationStatus>([
      ['d1', { id: 'd1', health: 'live', bitrate: 5000 }],
    ]);
    const { container } = render(<BandwidthMeter destinationStatuses={statuses} />);
    const segments = container.querySelectorAll('.h-\\[6px\\]');
    expect(segments).toHaveLength(20);
  });
});
