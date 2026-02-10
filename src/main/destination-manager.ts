import { v4 as uuidv4 } from 'uuid';
import { Destination, PlatformId } from '../shared/types';
import { getDestinations, setDestinations } from './config';
import { PLATFORM_PRESETS } from './constants';
import { deleteStreamKey } from './secrets';

export class DestinationManager {
  getAll(): Destination[] {
    return getDestinations();
  }

  getEnabled(): Destination[] {
    return getDestinations().filter((d) => d.enabled);
  }

  getById(id: string): Destination | undefined {
    return getDestinations().find((d) => d.id === id);
  }

  add(platform: PlatformId, name: string, url: string): Destination {
    const preset = PLATFORM_PRESETS[platform];
    const destination: Destination = {
      id: uuidv4(),
      platform,
      name: name || preset?.name || 'Custom',
      url: url || preset?.defaultUrl || '',
      enabled: true,
      createdAt: Date.now(),
    };

    const destinations = getDestinations();
    destinations.push(destination);
    setDestinations(destinations);

    return destination;
  }

  update(id: string, updates: Partial<Pick<Destination, 'name' | 'url' | 'enabled'>>): Destination | null {
    const destinations = getDestinations();
    const index = destinations.findIndex((d) => d.id === id);
    if (index === -1) return null;

    destinations[index] = { ...destinations[index], ...updates };
    setDestinations(destinations);
    return destinations[index];
  }

  async remove(id: string): Promise<boolean> {
    const destinations = getDestinations();
    const filtered = destinations.filter((d) => d.id !== id);
    if (filtered.length === destinations.length) return false;

    setDestinations(filtered);
    await deleteStreamKey(id).catch(() => {});
    return true;
  }

  toggle(id: string): Destination | null {
    const destinations = getDestinations();
    const dest = destinations.find((d) => d.id === id);
    if (!dest) return null;

    dest.enabled = !dest.enabled;
    setDestinations(destinations);
    return dest;
  }
}
