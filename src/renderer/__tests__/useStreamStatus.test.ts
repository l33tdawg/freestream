import { renderHook, waitFor, act } from '@testing-library/react';
import { useStreamStatus } from '../hooks/useStreamStatus';
import type { IngestStatus, DestinationStatus } from '../../shared/types';

const mockStatusResponse = {
  ingest: { connected: true, codec: 'H.264', bitrate: 6000, fps: 60, resolution: '1920x1080' },
  destinations: [
    { id: 'd1', health: 'live' as const, bitrate: 5500, fps: 60 },
  ],
  isLive: true,
};

let capturedIngestCallback: ((status: IngestStatus) => void) | null = null;
let capturedDestCallback: ((status: DestinationStatus) => void) | null = null;

const unsubIngest = vi.fn();
const unsubDest = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  capturedIngestCallback = null;
  capturedDestCallback = null;

  (window.freestream.getStreamStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockStatusResponse);

  (window.freestream.onIngestStatusChanged as ReturnType<typeof vi.fn>).mockImplementation((cb: (status: IngestStatus) => void) => {
    capturedIngestCallback = cb;
    return unsubIngest;
  });

  (window.freestream.onDestinationStatusChanged as ReturnType<typeof vi.fn>).mockImplementation((cb: (status: DestinationStatus) => void) => {
    capturedDestCallback = cb;
    return unsubDest;
  });
});

describe('useStreamStatus', () => {
  it('has correct initial state', () => {
    // Prevent the async refresh from resolving during this sync check
    (window.freestream.getStreamStatus as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useStreamStatus());

    expect(result.current.ingest.connected).toBe(false);
    expect(result.current.destinationStatuses.size).toBe(0);
    expect(result.current.isLive).toBe(false);
  });

  it('calls getStreamStatus on mount and updates state', async () => {
    const { result } = renderHook(() => useStreamStatus());

    await waitFor(() => {
      expect(result.current.ingest.connected).toBe(true);
    });

    expect(window.freestream.getStreamStatus).toHaveBeenCalledTimes(1);
    expect(result.current.isLive).toBe(true);
    expect(result.current.destinationStatuses.get('d1')).toEqual(
      expect.objectContaining({ id: 'd1', health: 'live' })
    );
  });

  it('subscribes to onIngestStatusChanged and onDestinationStatusChanged', async () => {
    renderHook(() => useStreamStatus());

    await waitFor(() => {
      expect(window.freestream.onIngestStatusChanged).toHaveBeenCalledTimes(1);
    });

    expect(window.freestream.onDestinationStatusChanged).toHaveBeenCalledTimes(1);
    expect(capturedIngestCallback).toBeInstanceOf(Function);
    expect(capturedDestCallback).toBeInstanceOf(Function);
  });

  it('calls unsubscribe functions on unmount', async () => {
    const { unmount } = renderHook(() => useStreamStatus());

    await waitFor(() => {
      expect(window.freestream.onIngestStatusChanged).toHaveBeenCalled();
    });

    unmount();

    expect(unsubIngest).toHaveBeenCalled();
    expect(unsubDest).toHaveBeenCalled();
  });

  it('updates state when ingest event fires', async () => {
    const { result } = renderHook(() => useStreamStatus());

    await waitFor(() => {
      expect(capturedIngestCallback).not.toBeNull();
    });

    act(() => {
      capturedIngestCallback!({ connected: false });
    });

    expect(result.current.ingest.connected).toBe(false);
  });

  it('updates state when destination event fires', async () => {
    const { result } = renderHook(() => useStreamStatus());

    await waitFor(() => {
      expect(capturedDestCallback).not.toBeNull();
    });

    const newStatus: DestinationStatus = { id: 'd2', health: 'connecting', bitrate: 0 };

    act(() => {
      capturedDestCallback!(newStatus);
    });

    expect(result.current.destinationStatuses.get('d2')).toEqual(
      expect.objectContaining({ id: 'd2', health: 'connecting' })
    );
  });
});
