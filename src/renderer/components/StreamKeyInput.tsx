import React, { useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function StreamKeyInput({ value, onChange, placeholder = 'Enter stream key' }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pr-16 font-mono text-[13px]"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] px-2.5 py-1 rounded-lg transition-colors font-medium"
        style={{ background: 'var(--color-copy-btn-bg)', color: 'var(--color-text-muted)' }}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
