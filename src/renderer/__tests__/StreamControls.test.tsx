import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StreamControls from '../components/StreamControls';

describe('StreamControls', () => {
  const defaultProps = {
    isLive: false,
    ingestConnected: false,
    hasEnabledDestinations: false,
    onGoLive: vi.fn().mockResolvedValue(undefined),
    onStopAll: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables Start Restreaming button when not connected', () => {
    render(<StreamControls {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Start Restreaming/i });
    expect(btn).toBeDisabled();
  });

  it('disables Start Restreaming button when connected but no enabled destinations', () => {
    render(<StreamControls {...defaultProps} ingestConnected={true} hasEnabledDestinations={false} />);
    const btn = screen.getByRole('button', { name: /Start Restreaming/i });
    expect(btn).toBeDisabled();
  });

  it('shows hint "Connect OBS to start restreaming" when ingest not connected', () => {
    render(<StreamControls {...defaultProps} />);
    expect(screen.getByText('Connect OBS to start restreaming')).toBeInTheDocument();
  });

  it('shows hint "Enable at least one destination" when connected but no destinations', () => {
    render(<StreamControls {...defaultProps} ingestConnected={true} />);
    expect(screen.getByText('Enable at least one destination')).toBeInTheDocument();
  });

  it('enables Start Restreaming button when connected and has enabled destinations', () => {
    render(<StreamControls {...defaultProps} ingestConnected={true} hasEnabledDestinations={true} />);
    const btn = screen.getByRole('button', { name: /Start Restreaming/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls onGoLive when Start Restreaming button is clicked', async () => {
    const onGoLive = vi.fn().mockResolvedValue(undefined);
    render(<StreamControls {...defaultProps} ingestConnected={true} hasEnabledDestinations={true} onGoLive={onGoLive} />);
    const btn = screen.getByRole('button', { name: /Start Restreaming/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onGoLive).toHaveBeenCalledTimes(1);
    });
  });

  it('shows Stop All Streams button when isLive=true', () => {
    render(<StreamControls {...defaultProps} isLive={true} />);
    expect(screen.getByRole('button', { name: /Stop All Streams/i })).toBeInTheDocument();
  });

  it('does not show Start Restreaming button when isLive=true', () => {
    render(<StreamControls {...defaultProps} isLive={true} />);
    expect(screen.queryByRole('button', { name: /Start Restreaming/i })).not.toBeInTheDocument();
  });

  it('calls onStopAll when Stop All Streams button is clicked', async () => {
    const onStopAll = vi.fn().mockResolvedValue(undefined);
    render(<StreamControls {...defaultProps} isLive={true} onStopAll={onStopAll} />);
    const btn = screen.getByRole('button', { name: /Stop All Streams/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onStopAll).toHaveBeenCalledTimes(1);
    });
  });
});
