import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface Props {
  content: string;
  position?: Position;
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

const ARROW_SIZE = 5;
const VIEWPORT_PADDING = 8;

function computeCoords(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  desired: Position
): { top: number; left: number; actual: Position } {
  const positions: Record<Position, { top: number; left: number }> = {
    top: {
      top: triggerRect.top - tooltipRect.height - ARROW_SIZE - 4,
      left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
    },
    bottom: {
      top: triggerRect.bottom + ARROW_SIZE + 4,
      left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
    },
    left: {
      top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.left - tooltipRect.width - ARROW_SIZE - 4,
    },
    right: {
      top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.right + ARROW_SIZE + 4,
    },
  };

  const fallbackOrder: Record<Position, Position[]> = {
    top: ['top', 'bottom', 'right', 'left'],
    bottom: ['bottom', 'top', 'right', 'left'],
    left: ['left', 'right', 'top', 'bottom'],
    right: ['right', 'left', 'top', 'bottom'],
  };

  for (const pos of fallbackOrder[desired]) {
    const coords = positions[pos];
    const fitsX = coords.left >= VIEWPORT_PADDING &&
      coords.left + tooltipRect.width <= window.innerWidth - VIEWPORT_PADDING;
    const fitsY = coords.top >= VIEWPORT_PADDING &&
      coords.top + tooltipRect.height <= window.innerHeight - VIEWPORT_PADDING;
    if (fitsX && fitsY) {
      return { ...coords, actual: pos };
    }
  }

  // Fallback: use desired position and clamp to viewport
  const coords = positions[desired];
  return {
    top: Math.max(VIEWPORT_PADDING, Math.min(coords.top, window.innerHeight - tooltipRect.height - VIEWPORT_PADDING)),
    left: Math.max(VIEWPORT_PADDING, Math.min(coords.left, window.innerWidth - tooltipRect.width - VIEWPORT_PADDING)),
    actual: desired,
  };
}

const arrowStyles: Record<Position, React.CSSProperties> = {
  top: {
    bottom: -ARROW_SIZE,
    left: '50%',
    transform: 'translateX(-50%)',
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderTop: `${ARROW_SIZE}px solid var(--color-tooltip-bg)`,
  },
  bottom: {
    top: -ARROW_SIZE,
    left: '50%',
    transform: 'translateX(-50%)',
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid var(--color-tooltip-bg)`,
  },
  left: {
    right: -ARROW_SIZE,
    top: '50%',
    transform: 'translateY(-50%)',
    borderTop: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid transparent`,
    borderLeft: `${ARROW_SIZE}px solid var(--color-tooltip-bg)`,
  },
  right: {
    left: -ARROW_SIZE,
    top: '50%',
    transform: 'translateY(-50%)',
    borderTop: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid var(--color-tooltip-bg)`,
  },
};

const transformOrigins: Record<Position, string> = {
  top: 'bottom center',
  bottom: 'top center',
  left: 'center right',
  right: 'center left',
};

export default function Tooltip({
  content,
  position = 'top',
  delay = 400,
  children,
  className = '',
}: Props) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; actual: Position } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(() => {
    if (!content) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [content, delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
    setCoords(null);
  }, []);

  // Position the tooltip once it becomes visible and is mounted
  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setCoords(computeCoords(triggerRect, tooltipRect, position));
  }, [visible, position]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const tooltip = visible
    ? ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`fixed z-[9999] pointer-events-none ${className}`}
          style={{
            top: coords ? coords.top : -9999,
            left: coords ? coords.left : -9999,
            opacity: coords ? 1 : 0,
            transform: coords ? 'scale(1)' : 'scale(0.95)',
            transformOrigin: transformOrigins[coords?.actual ?? position],
            transition: 'opacity 150ms ease-out, transform 150ms ease-out',
          }}
        >
          <div
            className="relative px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap backdrop-blur-sm"
            style={{
              background: 'var(--color-tooltip-bg)',
              border: '1px solid var(--color-tooltip-border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2)',
            }}
          >
            {content}
            <div
              className="absolute w-0 h-0"
              style={arrowStyles[coords?.actual ?? position]}
            />
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </div>
      {tooltip}
    </>
  );
}
