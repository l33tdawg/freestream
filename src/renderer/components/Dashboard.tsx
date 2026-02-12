import React, { useState, useEffect } from 'react';
import { AvailableEncoders, Destination, DestinationStatus, EncodingSettings, IngestStatus as IngestStatusType, PlatformPreset, VideoEncoder } from '../../shared/types';
import DestinationCard from './DestinationCard';
import AddDestinationDialog from './AddDestinationDialog';
import EditDestinationDialog from './EditDestinationDialog';
import StreamControls from './StreamControls';
import BandwidthMeter from './BandwidthMeter';
import IngestStatus from './IngestStatus';
import Tooltip from './Tooltip';
import { useTheme } from '../hooks/useTheme';

interface DestinationsHook {
  destinations: Destination[];
  loading: boolean;
  add: (platform: any, name: string, url: string, streamKey: string) => Promise<any>;
  update: (id: string, updates: Partial<Destination>, streamKey?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

interface Props {
  ingest: IngestStatusType;
  isLive: boolean;
  destinationStatuses: Map<string, DestinationStatus>;
  destinations: DestinationsHook;
  refreshStatus: () => Promise<void>;
}

export default function Dashboard({ ingest, isLive, destinationStatuses, destinations, refreshStatus }: Props) {
  const { isDark } = useTheme();
  const { destinations: dests, add, update, remove, toggle } = destinations;
  const [presets, setPresets] = useState<Record<string, PlatformPreset>>({});
  const [encodingPresets, setEncodingPresets] = useState<Record<string, { bitrate: number; resolution: string; fps: number }>>({});
  const [availableEncoders, setAvailableEncoders] = useState<AvailableEncoders>({ hardware: [], software: ['libx264'] });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);

  useEffect(() => {
    window.freestream.getPlatformPresets().then(setPresets);
    window.freestream.getEncodingPresets().then(setEncodingPresets).catch(() => {});
    window.freestream.detectEncoders().then(setAvailableEncoders).catch(() => {});
  }, []);

  const handleGoLive = async () => {
    const result = await window.freestream.goLive();
    if (!result.success) {
      alert(result.error);
    }
    refreshStatus();
  };

  const handleStopAll = async () => {
    await window.freestream.stopAll();
    refreshStatus();
  };

  const handleRemove = async (id: string) => {
    if (confirm('Remove this destination?')) {
      await remove(id);
    }
  };

  const handleAutoEncode = async (dest: Destination) => {
    const preset = encodingPresets[dest.platform];
    const bestEncoder: VideoEncoder = availableEncoders.hardware[0] || 'libx264';
    const encoding: EncodingSettings = {
      encoder: bestEncoder,
      bitrate: preset?.bitrate || 4000,
      resolution: (preset?.resolution as EncodingSettings['resolution']) || '1080p',
      fps: preset?.fps || 30,
      x264Preset: bestEncoder === 'libx264' ? 'veryfast' : undefined,
    };
    await update(dest.id, { encoding });
  };

  const enabledCount = dests.filter((d) => d.enabled).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Title bar drag region */}
      <div className="drag-region h-12 flex-shrink-0 flex items-center justify-between px-6">
        <div className="no-drag flex items-center gap-3 pl-16">
          <h1 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--color-text-secondary)' }}>FreEstream</h1>
          {isLive && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest animate-fade-in"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              Live
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Ingest */}
          <IngestStatus status={ingest} />

          {/* Go Live */}
          <StreamControls
            isLive={isLive}
            ingestConnected={ingest.connected}
            hasEnabledDestinations={enabledCount > 0}
            onGoLive={handleGoLive}
            onStopAll={handleStopAll}
          />

          {/* Bandwidth meter */}
          <BandwidthMeter destinationStatuses={destinationStatuses} />

          {/* Destinations header */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Destinations
              {enabledCount > 0 && (
                <span className="ml-2" style={{ color: 'var(--color-text-faint)' }}>{enabledCount} active</span>
              )}
            </h3>
            <Tooltip content="Add a new streaming destination" position="left">
              <button
                onClick={() => setShowAddDialog(true)}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all duration-150 text-accent hover:text-accent-hover flex items-center gap-1"
                style={{ background: 'rgba(233, 69, 96, 0.08)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 0.14)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 0.08)')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add
              </button>
            </Tooltip>
          </div>

          {/* Destination list */}
          {dests.length === 0 ? (
            <div className="card text-center py-12">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: 'rgba(233, 69, 96, 0.06)',
                  border: '1px solid rgba(233, 69, 96, 0.1)',
                }}
              >
                <svg className="w-7 h-7 text-accent/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>No destinations yet</p>
              <p className="text-[12px] mt-1.5 max-w-[260px] mx-auto leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Add a streaming platform to start multi-streaming to multiple services simultaneously
              </p>
              <button
                onClick={() => setShowAddDialog(true)}
                className="mt-4 text-[12px] font-medium px-4 py-2 rounded-xl transition-all duration-200 text-accent hover:text-accent-hover inline-flex items-center gap-1.5"
                style={{
                  background: 'rgba(233, 69, 96, 0.08)',
                  border: '1px solid rgba(233, 69, 96, 0.15)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 0.14)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 0.08)')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Your First Destination
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {dests.map((dest) => (
                <DestinationCard
                  key={dest.id}
                  destination={dest}
                  preset={presets[dest.platform]}
                  status={destinationStatuses.get(dest.id)}
                  ingest={ingest}
                  encodingPreset={encodingPresets[dest.platform]}
                  onToggle={() => toggle(dest.id)}
                  onEdit={() => setEditingDest(dest)}
                  onRemove={() => handleRemove(dest.id)}
                  onAutoEncode={() => handleAutoEncode(dest)}
                />
              ))}
            </div>
          )}

          {/* Footer credit */}
          <div className="pt-6 pb-2 text-center">
            <p className="text-[10px] tracking-wide" style={{ color: 'var(--color-text-faint)' }}>
              FreEstream by Dhillon Kannabhiran
            </p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddDestinationDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={add}
      />
      <EditDestinationDialog
        destination={editingDest}
        open={!!editingDest}
        onClose={() => setEditingDest(null)}
        onSave={update}
      />
    </div>
  );
}
