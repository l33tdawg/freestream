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

- **Multi-platform streaming** — Twitch, YouTube, Facebook, TikTok, Instagram, Kick, X, Rumble, LinkedIn, Trovo, Bilibili, Soop, Mixcloud, and custom RTMP
- **No cloud middleman** — streams go directly from your machine to each platform
- **Secure key storage** — stream keys are stored in your OS keychain (macOS Keychain / Windows Credential Vault / Linux Secret Service), never in plain text
- **Per-destination controls** — start, stop, and monitor each destination independently
- **Real-time health monitoring** — bitrate, FPS, uptime, and dropped frames per destination
- **Auto-reconnect** — configurable retry logic if a destination drops
- **Cross-platform** — macOS (DMG), Windows (NSIS installer), Linux (AppImage)
- **Stream preview with volume controls** — live preview of your ingest stream with adjustable monitoring volume and mute toggle
- **Dark theme** — easy on the eyes during long streams

## Prerequisites

- **FFmpeg** — must be installed and available on your PATH
  - macOS: `brew install ffmpeg`
  - Windows: download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
  - Linux: `sudo apt install ffmpeg` (or your distro's package manager)
- **Node.js 18+** (for development only)

## Download

Grab the latest release for your platform. macOS builds are code-signed and notarized by Apple.

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [FreEstream-1.2.0-arm64.dmg](https://github.com/l33tdawg/freestream/releases/download/v1.2.0/FreEstream-1.2.0-arm64.dmg) |
| macOS (Intel) | [FreEstream-1.2.0.dmg](https://github.com/l33tdawg/freestream/releases/download/v1.2.0/FreEstream-1.2.0.dmg) |
| Windows (x64) | [FreEstream Setup 1.2.0.exe](https://github.com/l33tdawg/freestream/releases/download/v1.2.0/FreEstream.Setup.1.2.0.exe) |
| Linux (x64) | [FreEstream-1.2.0.AppImage](https://github.com/l33tdawg/freestream/releases/download/v1.2.0/FreEstream-1.2.0.AppImage) |

Or browse all releases on the [Releases](https://github.com/l33tdawg/freestream/releases) page.

### Build from source

```bash
git clone https://github.com/l33tdawg/freestream.git
cd freestream
npm install
npm run dist
```

The distributable will be in the `release/` directory.

### Platform-specific builds

FreEstream builds native installers for macOS, Windows, and Linux using [electron-builder](https://www.electron.build/).

#### macOS — DMG (x64 + Apple Silicon)

```bash
# Must be run on macOS
npm run dist
```

- Produces a universal DMG supporting both Intel (x64) and Apple Silicon (arm64)
- Hardened runtime is enabled with entitlements for network access (required for RTMP streaming) and JIT/unsigned memory (required by Electron)
- For distribution outside the Mac App Store, you'll need to code-sign and notarize:
  - Set `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables with your Developer ID certificate
  - Set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` for notarization
- Output: `release/FreEstream-<version>-arm64.dmg` and `release/FreEstream-<version>-x64.dmg`

#### Windows — NSIS Installer (x64)

```bash
# Must be run on Windows (or via CI with Wine)
npm run dist
```

- Produces an NSIS installer with optional per-user or per-machine install
- Users can choose their installation directory
- App data is preserved on uninstall
- For signed builds, set `CSC_LINK` and `CSC_KEY_PASSWORD` with your code-signing certificate
- Output: `release/FreEstream Setup <version>.exe`

#### Linux — AppImage (x64)

```bash
# Must be run on Linux
npm run dist
```

- Produces a portable AppImage — no installation required, just make it executable and run
- Categorized as `AudioVideo` in desktop environments
- Icons are included at all standard sizes (16px through 512px)
- Output: `release/FreEstream-<version>.AppImage`

> **Note:** You can only build the native format for the OS you're running on. To build all three, use a CI pipeline (e.g., GitHub Actions) with macOS, Windows, and Linux runners.

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
│   ├── ffmpeg-detector.ts # FFmpeg auto-detection
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
