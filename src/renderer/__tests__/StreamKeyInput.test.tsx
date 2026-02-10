import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StreamKeyInput from '../components/StreamKeyInput';

describe('StreamKeyInput', () => {
  it('renders an input with the given value', () => {
    render(<StreamKeyInput value="my-secret-key" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('Enter stream key') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('my-secret-key');
  });

  it('defaults to password type', () => {
    render(<StreamKeyInput value="" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('Enter stream key') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('calls onChange when typing', () => {
    const handleChange = vi.fn();
    render(<StreamKeyInput value="" onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Enter stream key');
    fireEvent.change(input, { target: { value: 'new-key' } });
    expect(handleChange).toHaveBeenCalledWith('new-key');
  });

  it('toggles input type between password and text when Show/Hide is clicked', () => {
    render(<StreamKeyInput value="secret" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('Enter stream key') as HTMLInputElement;
    const toggleBtn = screen.getByText('Show');

    expect(input.type).toBe('password');

    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');
    expect(screen.getByText('Hide')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide'));
    expect(input.type).toBe('password');
    expect(screen.getByText('Show')).toBeInTheDocument();
  });

  it('uses custom placeholder when provided', () => {
    render(<StreamKeyInput value="" onChange={() => {}} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });
});
