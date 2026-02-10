import React, { useState, useEffect } from 'react';
import { Destination, DestinationStatus, IngestStatus as IngestStatusType, PlatformPreset } from '../../shared/types';
import DestinationCard from './DestinationCard';
import AddDestinationDialog from './AddDestinationDialog';
import EditDestinationDialog from './EditDestinationDialog';
import StreamControls from './StreamControls';
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
  onSettingsClick: () => void;
}

export default function Dashboard({ ingest, isLive, destinationStatuses, destinations, refreshStatus, onSettingsClick }: Props) {
  const { isDark } = useTheme();
  const { destinations: dests, add, update, remove, toggle } = destinations;
  const [presets, setPresets] = useState<Record<string, PlatformPreset>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);

  useEffect(() => {
    window.freestream.getPlatformPresets().then(setPresets);
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
        <Tooltip content="Settings" position="bottom">
          <button
            onClick={onSettingsClick}
            className="no-drag p-2 rounded-lg transition-all duration-150"
            style={{ background: 'transparent', color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-2xl mx-auto space-y-4">
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
                  onToggle={() => toggle(dest.id)}
                  onEdit={() => setEditingDest(dest)}
                  onRemove={() => handleRemove(dest.id)}
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
