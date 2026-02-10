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
  const animFrameRef = useRef<number>(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const peakDecayRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

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
      liveBufferLatencyMaxLatency: 1.5,
      liveBufferLatencyMinRemain: 0.3,
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

        // Route: source -> analyser -> gain(0) -> destination
        // This lets us analyze audio without playing it
        const gain = audioCtx.createGain();
        gain.gain.value = 0;

        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(audioCtx.destination);

        analyserRef.current = analyser;

        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        // Start audio level animation loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevels = () => {
          if (!analyserRef.current) return;
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
            peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.01);
          }
          setPeakLevel(peakDecayRef.current);

          animFrameRef.current = requestAnimationFrame(updateLevels);
        };
        updateLevels();
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

  const getSegmentColor = (index: number, total: number) => {
    const ratio = index / total;
    if (ratio > 0.85) return '#ef4444'; // red
    if (ratio > 0.65) return '#eab308'; // yellow
    return '#22c55e'; // green
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
            muted
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
    </div>
  );
}
