import * as keytar from 'keytar';

const SERVICE_NAME = 'FreEstream';

export async function setStreamKey(destinationId: string, key: string): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, destinationId, key);
}

export async function getStreamKey(destinationId: string): Promise<string | null> {
  return keytar.getPassword(SERVICE_NAME, destinationId);
}

export async function deleteStreamKey(destinationId: string): Promise<boolean> {
  return keytar.deletePassword(SERVICE_NAME, destinationId);
}
