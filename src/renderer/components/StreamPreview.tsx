import React, { useRef, useEffect, useState, useCallback } from 'react';
import mpegts from 'mpegts.js';

interface Props {
  previewUrl: string;
}

const METER_SEGMENTS = 16;

export default function StreamPreview({ previewUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<mpegts.Player | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const peakDecayRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('freestream-preview-volume');
    return saved !== null ? parseInt(saved, 10) : 75;
  });
  const [muted, setMuted] = useState(() => {
    const saved = localStorage.getItem('freestream-preview-muted');
    return saved !== null ? saved === 'true' : true;
  });

  const cleanup = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    gainRef.current = null;
  }, []);

  useEffect(() => {
    if (!previewUrl || !videoRef.current) return;

    if (!mpegts.isSupported()) {
      setError('Preview not supported in this environment');
      return;
    }

    setError(null);

    const player = mpegts.createPlayer({
      type: 'flv',
      isLive: true,
      url: previewUrl,
    }, {
      enableWorker: false,
      liveBufferLatencyChasing: true,
      liveBufferLatencyMaxLatency: 0.6,
      liveBufferLatencyMinRemain: 0.15,
      liveBufferLatencyChasingOnPaused: true,
    });

    player.attachMediaElement(videoRef.current);
    player.load();
    player.play();
    playerRef.current = player;

    player.on(mpegts.Events.ERROR, () => {
      setError('Preview connection lost');
    });

    // Set up Web Audio API for audio level metering
    const videoEl = videoRef.current;
    const setupAudio = () => {
      try {
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaElementSource(videoEl);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const gain = audioCtx.createGain();
        gain.gain.value = muted ? 0 : volume / 100;
        gainRef.current = gain;

        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(audioCtx.destination);

        analyserRef.current = analyser;

        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        // Start audio level animation loop (~20fps to reduce CPU)
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let lastUpdate = 0;
        const METER_INTERVAL = 50; // ms (~20fps)
        const updateLevels = (timestamp: number) => {
          if (!analyserRef.current) return;

          if (timestamp - lastUpdate >= METER_INTERVAL) {
            lastUpdate = timestamp;
            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate RMS level
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const val = dataArray[i] / 255;
              sum += val * val;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const level = Math.min(1, rms * 2.5); // boost for visibility

            setAudioLevel(level);

            // Peak hold with decay
            if (level > peakDecayRef.current) {
              peakDecayRef.current = level;
            } else {
              peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.02);
            }
            setPeakLevel(peakDecayRef.current);
          }

          animFrameRef.current = requestAnimationFrame(updateLevels);
        };
        animFrameRef.current = requestAnimationFrame(updateLevels);
      } catch {
        // Audio analysis is optional - preview still works without it
      }
    };

    // Set up audio after video starts playing
    videoEl.addEventListener('playing', setupAudio, { once: true });

    return () => {
      videoEl.removeEventListener('playing', setupAudio);
      cleanup();
    };
  }, [previewUrl, cleanup]);

  // Update gain when volume or muted changes
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = muted ? 0 : volume / 100;
    }
  }, [volume, muted]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem('freestream-preview-muted', String(next));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    localStorage.setItem('freestream-preview-volume', String(val));
    if (val > 0 && muted) {
      setMuted(false);
      localStorage.setItem('freestream-preview-muted', 'false');
    } else if (val === 0 && !muted) {
      setMuted(true);
      localStorage.setItem('freestream-preview-muted', 'true');
    }
  };

  const getSegmentColor = (index: number, total: number) => {
    const ratio = index / total;
    if (ratio > 0.85) return '#ef4444'; // red
    if (ratio > 0.65) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  const VolumeIcon = () => {
    if (muted || volume === 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-3.15a.75.75 0 011.28.53v13.74a.75.75 0 01-1.28.53L6.75 14.25H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      );
    }
    if (volume < 50) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M6.75 8.25l4.72-3.15a.75.75 0 011.28.53v13.74a.75.75 0 01-1.28.53L6.75 14.25H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-3.15a.75.75 0 011.28.53v13.74a.75.75 0 01-1.28.53L6.75 14.25H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    );
  };

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        {/* Video preview */}
        <div className="flex-1 relative rounded-xl overflow-hidden" style={{ background: '#000', minHeight: '200px' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            style={{ maxHeight: '300px' }}
            playsInline
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
            </div>
          )}
          {/* PREVIEW label */}
          <div className="absolute top-2 left-2">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.6)' }}
            >
              Preview
            </span>
          </div>
        </div>

        {/* Audio level meter */}
        <div className="flex flex-col items-center gap-1" style={{ width: '24px' }}>
          <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            dB
          </span>
          <div
            className="flex-1 flex flex-col-reverse gap-[2px] rounded-lg p-1"
            style={{ background: 'var(--color-ingest-box-bg)', border: '1px solid var(--color-ingest-box-border)', minHeight: '180px' }}
          >
            {Array.from({ length: METER_SEGMENTS }).map((_, i) => {
              const segThreshold = i / METER_SEGMENTS;
              const lit = audioLevel >= segThreshold;
              const isPeak = Math.abs(peakLevel - segThreshold) < (1 / METER_SEGMENTS) && peakLevel > 0.05;
              return (
                <div
                  key={i}
                  className="rounded-sm transition-opacity duration-75"
                  style={{
                    height: '4px',
                    width: '100%',
                    background: lit || isPeak ? getSegmentColor(i, METER_SEGMENTS) : 'var(--color-meter-segment-off)',
                    opacity: lit ? 1 : isPeak ? 0.7 : 1,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Volume control bar */}
      <div
        className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl"
        style={{
          background: 'var(--color-ingest-box-bg)',
          border: '1px solid var(--color-ingest-box-border)',
        }}
      >
        <button
          onClick={handleToggleMute}
          className="flex-shrink-0 p-0.5 rounded transition-colors duration-150"
          style={{ color: muted ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}
        >
          <VolumeIcon />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #e94560 0%, #e94560 ${muted ? 0 : volume}%, var(--color-meter-segment-off) ${muted ? 0 : volume}%, var(--color-meter-segment-off) 100%)`,
            accentColor: '#e94560',
          }}
        />
        <span className="text-[11px] font-mono tabular-nums w-8 text-right" style={{ color: 'var(--color-text-muted)' }}>
          {muted ? 0 : volume}%
        </span>
      </div>
    </div>
  );
}
