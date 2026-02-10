import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import IngestStatus from '../components/IngestStatus';
import type { IngestStatus as IngestStatusType } from '../../shared/types';

beforeEach(() => {
  vi.clearAllMocks();
  (window.freestream.getIngestUrl as ReturnType<typeof vi.fn>).mockResolvedValue('rtmp://localhost:1935/live');
  (window.freestream.getIngestStreamKey as ReturnType<typeof vi.fn>).mockResolvedValue('stream');
});

describe('IngestStatus', () => {
  it('shows disconnected state when connected=false', async () => {
    const status: IngestStatusType = { connected: false };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText('Waiting for OBS')).toBeInTheDocument();
    });
  });

  it('shows OBS instructions when disconnected', async () => {
    const status: IngestStatusType = { connected: false };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText(/In OBS, set the/i)).toBeInTheDocument();
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

  it('does not show instructions when connected', async () => {
    const status: IngestStatusType = { connected: true };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText('OBS Connected')).toBeInTheDocument();
    });

    expect(screen.queryByText(/In OBS, set the/i)).not.toBeInTheDocument();
  });

  it('displays the ingest URL', async () => {
    const status: IngestStatusType = { connected: false };
    render(<IngestStatus status={status} />);

    await waitFor(() => {
      expect(screen.getByText('rtmp://localhost:1935/live')).toBeInTheDocument();
    });
  });
});
