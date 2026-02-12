import React from 'react';
import Tooltip from './Tooltip';
import { useTheme } from '../hooks/useTheme';

interface Props {
  isLive: boolean;
  ingestConnected: boolean;
  destinationCount: number;
  onSettingsClick: () => void;
}

export default function Sidebar({ isLive, ingestConnected, destinationCount, onSettingsClick }: Props) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className="w-[68px] flex flex-col items-center py-0 border-r select-none flex-shrink-0"
      style={{
        background: 'var(--color-sidebar-bg)',
        borderColor: 'var(--color-sidebar-border)',
      }}
    >
      {/* Drag region + logo */}
      <div className="drag-region w-full flex flex-col items-center pt-10 pb-6">
        <div
          className={`no-drag w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold tracking-tight transition-all duration-300 ${
            isLive
              ? 'text-white shadow-glow'
              : ''
          }`}
          style={{
            color: isLive ? undefined : 'var(--color-text-secondary)',
            background: isLive
              ? 'linear-gradient(135deg, #e94560, #d63851)'
              : 'var(--color-sidebar-hover)',
            boxShadow: isLive
              ? '0 0 20px rgba(233, 69, 96, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              : 'inset 0 1px 0 var(--color-glass-border)',
          }}
        >
          F
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex flex-col items-center gap-6 flex-1 pt-2">
        {/* OBS connection */}
        <Tooltip content={ingestConnected ? 'OBS Connected' : 'Waiting for OBS'} position="right">
          <div className="flex flex-col items-center gap-1.5 group cursor-default">
            <div className="relative">
              <div
                className={`w-[10px] h-[10px] rounded-full transition-all duration-500 ${
                  ingestConnected ? 'bg-success shadow-glow-success' : ''
                }`}
                style={!ingestConnected ? { background: 'var(--color-text-muted)' } : undefined}
              />
              {ingestConnected && (
                <div className="absolute inset-0 w-[10px] h-[10px] rounded-full bg-success animate-ping opacity-30" />
              )}
            </div>
            <span className="text-[10px] font-medium transition-colors tracking-wide uppercase" style={{ color: 'var(--color-text-muted)' }}>
              OBS
            </span>
          </div>
        </Tooltip>

        {/* Destination count */}
        <Tooltip content={`${destinationCount} active destination${destinationCount !== 1 ? 's' : ''}`} position="right">
          <div className="flex flex-col items-center gap-1 cursor-default">
            <span className="text-lg font-semibold tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{destinationCount}</span>
            <span className="text-[10px] font-medium tracking-wide uppercase" style={{ color: 'var(--color-text-muted)' }}>Dest</span>
          </div>
        </Tooltip>

        {/* Live indicator */}
        {isLive && (
          <div className="flex flex-col items-center gap-1.5 animate-fade-in">
            <div className="w-[10px] h-[10px] rounded-full bg-red-500 animate-live-dot" />
            <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Theme & Settings */}
      <div className="pb-3 flex flex-col items-center gap-1">
        <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'} position="right">
          <button
            onClick={toggleTheme}
            className="no-drag p-2.5 rounded-xl transition-all duration-200"
            style={{ background: 'transparent', color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            {isDark ? (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </Tooltip>
        <Tooltip content="Settings" position="right">
          <button
            onClick={onSettingsClick}
            className="no-drag p-2.5 rounded-xl transition-all duration-200"
            style={{ background: 'transparent', color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </Tooltip>

        {/* Credit + version */}
        <div className="mt-2 flex flex-col items-center gap-0.5">
          <span className="text-[8px] tracking-wide" style={{ color: 'var(--color-text-faint)' }}>v1.4.0</span>
          <span className="text-[8px] tracking-wide" style={{ color: 'var(--color-text-faint)' }}>@l33tdawg</span>
        </div>
      </div>
    </div>
  );
}
