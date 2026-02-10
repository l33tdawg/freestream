# FreEstream

Free, open-source multi-streaming desktop app. Fan out a single RTMP stream to Twitch, YouTube, Facebook, TikTok, Instagram, and more — all at once, from your own machine.

No cloud relay. No monthly fees. Just you, OBS, and FreEstream.

## How It Works

```
OBS / Streamlabs ──RTMP──▶ FreEstream (localhost:1935) ──FFmpeg──▶ Twitch
                                                         ├──▶ YouTube
                                                         ├──▶ Facebook
                                                         ├──▶ TikTok
                                                         ├──▶ Kick
                                                         └──▶ ...
```

1. Point your streaming software at `rtmp://localhost:1935/live`
2. Add your destination platforms and stream keys in FreEstream
3. Hit **Go Live** — FreEstream fans out your stream to every enabled destination

## Features

- **Multi-platform streaming** — Twitch, YouTube, Facebook, TikTok, Instagram, Kick, X, Rumble, LinkedIn, Trovo, Bilibili, Soop, and custom RTMP
- **No cloud middleman** — streams go directly from your machine to each platform
- **Secure key storage** — stream keys are stored in your OS keychain (macOS Keychain / Windows Credential Vault / Linux Secret Service), never in plain text
- **Per-destination controls** — start, stop, and monitor each destination independently
- **Real-time health monitoring** — bitrate, FPS, uptime, and dropped frames per destination
- **Auto-reconnect** — configurable retry logic if a destination drops
- **Cross-platform** — macOS (DMG), Windows (NSIS installer), Linux (AppImage)
- **Dark theme** — easy on the eyes during long streams

## Prerequisites

- **FFmpeg** — must be installed and available on your PATH
  - macOS: `brew install ffmpeg`
  - Windows: download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
  - Linux: `sudo apt install ffmpeg` (or your distro's package manager)
- **Node.js 18+** (for development only)

## Installation

Download the latest release for your platform from the [Releases](../../releases) page.

### Build from source

```bash
git clone https://github.com/user/FreEstream.git
cd FreEstream
npm install
npm run dist
```

The distributable will be in the `release/` directory.

## Development

```bash
npm install
npm run dev
```

This starts the Electron main process (with TypeScript watch) and the Vite dev server for the renderer on port 5173.

### Other commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev mode (main watch + Vite dev server) |
| `npm run build` | Build both main and renderer |
| `npm start` | Run the compiled app |
| `npm run dist` | Build distributable (DMG / NSIS / AppImage) |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run test:coverage` | Run tests with coverage |

## Tech Stack

- **Electron 28** — desktop shell
- **React 18 + TypeScript** — renderer UI
- **Tailwind CSS** — styling
- **Vite** — renderer bundling and dev server
- **node-media-server** — local RTMP ingest server
- **FFmpeg** — stream transcoding and fan-out
- **electron-store** — persistent settings
- **keytar** — OS keychain integration for stream keys
- **electron-builder** — cross-platform packaging

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts           # Entry point, window creation
│   ├── nms.ts             # RTMP ingest server
│   ├── ffmpeg-manager.ts  # FFmpeg process management
│   ├── stream-monitor.ts  # Real-time status monitoring
│   ├── destination-manager.ts
│   ├── ipc-handlers.ts    # IPC handler registrations
│   ├── config.ts          # Persistent settings
│   ├── secrets.ts         # Keychain integration
│   ├── constants.ts       # Platform presets
│   └── preload.ts         # Secure IPC bridge
├── renderer/              # React frontend
│   ├── App.tsx
│   ├── components/        # Dashboard, DestinationCard, StreamControls, etc.
│   └── hooks/             # useDestinations, useStreamStatus
└── shared/
    └── types.ts           # Shared TypeScript types
```

## License

MIT License — see [LICENSE](LICENSE) for details.
