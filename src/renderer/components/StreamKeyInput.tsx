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
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] px-2.5 py-1 rounded-lg text-gray-500 hover:text-gray-300 transition-colors font-medium"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
