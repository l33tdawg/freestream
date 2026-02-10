import React from 'react';
import { render, screen } from '@testing-library/react';
import HealthIndicator from '../components/HealthIndicator';
import type { DestinationHealth } from '../../shared/types';

describe('HealthIndicator', () => {
  const healthStates: { health: DestinationHealth; label: string; colorClass: string; pulse: boolean }[] = [
    { health: 'idle', label: 'Idle', colorClass: 'bg-gray-500', pulse: false },
    { health: 'connecting', label: 'Connecting', colorClass: 'bg-yellow-400', pulse: true },
    { health: 'live', label: 'Live', colorClass: 'bg-success', pulse: false },
    { health: 'error', label: 'Error', colorClass: 'bg-red-400', pulse: false },
    { health: 'retrying', label: 'Retrying', colorClass: 'bg-orange-400', pulse: true },
  ];

  it.each(healthStates)('renders "$health" state with label "$label"', ({ health, label }) => {
    render(<HealthIndicator health={health} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each(healthStates)('renders correct CSS color class for "$health"', ({ health, colorClass }) => {
    const { container } = render(<HealthIndicator health={health} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).toContain(colorClass);
  });

  it.each(healthStates.filter((s) => s.pulse))('renders animate-pulse for "$health"', ({ health }) => {
    const { container } = render(<HealthIndicator health={health} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).toContain('animate-pulse');
  });

  it.each(healthStates.filter((s) => !s.pulse))('does not render animate-pulse for "$health"', ({ health }) => {
    const { container } = render(<HealthIndicator health={health} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).not.toContain('animate-pulse');
  });

  it('hides label when showLabel=false', () => {
    render(<HealthIndicator health="live" showLabel={false} />);
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('uses sm size class when size="sm"', () => {
    const { container } = render(<HealthIndicator health="live" size="sm" />);
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).toContain('w-[6px]');
    expect(dot?.className).toContain('h-[6px]');
  });

  it('uses md size class by default', () => {
    const { container } = render(<HealthIndicator health="live" />);
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).toContain('w-2');
    expect(dot?.className).toContain('h-2');
  });
});
