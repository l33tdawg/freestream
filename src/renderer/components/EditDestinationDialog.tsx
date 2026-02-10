import React, { useState, useEffect } from 'react';
import { Destination } from '../../shared/types';
import StreamKeyInput from './StreamKeyInput';
import PlatformIcon from './PlatformIcon';
import { useTheme } from '../hooks/useTheme';

interface Props {
  destination: Destination | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Destination>, streamKey?: string) => void;
}

export default function EditDestinationDialog({ destination, open, onClose, onSave }: Props) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [loadedKey, setLoadedKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (destination && open) {
      setName(destination.name);
      setUrl(destination.url);
      setStreamKey('');
      setLoadedKey(false);

      window.freestream.getStreamKey(destination.id).then((key) => {
        if (key) setStreamKey(key);
        setLoadedKey(true);
      });
    }
  }, [destination, open]);

  const handleTest = async () => {
    if (!url || !streamKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.freestream.testConnection(url, streamKey);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: 'Test failed unexpectedly' });
    } finally {
      setTesting(false);
    }
  };

  if (!open || !destination) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(destination.id, { name, url }, streamKey || undefined);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={destination.platform} size={20} />
            <div>
              <h2 className="text-[17px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Edit Destination</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Update your streaming destination settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>RTMP URL</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input-field font-mono text-[13px]" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Stream Key</label>
            <StreamKeyInput
              value={streamKey}
              onChange={setStreamKey}
              placeholder={loadedKey ? 'Enter new stream key' : 'Loading...'}
            />
            <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <svg className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Stored securely in your OS keychain
            </p>
          </div>

          {/* Test Connection */}
          {url && streamKey && (
            <div>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="btn-secondary text-[12px] w-full flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Testing connection...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Test Connection
                  </>
                )}
              </button>
              {testResult && (
                <div
                  className="mt-2 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2"
                  style={{
                    background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    color: testResult.success ? '#22c55e' : '#ef4444',
                  }}
                >
                  {testResult.success ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{testResult.success ? 'Connection successful — stream key is valid' : testResult.error}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-[13px]">Cancel</button>
            <button type="submit" className="btn-primary text-[13px]">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
