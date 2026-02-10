import { renderHook, waitFor, act } from '@testing-library/react';
import { useDestinations } from '../hooks/useDestinations';
import type { Destination } from '../../shared/types';

const mockDests: Destination[] = [
  { id: '1', platform: 'twitch', name: 'My Twitch', url: 'rtmp://live.twitch.tv/app', enabled: true, createdAt: 1000 },
  { id: '2', platform: 'youtube', name: 'My YouTube', url: 'rtmp://a.rtmp.youtube.com/live2', enabled: false, createdAt: 2000 },
];

beforeEach(() => {
  vi.clearAllMocks();
  (window.freestream.getDestinations as ReturnType<typeof vi.fn>).mockResolvedValue(mockDests);
  (window.freestream.addDestination as ReturnType<typeof vi.fn>).mockResolvedValue(mockDests[0]);
  (window.freestream.updateDestination as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (window.freestream.removeDestination as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (window.freestream.toggleDestination as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});

describe('useDestinations', () => {
  it('starts with loading=true, then sets loading=false after mount', async () => {
    const { result } = renderHook(() => useDestinations());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('calls getDestinations on mount and populates state', async () => {
    const { result } = renderHook(() => useDestinations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(window.freestream.getDestinations).toHaveBeenCalledTimes(1);
    expect(result.current.destinations).toEqual(mockDests);
  });

  it('add() calls addDestination and refreshes the list', async () => {
    const { result } = renderHook(() => useDestinations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.add('twitch', 'New Twitch', 'rtmp://live.twitch.tv/app', 'key123');
    });

    expect(window.freestream.addDestination).toHaveBeenCalledWith('twitch', 'New Twitch', 'rtmp://live.twitch.tv/app', 'key123');
    // getDestinations called once on mount + once on refresh after add
    expect(window.freestream.getDestinations).toHaveBeenCalledTimes(2);
  });

  it('update() calls updateDestination and refreshes the list', async () => {
    const { result } = renderHook(() => useDestinations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.update('1', { name: 'Updated Twitch' }, 'newkey');
    });

    expect(window.freestream.updateDestination).toHaveBeenCalledWith('1', { name: 'Updated Twitch' }, 'newkey');
    expect(window.freestream.getDestinations).toHaveBeenCalledTimes(2);
  });

  it('remove() calls removeDestination and refreshes the list', async () => {
    const { result } = renderHook(() => useDestinations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.remove('1');
    });

    expect(window.freestream.removeDestination).toHaveBeenCalledWith('1');
    expect(window.freestream.getDestinations).toHaveBeenCalledTimes(2);
  });

  it('toggle() calls toggleDestination and refreshes the list', async () => {
    const { result } = renderHook(() => useDestinations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggle('2');
    });

    expect(window.freestream.toggleDestination).toHaveBeenCalledWith('2');
    expect(window.freestream.getDestinations).toHaveBeenCalledTimes(2);
  });

  it('handles errors gracefully without crashing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (window.freestream.getDestinations as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDestinations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load destinations:', expect.any(Error));
    expect(result.current.destinations).toEqual([]);

    consoleSpy.mockRestore();
  });
});
