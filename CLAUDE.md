# FreEstream

Free multi-streaming desktop app that fans out a single RTMP ingest to multiple platforms (Twitch, YouTube, Facebook, TikTok, Instagram, custom RTMP).

## Tech Stack

- **Desktop:** Electron 28 (main + renderer processes)
- **Frontend:** React 18, TypeScript 5.3, Tailwind CSS 3.4, Vite 5
- **Backend (main process):** Node.js, node-media-server (RTMP ingest), FFmpeg (stream fan-out)
- **Storage:** electron-store (settings/destinations), keytar (stream keys in OS keychain)
- **Build:** electron-builder (DMG/NSIS/AppImage)

## Architecture

```
OBS/Streamlabs → RTMP ingest (localhost:1935) → FFmpeg fan-out → Multiple platforms
```

- **Main process** (`src/main/`): RTMP server, FFmpeg management, IPC handlers, config, secrets
- **Renderer process** (`src/renderer/`): React UI with Dashboard, destination cards, stream controls
- **Shared types** (`src/shared/types.ts`): Type definitions used by both processes
- Communication is via IPC through a secure preload bridge (`src/main/preload.ts`)

## Key Files

| File | Purpose |
|------|---------|
| `src/main/index.ts` | Electron entry point, window creation, lifecycle |
| `src/main/nms.ts` | RTMP server wrapper (node-media-server) |
| `src/main/ffmpeg-manager.ts` | FFmpeg process spawning, monitoring, auto-reconnect |
| `src/main/ipc-handlers.ts` | All IPC handler registrations |
| `src/main/destination-manager.ts` | Destination CRUD |
| `src/main/stream-monitor.ts` | Real-time status monitoring, event forwarding |
| `src/main/config.ts` | Persistent settings via electron-store |
| `src/main/secrets.ts` | Secure stream key storage via keytar |
| `src/main/constants.ts` | Platform presets and defaults |
| `src/renderer/App.tsx` | Root React component |
| `src/renderer/components/Dashboard.tsx` | Main UI layout |
| `src/renderer/hooks/useDestinations.ts` | Destination state + IPC |
| `src/renderer/hooks/useStreamStatus.ts` | Real-time stream status |

## Commands

```bash
npm run dev          # Start dev mode (main watch + Vite dev server)
npm run dev:main     # Watch main process TypeScript
npm run dev:renderer # Vite dev server on port 5173
npm run build        # Build both main and renderer
npm start            # Run compiled app
npm run dist         # Build distributable (DMG/NSIS/AppImage)
```

## IPC Channels

- **Destinations:** `destinations:get`, `destinations:add`, `destinations:update`, `destinations:remove`, `destinations:toggle`
- **Secrets:** `secrets:set-key`, `secrets:get-key`, `secrets:delete-key`
- **Streaming:** `stream:go-live`, `stream:stop-all`, `stream:stop-destination`, `stream:get-status`
- **Settings:** `settings:get`, `settings:update`
- **Events:** `event:ingest-status`, `event:destination-status`, `event:stream-error`

## Conventions

- Renderer cannot access Node.js APIs directly — all communication goes through `window.freestream` (preload bridge)
- Stream keys are never stored in plain text — always use keytar/OS keychain
- One FFmpeg process per destination (fan-out pattern)
- TypeScript strict mode enabled
- Tailwind dark theme with custom color tokens (surface, accent, success, warning, danger)

## Agent Team Guidelines

When working with agent teams on this project:
- **Main process** and **renderer process** changes can be worked on in parallel (separate directories)
- Avoid two teammates editing the same file — split by `src/main/` vs `src/renderer/` vs `src/shared/`
- Always run `npm run build` to verify changes compile before marking tasks complete
- Test IPC changes from both sides (handler registration + preload exposure + renderer call)
