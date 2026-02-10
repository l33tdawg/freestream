import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import IngestStatus from '../components/IngestStatus';
import type { IngestStatus as IngestStatusType } from '../../shared/types';

describe('IngestStatus', () => {
  it('shows disconnected state when connected=false', async () => {
    const status: IngestStatusType = { connected: false };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText('Waiting for OBS')).toBeInTheDocument();
    });
  });

  it('shows waiting message with settings hint when disconnected', async () => {
    const status: IngestStatusType = { connected: false };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText('Waiting for OBS connection...')).toBeInTheDocument();
      expect(screen.getByText('See Settings for setup info')).toBeInTheDocument();
    });
  });

  it('shows connected state when connected=true', async () => {
    const status: IngestStatusType = { connected: true, clientIp: '192.168.1.100' };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText('OBS Connected')).toBeInTheDocument();
    });
  });

  it('displays client IP when connected', async () => {
    const status: IngestStatusType = { connected: true, clientIp: '192.168.1.100' };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText(/Connected from 192.168.1.100/)).toBeInTheDocument();
    });
  });

  it('does not show setup instructions when connected', async () => {
    const status: IngestStatusType = { connected: true };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText('OBS Connected')).toBeInTheDocument();
    });

    expect(screen.queryByText('See Settings for setup info')).not.toBeInTheDocument();
  });

  it('does not show ingest URL in disconnected state (moved to Settings)', async () => {
    const status: IngestStatusType = { connected: false };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText('Waiting for OBS')).toBeInTheDocument();
    });

    // Ingest URL fields have been moved to Settings dialog
    expect(screen.queryByText('Server URL')).not.toBeInTheDocument();
    expect(screen.queryByText('Stream Key')).not.toBeInTheDocument();
  });
});
