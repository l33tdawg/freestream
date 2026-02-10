import { execFile } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const COMMON_PATHS = [
  '/usr/local/bin/ffmpeg',
  '/usr/bin/ffmpeg',
  '/opt/homebrew/bin/ffmpeg',
  'C:\\ffmpeg\\bin\\ffmpeg.exe',
  'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
];

export async function detectFfmpeg(customPath?: string): Promise<string | null> {
  // Try custom path first
  if (customPath && customPath.trim()) {
    if (await isValidFfmpeg(customPath)) return customPath;
  }

  // Try PATH
  try {
    const pathResult = await tryFfmpegCommand('ffmpeg');
    if (pathResult) return 'ffmpeg';
  } catch {}

  // Try common locations
  for (const p of COMMON_PATHS) {
    if (existsSync(p) && (await isValidFfmpeg(p))) {
      return p;
    }
  }

  return null;
}

async function isValidFfmpeg(ffmpegPath: string): Promise<boolean> {
  return tryFfmpegCommand(ffmpegPath);
}

function tryFfmpegCommand(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(cmd, ['-version'], { timeout: 5000 }, (error, stdout) => {
      resolve(!error && stdout.includes('ffmpeg version'));
    });
  });
}
