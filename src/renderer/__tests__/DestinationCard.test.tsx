import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DestinationCard from '../components/DestinationCard';
import type { Destination, DestinationStatus, PlatformPreset } from '../../shared/types';

const mockDestination: Destination = {
  id: 'dest-1',
  platform: 'twitch',
  name: 'My Twitch',
  url: 'rtmp://live.twitch.tv/app',
  enabled: true,
  createdAt: 1000,
};

const mockPreset: PlatformPreset = {
  id: 'twitch',
  name: 'Twitch',
  defaultUrl: 'rtmp://live.twitch.tv/app',
  requiresRtmps: false,
  color: '#9146FF',
  icon: '📺',
};

const defaultProps = {
  destination: mockDestination,
  preset: mockPreset,
  onToggle: vi.fn(),
  onEdit: vi.fn(),
  onRemove: vi.fn(),
};

// Helper to get the three action buttons: [toggle, edit, remove]
function getActionButtons() {
  return screen.getAllByRole('button');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DestinationCard', () => {
  it('renders the destination name', () => {
    render(<DestinationCard {...defaultProps} />);
    expect(screen.getByText('My Twitch')).toBeInTheDocument();
  });

  it('renders the platform icon as an SVG', () => {
    const { container } = render(<DestinationCard {...defaultProps} />);
    // PlatformIcon renders an SVG element, not an emoji
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows the URL when no status or bitrate', () => {
    render(<DestinationCard {...defaultProps} />);
    expect(screen.getByText('rtmp://live.twitch.tv/app')).toBeInTheDocument();
  });

  it('renders toggle button reflecting enabled state', () => {
    render(<DestinationCard {...defaultProps} />);
    const buttons = getActionButtons();
    // Toggle is the first button
    expect(buttons[0]).toBeInTheDocument();
    expect(buttons[0].className).toContain('toggle-track');
  });

  it('renders toggle button when disabled', () => {
    render(<DestinationCard {...defaultProps} destination={{ ...mockDestination, enabled: false }} />);
    const buttons = getActionButtons();
    const toggle = buttons[0];
    expect(toggle).toBeInTheDocument();
    // When disabled, the toggle background uses the CSS variable
    expect(toggle.style.background).toBe('var(--color-toggle-off)');
  });

  it('applies reduced opacity when destination is disabled', () => {
    const { container } = render(<DestinationCard {...defaultProps} destination={{ ...mockDestination, enabled: false }} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('opacity-40');
  });

  it('calls onToggle when toggle button is clicked', () => {
    render(<DestinationCard {...defaultProps} />);
    const buttons = getActionButtons();
    fireEvent.click(buttons[0]);
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<DestinationCard {...defaultProps} />);
    const buttons = getActionButtons();
    fireEvent.click(buttons[1]);
    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when remove button is clicked', () => {
    render(<DestinationCard {...defaultProps} />);
    const buttons = getActionButtons();
    fireEvent.click(buttons[2]);
    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows status indicator when status is provided', () => {
    const status: DestinationStatus = { id: 'dest-1', health: 'live', bitrate: 5500, fps: 60 };
    render(<DestinationCard {...defaultProps} status={status} />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('shows bitrate when status has bitrate > 0', () => {
    const status: DestinationStatus = { id: 'dest-1', health: 'live', bitrate: 5500 };
    render(<DestinationCard {...defaultProps} status={status} />);
    expect(screen.getByText('5.5 Mbps')).toBeInTheDocument();
  });

  it('shows uptime when status has uptime > 0', () => {
    const status: DestinationStatus = { id: 'dest-1', health: 'live', bitrate: 5500, uptime: 125 };
    render(<DestinationCard {...defaultProps} status={status} />);
    expect(screen.getByText('2m 5s')).toBeInTheDocument();
  });

  it('shows error message when status has error', () => {
    const status: DestinationStatus = { id: 'dest-1', health: 'error', error: 'Connection refused' };
    render(<DestinationCard {...defaultProps} status={status} />);
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });
});
