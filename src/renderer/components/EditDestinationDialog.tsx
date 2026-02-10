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
              <p className="text-[12px] text-gray-500 mt-0.5">Update your streaming destination settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">RTMP URL</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input-field font-mono text-[13px]" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Stream Key</label>
            <StreamKeyInput
              value={streamKey}
              onChange={setStreamKey}
              placeholder={loadedKey ? 'Enter new stream key' : 'Loading...'}
            />
            <p className="text-[11px] text-gray-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Stored securely in your OS keychain
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-[13px]">Cancel</button>
            <button type="submit" className="btn-primary text-[13px]">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
