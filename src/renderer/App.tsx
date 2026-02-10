import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SettingsDialog from './components/SettingsDialog';
import AboutDialog from './components/AboutDialog';
import { useStreamStatus } from './hooks/useStreamStatus';
import { useDestinations } from './hooks/useDestinations';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const { ingest, destinationStatuses, isLive, refresh: refreshStatus } = useStreamStatus();
  const destinations = useDestinations();
  const enabledCount = destinations.destinations.filter((d) => d.enabled).length;

  return (
    <div className="h-screen flex bg-surface overflow-hidden">
      <Sidebar
        isLive={isLive}
        ingestConnected={ingest.connected}
        destinationCount={enabledCount}
        onSettingsClick={() => setShowSettings(true)}
        onAbout={() => setShowAbout(true)}
      />
      <Dashboard
        ingest={ingest}
        isLive={isLive}
        destinationStatuses={destinationStatuses}
        destinations={destinations}
        refreshStatus={refreshStatus}
        onSettingsClick={() => setShowSettings(true)}
      />
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
      <AboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
