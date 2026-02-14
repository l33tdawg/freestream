import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SettingsDialog from './components/SettingsDialog';
import { useStreamStatus } from './hooks/useStreamStatus';
import { useDestinations } from './hooks/useDestinations';
import { useAppLogs } from './hooks/useAppLogs';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const { ingest, destinationStatuses, isLive, refresh: refreshStatus } = useStreamStatus();
  const destinations = useDestinations();
  const { logs, clear: clearLogs } = useAppLogs();
  const enabledCount = destinations.destinations.filter((d) => d.enabled).length;

  return (
    <div className="h-screen flex bg-surface overflow-hidden">
      <Sidebar
        isLive={isLive}
        ingestConnected={ingest.connected}
        destinationCount={enabledCount}
        consoleOpen={showConsole}
        onConsoleToggle={() => setShowConsole((v) => !v)}
        onSettingsClick={() => setShowSettings(true)}
      />
      <Dashboard
        ingest={ingest}
        isLive={isLive}
        destinationStatuses={destinationStatuses}
        destinations={destinations}
        refreshStatus={refreshStatus}
        consoleOpen={showConsole}
        logs={logs}
        onConsoleClear={clearLogs}
        onConsoleToggle={() => setShowConsole((v) => !v)}
      />
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
