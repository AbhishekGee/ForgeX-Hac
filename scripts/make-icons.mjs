// Renders the PNG app icons from lib/appIcon.js with headless Edge/Chrome.
// Run after changing the icon art:  node scripts/make-icons.mjs [path-to-browser]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appIconSvg } from '../lib/appIcon.js';

const browser = process.argv[2] || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');

const OUT = [
  { file: 'app/apple-icon.png', px: 180, scale: 1 },
  { file: 'public/app-icon/192.png', px: 192, scale: 1 },
  { file: 'public/app-icon/512.png', px: 512, scale: 1 },
  { file: 'public/app-icon/maskable-512.png', px: 512, scale: 0.8 },
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-icons-'));
for (const { file, px, scale } of OUT) {
  const svg = appIconSvg({ scale }).replace('width="64" height="64"', `width="${px}" height="${px}"`);
  const html = path.join(tmp, `${px}-${scale}.html`);
  fs.writeFileSync(html, `<!doctype html><html><body style="margin:0;overflow:hidden">${svg}</body></html>`);
  // The browser renders into the temp folder; it cannot always write into synced folders like OneDrive.
  const shot = path.join(tmp, `${px}-${scale}.png`);
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', `--user-data-dir=${path.join(tmp, 'profile')}`, '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${px},${px}`, `--screenshot=${shot}`, `file:///${html.replace(/\\/g, '/')}`,
  ], { stdio: 'ignore' });
  // On Windows the Edge launcher can return before the screenshot is written.
  for (let i = 0; i < 100 && !fs.existsSync(shot); i++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  if (!fs.existsSync(shot)) throw new Error(`browser did not write ${shot}`);
  const out = path.join(root, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(shot, out);
  console.log('wrote', file);
}
// Edge can hold its temp profile open for a moment after exiting; leftovers are harmless.
try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch {}
