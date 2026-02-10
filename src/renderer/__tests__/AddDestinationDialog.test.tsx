import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddDestinationDialog from '../components/AddDestinationDialog';
import type { PlatformPreset } from '../../shared/types';

const mockPresets: Record<string, PlatformPreset> = {
  twitch: {
    id: 'twitch',
    name: 'Twitch',
    defaultUrl: 'rtmp://live.twitch.tv/app/',
    requiresRtmps: false,
    color: '#9146FF',
    icon: '🟣',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    defaultUrl: 'rtmp://a.rtmp.youtube.com/live2/',
    requiresRtmps: false,
    color: '#FF0000',
    icon: '🔴',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    defaultUrl: 'rtmp://push.tiktok.com/live/',
    requiresRtmps: false,
    color: '#ff0050',
    icon: '🎵',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    defaultUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
    requiresRtmps: true,
    color: '#E4405F',
    icon: '📸',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    defaultUrl: '',
    requiresRtmps: false,
    color: '#000000',
    icon: '✖️',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    defaultUrl: 'rtmps://1.rtmp.linkedin.com:443/rtmpx/',
    requiresRtmps: true,
    color: '#0A66C2',
    icon: '💼',
  },
  kick: {
    id: 'kick',
    name: 'Kick',
    defaultUrl: 'rtmps://fa723fc1b171.global-contribute.live-video.net/app/',
    requiresRtmps: true,
    color: '#53FC18',
    icon: '🟢',
  },
  custom: {
    id: 'custom',
    name: 'Custom RTMP',
    defaultUrl: '',
    requiresRtmps: false,
    color: '#6B7280',
    icon: '⚙️',
  },
};

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onAdd: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (window.freestream.getPlatformPresets as ReturnType<typeof vi.fn>).mockResolvedValue(mockPresets);
});

describe('AddDestinationDialog', () => {
  it('does not render when open is false', () => {
    const { container } = render(
      <AddDestinationDialog {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when open is true', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Add Destination', { selector: 'h2' })).toBeInTheDocument();
    });
  });

  it('shows "Add Destination" heading', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Add Destination', { selector: 'h2' })).toBeInTheDocument();
    });
    expect(screen.getByText('Choose a platform and configure your stream')).toBeInTheDocument();
  });

  it('loads and shows platform buttons from presets', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Twitch')).toBeInTheDocument();
    });
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('Kick')).toBeInTheDocument();
    expect(screen.getByText('Custom RTMP')).toBeInTheDocument();
  });

  it('shows platform guide when a platform is selected', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Twitch')).toBeInTheDocument();
    });
    // Twitch is selected by default, so its guide should be visible
    expect(
      screen.getByText(/Get your stream key from Twitch Dashboard/)
    ).toBeInTheDocument();
    expect(screen.getByText('Open Twitch Dashboard')).toBeInTheDocument();

    // Click YouTube and check its guide appears
    fireEvent.click(screen.getByText('YouTube'));
    expect(
      screen.getByText(/Go to YouTube Studio/)
    ).toBeInTheDocument();
    expect(screen.getByText('Open YouTube Studio')).toBeInTheDocument();
  });

  it('shows warning badge for platforms with warnings', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('TikTok')).toBeInTheDocument();
    });

    // Click TikTok and check for its warning text
    fireEvent.click(screen.getByText('TikTok'));
    expect(
      screen.getByText('Requires LIVE access (typically 1,000+ followers)')
    ).toBeInTheDocument();

    // Click Instagram and check for its warning text
    fireEvent.click(screen.getByText('Instagram'));
    expect(
      screen.getByText('Requires 1,000+ followers and eligible account')
    ).toBeInTheDocument();

    // Click X and check for its warning text
    fireEvent.click(screen.getByText('X (Twitter)'));
    expect(
      screen.getByText('Requires X Premium or Premium+ subscription')
    ).toBeInTheDocument();

    // Click LinkedIn and check for its warning text
    fireEvent.click(screen.getByText('LinkedIn'));
    expect(
      screen.getByText('Must schedule an event first')
    ).toBeInTheDocument();
  });

  it('pre-fills name and URL when platform is selected', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Twitch')).toBeInTheDocument();
    });

    // Twitch is default — check name and URL inputs are pre-filled
    const nameInput = screen.getByPlaceholderText('My Twitch Channel') as HTMLInputElement;
    const urlInput = screen.getByPlaceholderText('rtmp://...') as HTMLInputElement;
    expect(nameInput.value).toBe('Twitch');
    expect(urlInput.value).toBe('rtmp://live.twitch.tv/app/');

    // Switch to YouTube
    fireEvent.click(screen.getByText('YouTube'));
    await waitFor(() => {
      expect(nameInput.value).toBe('YouTube');
    });
    expect(urlInput.value).toBe('rtmp://a.rtmp.youtube.com/live2/');
  });

  it('calls onAdd with correct arguments on form submit', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Twitch')).toBeInTheDocument();
    });

    // Fill in a stream key (the name and URL are pre-filled from preset)
    const streamKeyInput = screen.getByPlaceholderText('Enter stream key');
    fireEvent.change(streamKeyInput, { target: { value: 'live_abc123' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Add Destination/i });
    fireEvent.click(submitButton);

    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      'twitch',
      'Twitch',
      'rtmp://live.twitch.tv/app/',
      'live_abc123'
    );
  });

  it('calls onClose on cancel button click', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit when name is empty', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Twitch')).toBeInTheDocument();
    });

    // Clear the name field (it was pre-filled)
    const nameInput = screen.getByPlaceholderText('My Twitch Channel');
    fireEvent.change(nameInput, { target: { value: '' } });

    // Enter a stream key
    const streamKeyInput = screen.getByPlaceholderText('Enter stream key');
    fireEvent.change(streamKeyInput, { target: { value: 'somekey' } });

    const submitButton = screen.getByRole('button', { name: /Add Destination/i });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit when streamKey is empty', async () => {
    render(<AddDestinationDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Twitch')).toBeInTheDocument();
    });

    // Name is pre-filled from preset, stream key is empty by default
    const submitButton = screen.getByRole('button', { name: /Add Destination/i });
    expect(submitButton).toBeDisabled();
  });
});
