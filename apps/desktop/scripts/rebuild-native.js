/**
 * rebuild-native.js
 *
 * Downloads prebuilt Electron binaries for better-sqlite3-multiple-ciphers,
 * falling back to a source compile with C++20 forced via GYP_DEFINES.
 *
 * Why not plain electron-rebuild?
 * - Electron 32 v8config.h requires C++20, but the package binding.gyp sets
 *   /std:c++17 — causing MSVC error C1189 in a plain rebuild.
 * - This script forces GYP_DEFINES to override the C++ standard on the
 *   fallback compile path.
 *
 * pnpm note: native modules live in node_modules/.pnpm/<pkg>@<ver>/node_modules/
 */

import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
const PKG = 'better-sqlite3-multiple-ciphers';

// ── 1. Electron version ───────────────────────────────────────────────────────
const electronPkgPath = join(__dirname, '..', 'node_modules', 'electron', 'package.json');
if (!existsSync(electronPkgPath)) {
  console.error('[rebuild] electron/package.json not found. Run `pnpm install` first.');
  process.exit(1);
}
const electronVersion = require(electronPkgPath).version;

// ── 2. Locate module in pnpm virtual store ────────────────────────────────────
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

// ── 3. Find prebuild-install binary ──────────────────────────────────────────
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

// ── 4. Try prebuilt binary download first ────────────────────────────────────
let prebuiltOk = false;
if (prebuildBin) {
  try {
    execFileSync(
      process.execPath,
      [prebuildBin, '--runtime', 'electron', '--target', electronVersion,
        '--arch', process.arch, '--tag-prefix', 'v'],
      { cwd: moduleDir, stdio: 'pipe' }   // pipe to suppress Windows stderr→exit quirk
    );
    prebuiltOk = true;
    console.log('[rebuild] ✔ Prebuilt binary installed.');
  } catch {
    console.log('[rebuild] No prebuilt binary for this Electron/arch. Compiling from source…');
  }
}

// ── 5. Fallback: compile from source with C++20 ───────────────────────────────
if (!prebuiltOk) {
  try {
    const { rebuild } = await import('@electron/rebuild');
    await rebuild({
      buildPath: resolve(__dirname, '..', '..', '..'),
      electronVersion,
      onlyModules: [PKG],
      force: true,
      // GYP_DEFINES overrides binding.gyp's /std:c++17 so Electron 32
      // v8config.h (#error "C++20 or later required") is satisfied.
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

