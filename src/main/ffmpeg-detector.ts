import { execFile } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { AvailableEncoders, VideoEncoder } from '../shared/types';

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

const HW_ENCODERS: VideoEncoder[] = ['h264_videotoolbox', 'h264_nvenc', 'h264_qsv', 'h264_amf'];

export async function detectEncoders(ffmpegPath: string): Promise<AvailableEncoders> {
  const result: AvailableEncoders = { hardware: [], software: ['libx264'] };

  try {
    const output = await new Promise<string>((resolve, reject) => {
      execFile(ffmpegPath, ['-encoders'], { timeout: 5000 }, (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });

    for (const encoder of HW_ENCODERS) {
      if (output.includes(encoder)) {
        result.hardware.push(encoder);
      }
    }
  } catch {
    // FFmpeg not available or errored — return software-only
  }

  return result;
}
