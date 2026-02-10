import type { FreEstreamAPI } from '../main/preload';

declare global {
  interface Window {
    freestream: FreEstreamAPI;
  }
}

export {};
