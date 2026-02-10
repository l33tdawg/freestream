import Store from 'electron-store';
import { AppSettings, Destination } from '../shared/types';
import { DEFAULT_SETTINGS } from './constants';

interface StoreSchema {
  settings: AppSettings;
  destinations: Destination[];
}

const store = new Store<StoreSchema>({
  name: 'freestream-config',
  defaults: {
    settings: DEFAULT_SETTINGS,
    destinations: [],
  },
});

export function getSettings(): AppSettings {
  return store.get('settings');
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...partial };
  store.set('settings', updated);
  return updated;
}

export function getDestinations(): Destination[] {
  return store.get('destinations');
}

export function setDestinations(destinations: Destination[]): void {
  store.set('destinations', destinations);
}

export { store };
