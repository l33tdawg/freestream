import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AboutDialog from '../components/AboutDialog';

describe('AboutDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<AboutDialog isOpen={false} onClose={defaultProps.onClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders when isOpen is true', () => {
    render(<AboutDialog {...defaultProps} />);
    expect(screen.getByText('FreEstream')).toBeInTheDocument();
  });

  it('shows "FreEstream" app name', () => {
    render(<AboutDialog {...defaultProps} />);
    expect(screen.getByText('FreEstream')).toBeInTheDocument();
  });

  it('shows version "v1.0.0"', () => {
    render(<AboutDialog {...defaultProps} />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('shows tagline "Free multi-streaming for everyone"', () => {
    render(<AboutDialog {...defaultProps} />);
    expect(screen.getByText('Free multi-streaming for everyone')).toBeInTheDocument();
  });

  it('shows the description text', () => {
    render(<AboutDialog {...defaultProps} />);
    expect(
      screen.getByText(/Fan out a single RTMP ingest to multiple streaming platforms simultaneously/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No subscriptions, no limits, completely free/)
    ).toBeInTheDocument();
  });

  it('shows "Built by" with "Dhillon" and "l33tdawg" and "Kannabhiran"', () => {
    render(<AboutDialog {...defaultProps} />);
    expect(screen.getByText('Built by')).toBeInTheDocument();
    expect(screen.getByText(/Dhillon/)).toBeInTheDocument();
    expect(screen.getByText(/l33tdawg/)).toBeInTheDocument();
    expect(screen.getByText(/Kannabhiran/)).toBeInTheDocument();
  });

  it.each(['Electron', 'React', 'FFmpeg', 'Node.js', 'TypeScript'])(
    'shows tech stack pill "%s"',
    (tech) => {
      render(<AboutDialog {...defaultProps} />);
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  );

  it('shows "Made with love for the streaming community"', () => {
    render(<AboutDialog {...defaultProps} />);
    expect(screen.getByText('Made with love for the streaming community')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<AboutDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<AboutDialog {...defaultProps} />);
    const backdrop = screen.getByText('FreEstream').closest('.modal-backdrop')!;
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
