import { app, BrowserWindow, Tray, Menu, nativeImage, nativeTheme } from 'electron';
import path from 'path';
import { NMSWrapper } from './nms';
import { FFmpegManager } from './ffmpeg-manager';
import { DestinationManager } from './destination-manager';
import { StreamMonitor } from './stream-monitor';
import { registerIpcHandlers } from './ipc-handlers';
import { getSettings } from './config';
import { APP_NAME } from './constants';
import { setLogWindow, log } from './logger';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let nms: NMSWrapper;
let ffmpegManager: FFmpegManager;
let destinationManager: DestinationManager;
let streamMonitor: StreamMonitor;

function createWindow(): BrowserWindow {
  nativeTheme.themeSource = 'dark';

  const win = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 1000,
    minHeight: 720,
    title: APP_NAME,
    backgroundColor: '#0d0d1a',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    show: false,
    roundedCorners: true,
  });

  // Smooth window appearance
  win.once('ready-to-show', () => {
    win.show();
  });

  // Log renderer console messages to main process stdout
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}] ${message} (${sourceId}:${line})`);
  });

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  return win;
}

function createTrayIcon(): Electron.NativeImage {
  // Programmatic 16x16 tray icon — white circle for idle
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2, r = 5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) {
        const alpha = Math.min(1, Math.max(0, r - dist + 0.5));
        canvas[idx] = 255;     // R
        canvas[idx + 1] = 255; // G
        canvas[idx + 2] = 255; // B
        canvas[idx + 3] = Math.round(alpha * 200); // A
      }
    }
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

function createTray(): void {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip(APP_NAME);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show FreEstream', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });
}

async function initializeServices(): Promise<void> {
  const settings = getSettings();

  nms = new NMSWrapper(settings.rtmpPort);
  nms.start();

  ffmpegManager = new FFmpegManager();
  const ffmpegPath = await ffmpegManager.initialize();
  if (!ffmpegPath) {
    log('app', 'warn', 'FFmpeg not found. Fan-out will not work until FFmpeg is installed.');
  } else {
    log('app', 'info', `FFmpeg found at: ${ffmpegPath}`);
  }

  destinationManager = new DestinationManager();
  streamMonitor = new StreamMonitor(nms, ffmpegManager);
}

app.whenReady().then(async () => {
  await initializeServices();

  mainWindow = createWindow();
  setLogWindow(mainWindow);

  registerIpcHandlers(mainWindow, nms, ffmpegManager, destinationManager, streamMonitor);

  const settings = getSettings();
  if (settings.minimizeToTray) {
    createTray();
  }

  mainWindow.on('close', (event) => {
    if (tray && settings.minimizeToTray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createWindow();
    setLogWindow(mainWindow);
    registerIpcHandlers(mainWindow, nms, ffmpegManager, destinationManager, streamMonitor);
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', async () => {
  streamMonitor?.stopPolling();
  await ffmpegManager?.stopAll();
  nms?.stop();
});
