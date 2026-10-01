

import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
const PKG = 'better-sqlite3-multiple-ciphers';

const electronPkgPath = join(__dirname, '..', 'node_modules', 'electron', 'package.json');
if (!existsSync(electronPkgPath)) {
  console.error('[rebuild] electron/package.json not found. Run `pnpm install` first.');
  process.exit(1);
}
const electronVersion = require(electronPkgPath).version;

const pnpmStore = resolve(__dirname, '..', '..', '..', 'node_modules', '.pnpm');
let moduleDir = null;
if (existsSync(pnpmStore)) {
  const match = readdirSync(pnpmStore).find(d => d.startsWith(PKG + '@'));
  if (match) moduleDir = join(pnpmStore, match, 'node_modules', PKG);
}
if (!moduleDir || !existsSync(moduleDir)) {
  console.error(`[rebuild] Cannot find ${PKG} in ${pnpmStore}`);
  process.exit(1);
}

let prebuildBin = null;
const localBin = join(moduleDir, 'node_modules', 'prebuild-install', 'bin.js');
if (existsSync(localBin)) {
  prebuildBin = localBin;
} else {
  const piMatch = readdirSync(pnpmStore).find(d => d.startsWith('prebuild-install@'));
  if (piMatch) {
    const candidate = join(pnpmStore, piMatch, 'node_modules', 'prebuild-install', 'bin.js');
    if (existsSync(candidate)) prebuildBin = candidate;
  }
}

console.log(`[rebuild] ${PKG} → Electron ${electronVersion} (${process.arch})`);

let prebuiltOk = false;
if (prebuildBin) {
  try {
    execFileSync(
      process.execPath,
      [prebuildBin, '--runtime', 'electron', '--target', electronVersion,
        '--arch', process.arch, '--tag-prefix', 'v'],
      { cwd: moduleDir, stdio: 'pipe' }
    );
    prebuiltOk = true;
    console.log('[rebuild] ✔ Prebuilt binary installed.');
  } catch {
    console.log('[rebuild] No prebuilt binary for this Electron/arch. Compiling from source…');
  }
}

if (!prebuiltOk) {
  try {
    const { rebuild } = await import('@electron/rebuild');
    await rebuild({
      buildPath: resolve(__dirname, '..', '..', '..'),
      electronVersion,
      onlyModules: [PKG],
      force: true,
      env: {
        ...process.env,
        GYP_DEFINES: [
          process.env.GYP_DEFINES || '',
          'msvs_settings_VCCLCompilerTool_AdditionalOptions=/std:c++20',
        ].filter(Boolean).join(' '),
      },
    });
    console.log('[rebuild] ✔ Compiled from source successfully.');
  } catch (err) {
    console.error('[rebuild] ✖ Both prebuilt download and source compile failed:', err);
    process.exit(1);
  }
}

