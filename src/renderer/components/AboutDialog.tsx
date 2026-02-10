import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const techStack = ['Electron', 'React', 'FFmpeg', 'Node.js', 'TypeScript'];

export default function AboutDialog({ isOpen, onClose }: Props) {
  const { isDark } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          {/* App name with gradient */}
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #e94560, #ff6b81)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FreEstream
          </h1>

          {/* Version */}
          <span
            className="mt-2 inline-block text-[11px] font-semibold tracking-widest uppercase px-2.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(233, 69, 96, 0.15)',
              color: '#e94560',
            }}
          >
            v1.0.0
          </span>

          {/* Tagline */}
          <p className="mt-4 text-[14px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Free multi-streaming for everyone
          </p>

          {/* Description */}
          <p className="mt-2 text-[12px] leading-relaxed max-w-[280px]" style={{ color: 'var(--color-text-muted)' }}>
            Fan out a single RTMP ingest to multiple streaming platforms simultaneously.
            No subscriptions, no limits, completely free.
          </p>

          {/* Divider */}
          <div
            className="w-full my-5"
            style={{ borderTop: '1px solid var(--color-divider)' }}
          />

          {/* Built by */}
          <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Built by
          </p>
          <p
            className="mt-1.5 text-[15px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #e94560, #ff6b81)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Dhillon '<span style={{ WebkitTextFillColor: 'inherit' }}>l33tdawg</span>' Kannabhiran
          </p>

          {/* Tech stack pills */}
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--color-pill-bg)',
                  color: 'var(--color-pill-text)',
                  border: '1px solid var(--color-pill-border)',
                }}
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-full my-5"
            style={{ borderTop: '1px solid var(--color-divider)' }}
          />

          {/* Footer text */}
          <p className="text-[11px] italic" style={{ color: 'var(--color-text-muted)' }}>
            Made with love for the streaming community
          </p>

          {/* Close button */}
          <button onClick={onClose} className="btn-secondary text-[13px] mt-5 px-6">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
