import { BrowserWindow } from 'electron';
import { LogEntry, LogLevel, LogSource } from '../shared/types';

let logWindow: BrowserWindow | null = null;
let idCounter = 0;

export function setLogWindow(win: BrowserWindow): void {
  logWindow = win;
  win.on('closed', () => { logWindow = null; });
}

export function log(source: LogSource, level: LogLevel, message: string): void {
  const entry: LogEntry = {
    id: ++idCounter,
    timestamp: Date.now(),
    source,
    level,
    message,
  };

  // Always print to stdout for dev mode
  const prefix = `[${source.toUpperCase()}]`;
  if (level === 'error') console.error(prefix, message);
  else if (level === 'warn') console.warn(prefix, message);
  else console.log(prefix, message);

  // Send to renderer if window exists
  if (logWindow && !logWindow.isDestroyed()) {
    logWindow.webContents.send('event:log-message', entry);
  }
}
