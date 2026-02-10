import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Tooltip from '../components/Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children without showing tooltip initially', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip content after mouseenter + delay', () => {
    render(
      <Tooltip content="Help text" delay={400}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(trigger);

    // Not visible before delay elapses
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('uses default delay of 400ms', () => {
    render(
      <Tooltip content="Default delay">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(trigger);

    // Not visible at 399ms
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Visible at 400ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on mouseleave', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides tooltip on mouseleave before delay completes', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Leave before the timer fires
    fireEvent.mouseLeave(trigger);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'supports position="%s"',
    (position) => {
      render(
        <Tooltip content="Positioned tooltip" position={position}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me').parentElement!;
      fireEvent.mouseEnter(trigger);

      act(() => {
        vi.advanceTimersByTime(400);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(screen.getByText('Positioned tooltip')).toBeInTheDocument();
    }
  );

  it('applies custom className to the tooltip element', () => {
    render(
      <Tooltip content="Styled tooltip" className="my-custom-class">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('my-custom-class');
  });

  it('does not show tooltip when content is empty string', () => {
    render(
      <Tooltip content="">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('uses createPortal to render tooltip in document.body', () => {
    render(
      <Tooltip content="Portal tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.parentElement).toBe(document.body);
  });

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = render(
      <Tooltip content="Cleanup tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(trigger);

    // Unmount while the timer is still pending
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('renders tooltip with fixed positioning and z-index', () => {
    render(
      <Tooltip content="Styled tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('fixed');
    expect(tooltip.className).toContain('z-[9999]');
    expect(tooltip.className).toContain('pointer-events-none');
  });

  it('shows tooltip on focus and hides on blur', () => {
    render(
      <Tooltip content="Focus tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;

    fireEvent.focus(trigger);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('respects custom delay value', () => {
    render(
      <Tooltip content="Custom delay" delay={1000}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
