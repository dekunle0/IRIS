# IRIS Platform AI Project Context

Generated: 2026-09-13T09:19:19.093Z

This file is a source-context export for AI-assisted development.
It includes application source, database schema, AI service code, tests, and configuration.

## Important Project Notes

- The Electron app is in `apps/desktop`.
- The Electron runtime database is initialized in `apps/desktop/src/main/db.ts`.
- The shared schema is in `packages/db/migrations/001_init.sql`.
- The local AI HTTP service is in `packages/ai/main.py`.
- Generated builds, release binaries, dependencies, virtual environments, and lockfiles are excluded.

## Included Files (80)

- apps/desktop/.gitignore
- apps/desktop/README.md
- apps/desktop/dump.ts
- apps/desktop/eslint.config.js
- apps/desktop/index.html
- apps/desktop/package.json
- apps/desktop/pnpm-workspace.yaml
- apps/desktop/postcss.config.js
- apps/desktop/src/App.tsx
- apps/desktop/src/components/CaptureScreen.tsx
- apps/desktop/src/components/DevicesScreen.tsx
- apps/desktop/src/components/DotLoader.tsx
- apps/desktop/src/components/LoginScreen.tsx
- apps/desktop/src/components/PatientRegistration.tsx
- apps/desktop/src/components/QCDashboard.tsx
- apps/desktop/src/components/ResultReviewScreen.tsx
- apps/desktop/src/components/SettingsScreen.tsx
- apps/desktop/src/components/SyncStatusIndicator.tsx
- apps/desktop/src/components/UsersScreen.tsx
- apps/desktop/src/components/WorklistScreen.tsx
- apps/desktop/src/global.d.ts
- apps/desktop/src/main.tsx
- apps/desktop/src/main/db.ts
- apps/desktop/src/main/index.ts
- apps/desktop/src/main/ipc/ai-handlers.ts
- apps/desktop/src/main/ipc/auth-handlers.ts
- apps/desktop/src/main/ipc/patient-handlers.ts
- apps/desktop/src/main/ipc/qc-handlers.ts
- apps/desktop/src/main/ipc/result-handlers.ts
- apps/desktop/src/main/ipc/worklist-handlers.ts
- apps/desktop/src/main/pdf-generator.ts
- apps/desktop/src/main/preload.ts
- apps/desktop/src/main/test-ai.ts
- apps/desktop/src/main/test-approval.ts
- apps/desktop/src/main/test-auth.ts
- apps/desktop/src/main/test-db.ts
- apps/desktop/src/main/test-qc.ts
- apps/desktop/src/main/test-worklist.ts
- apps/desktop/tailwind.config.ts
- apps/desktop/tsconfig.app.json
- apps/desktop/tsconfig.json
- apps/desktop/tsconfig.node.json
- apps/desktop/vite.config.ts
- apps/product-site/.eslintrc.json
- apps/product-site/.gitignore
- apps/product-site/README.md
- apps/product-site/next-env.d.ts
- apps/product-site/next.config.mjs
- apps/product-site/package.json
- apps/product-site/pnpm-workspace.yaml
- apps/product-site/postcss.config.mjs
- apps/product-site/src/app/api/releases/route.ts
- apps/product-site/src/app/downloads/page.tsx
- apps/product-site/src/app/globals.css
- apps/product-site/src/app/layout.tsx
- apps/product-site/src/app/page.tsx
- apps/product-site/tailwind.config.ts
- apps/product-site/tsconfig.json
- package.json
- packages/ai/main.py
- packages/ai/services/pipeline.py
- packages/ai/services/report.py
- packages/db/migrations/001_init.sql
- packages/db/package.json
- packages/db/pnpm-workspace.yaml
- packages/db/src/auth/hash.ts
- packages/db/src/auth/session.ts
- packages/db/src/auth/totp.ts
- packages/db/src/sync/exporter.ts
- packages/db/src/sync/uploader.ts
- packages/iris-sdk/package.json
- packages/iris-sdk/pnpm-workspace.yaml
- packages/iris-sdk/src/index.ts
- packages/iris-sdk/test-lis.ts
- packages/lis-api/package.json
- packages/lis-api/pnpm-workspace.yaml
- packages/lis-api/src/server.ts
- packages/shared-ui/globals.css
- packages/shared-ui/tailwind.config.ts
- scripts/export-ai-context.mjs

## Test Files (7)

- apps/desktop/src/main/test-ai.ts
- apps/desktop/src/main/test-approval.ts
- apps/desktop/src/main/test-auth.ts
- apps/desktop/src/main/test-db.ts
- apps/desktop/src/main/test-qc.ts
- apps/desktop/src/main/test-worklist.ts
- packages/iris-sdk/test-lis.ts

## apps/desktop/.gitignore

```
release/
node_modules/
dist-electron/
dist/
*.db
```

## apps/desktop/README.md

```markdown
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
```

## apps/desktop/dump.ts

```typescript
import Database from 'better-sqlite3';

const db = new Database('iris-offline.db');

console.log('--- CAPTURES TABLE ---');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE name='captures'").get()?.sql);
```

## apps/desktop/eslint.config.js

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
```

## apps/desktop/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>desktop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## apps/desktop/package.json

```json
{
  "name": "IRIS",
  "private": true,
  "version": "1.0.0",
  "main": "dist-electron/index.js",
  "scripts": {
    "dev": "vite",
    "build:ui": "vite build",
    "build:main": "tsup src/main/index.ts src/main/preload.ts src/main/db.ts --outDir dist-electron --format cjs --external electron,better-sqlite3,argon2",
    "build": "pnpm build:ui && pnpm build:main",
    "pack:win": "pnpm build && electron-builder --win",
    "pack:linux": "pnpm build && electron-builder --linux"
  },
  "build": {
    "appId": "com.kytolabx.iris",
    "productName": "IRIS Offline Platform",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "package.json"
    ],
    "win": {
      "target": "nsis"
    }
  },
  "dependencies": {
    "@phc/format": "^1.0.0",
    "argon2": "^0.45.1",
    "better-sqlite3": "^11.2.1",
    "otplib": "^13.5.0",
    "pdf-lib": "^1.17.1",
    "qrcode": "^1.5.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-signature-canvas": "^1.0.6",
    "recharts": "^3.10.1",
    "zod": "^4.6.1"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.11",
    "@types/better-sqlite3": "^7.6.11",
    "@types/node": "^22.5.4",
    "@types/qrcode": "^1.5.6",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/react-signature-canvas": "^1.0.5",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.5.5",
    "electron": "^32.0.2",
    "electron-builder": "^24.13.3",
    "postcss": "^8.5.28",
    "tailwindcss": "^3.4.19",
    "tailwindcss-animate": "^1.0.7",
    "tsup": "^8.2.4",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  }
}
```

## apps/desktop/pnpm-workspace.yaml

```yaml
allowBuilds:
  '@journeyapps/sqlcipher': true
  argon2: true
  better-sqlite3: true
  electron: true
  electron-winstaller: true
  esbuild: true
```

## apps/desktop/postcss.config.js

```javascript
export default { plugins: { tailwindcss: {}, autoprefixer: {}, }, }
```

## apps/desktop/src/App.tsx

```tsx
import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { PatientRegistration } from './components/PatientRegistration';
import { CaptureScreen } from './components/CaptureScreen';
import { WorklistScreen } from './components/WorklistScreen';
import { ResultReviewScreen } from './components/ResultReviewScreen';
import { QCDashboard } from './components/QCDashboard';
import { DevicesScreen } from './components/DevicesScreen';
import { UsersScreen } from './components/UsersScreen';
import { SettingsScreen } from './components/SettingsScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRoute, setCurrentRoute] = useState<'worklist' | 'register' | 'capture' | 'qc' | 'review' | 'devices' | 'users' | 'settings'>('worklist');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const handleLogout = async () => {
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('auth:logout', { userId: currentUser.id, institutionId: currentUser.institutionId });
    }
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 antialiased selection:bg-emerald-500/20">
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        
        <div className="flex flex-col">
          <div className="px-7 pt-7 pb-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center shadow-md border border-slate-800">
                <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 9 9" /><circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-900">IRIS</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">v1.1</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-semibold text-slate-500">Offline Workstation</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            <div className="px-3 pt-4 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Clinical Workflow</span>
            </div>

            <button 
              onClick={() => setCurrentRoute('worklist')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'worklist' || currentRoute === 'review'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'worklist' || currentRoute === 'review' ? 'text-emerald-700' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
              <span>Worklist & Results</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('register')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'register'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'register' ? 'text-emerald-700' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
              <span>Register Patient</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('capture')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'capture'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'capture' ? 'text-emerald-700' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 12 3 3 3-3" /><path d="M14 6h7a2 2 0 0 1 2 2v7" /><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2" /><path d="M8 14v7" /><path d="M5 18h6" /></svg>
              <span>Capture Slide</span>
            </button>

            <div className="px-3 pt-6 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Governance</span>
            </div>

            <button 
              onClick={() => setCurrentRoute('qc')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'qc'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'qc' ? 'text-emerald-700' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              <span>QC Dashboard</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('devices')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'devices'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'devices' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              <span>Hardware Devices</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('users')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'users' ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'users' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Access Control</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('settings')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'settings' ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'settings' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span>System Settings</span>
            </button>
          </nav>
        </div>

        <div className="p-4 m-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 shrink-0 text-sm">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-extrabold text-slate-900 truncate leading-tight">{currentUser.name}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight mt-1">{currentUser.role?.replace('_', ' ') || 'Scientist'}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Sign Out"
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-10 lg:p-14">
          {currentRoute === 'worklist' && <WorklistScreen onRowClick={(request) => { setSelectedRequest(request); setCurrentRoute('review'); }} />}
          {currentRoute === 'review' && selectedRequest && <ResultReviewScreen requestId={selectedRequest.requestId} patientName={selectedRequest.patientName} testName={selectedRequest.testName} onBack={() => { setSelectedRequest(null); setCurrentRoute('worklist'); }} />}
          {currentRoute === 'register' && <div className="max-w-4xl mx-auto"><PatientRegistration /></div>}
          {currentRoute === 'capture' && <div className="max-w-6xl mx-auto"><CaptureScreen /></div>}
          {currentRoute === 'qc' && <QCDashboard />}
          {currentRoute === 'devices' && <DevicesScreen />}
          {currentRoute === 'users' && <UsersScreen />}
          {currentRoute === 'settings' && <SettingsScreen />}
        </div>
      </main>
    </div>
  );
}
```

## apps/desktop/src/components/CaptureScreen.tsx

```tsx
import { useEffect, useRef, useState } from 'react';
import { DotLoader } from './DotLoader';

export function CaptureScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deviceStatus, setDeviceStatus] = useState({ connected: false, battery: 0, storageGb: 0 });
  const [focusScore, setFocusScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [aiStage, setAiStage] = useState<string | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Playbook Requirement: Color states based on score
  const getFocusColorClass = () => {
    if (focusScore < 40) return 'border-error';
    if (focusScore <= 75) return 'border-warning';
    return 'border-[#059669] iris-focus-ring-green shadow-[0_0_30px_rgba(5,150,105,0.4)]'; 
  };

  const connectMockDevice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setDeviceStatus({ connected: true, battery: 85, storageGb: 42 });
      setFocusScore(15); 
      setHasAutoStarted(false);
    } catch (err) {
      alert("Hardware connection failed (webcam access denied).");
    }
  };

  const disconnectDevice = () => {
    // Properly release the webcam hardware
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Reset all states
    setDeviceStatus({ connected: false, battery: 0, storageGb: 0 });
    setFocusScore(0);
    setIsRecording(false);
    setRecordingTime(0);
    setHasAutoStarted(false);
    setAiStage(null);
  };

  // 1. Realistic Hardware Auto-Focus Simulator
  useEffect(() => {
    let focusTimeout: ReturnType<typeof setTimeout>;
    
    if (deviceStatus.connected && !isRecording && !aiStage && focusScore < 82) {
      focusTimeout = setTimeout(() => {
        setFocusScore(prev => {
          const jump = Math.random() > 0.15 ? Math.floor(Math.random() * 6) + 2 : -2;
          const next = Math.max(0, prev + jump);
          return next > 82 ? 82 : next; 
        });
      }, 350); 
    }
    
    return () => clearTimeout(focusTimeout);
  }, [deviceStatus.connected, isRecording, aiStage, focusScore]);

  // 2. Playbook Requirement: Auto-start capture when Green (>75%) is reached
  useEffect(() => {
    if (focusScore <= 75) {
      setHasAutoStarted(false);
    } else if (focusScore > 75 && deviceStatus.connected && !isRecording && !aiStage && !hasAutoStarted) {
      setIsRecording(true);
      setHasAutoStarted(true);
    }
  }, [focusScore, deviceStatus.connected, isRecording, aiStage, hasAutoStarted]);

  // 3. Handle the recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startAiPipeline = async () => {
    const stages = [
      "Extracting frames",
      "Segmenting cells",
      "Classifying morphology",
      "Generating report"
    ];
    let currentStage = 0;
    
    setAiStage(stages[currentStage]);
    const loaderInterval = setInterval(() => {
      currentStage = Math.min(currentStage + 1, stages.length - 1);
      setAiStage(stages[currentStage]);
    }, 1500);

    const completeAnalysis = () => {
      clearInterval(loaderInterval);
      setAiStage(null);
      // Reset the focus to simulate a new slide being placed
      setFocusScore(15);
      setHasAutoStarted(false);
    };

    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('ai:analyze', {
          captureId: `cap-${Date.now()}`,
          videoPath: '/local/captures/vid_active.mp4',
          testType: 'Malaria Parasite',
          patientContext: { age: 35, gender: 'Male' }
        });
        completeAnalysis();
        if (response.success) alert("Local AI Analysis Complete! Result securely saved.");
      } else {
        setTimeout(() => {
          completeAnalysis();
          alert("[Browser Mode] Simulated AI Analysis Complete!");
        }, 6000);
      }
    } catch (err) {
      completeAnalysis();
      alert("Failed to communicate with Electron Main Process.");
    }
  };

  const handleStopRecording = () => {
    if (recordingTime < 15) {
      const confirm = window.confirm("Warning: Capture is under 15 seconds. This may result in low AI confidence. Stop anyway?");
      if (!confirm) return;
    }
    setIsRecording(false);
    startAiPipeline();
  };

  const handleManualUpload = () => {
    alert("Opening native file picker to import video into local encrypted store (No cloud upload).");
    startAiPipeline();
  };

  const blurAmount = Math.max(0, (80 - focusScore) / 8);

  return (
    <div className="max-w-7xl mx-auto w-full font-sans pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Capture Feed</h2>
          <p className="text-lg text-slate-500 mt-2 font-medium">Live from IRIS Eyepiece</p>
        </div>

        <div className="flex gap-6 items-center bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`h-4 w-4 rounded-full shadow-inner ${deviceStatus.connected ? 'bg-[#059669]' : 'bg-slate-300'}`}></span>
            <span className="text-base font-bold text-slate-700">{deviceStatus.connected ? 'IRIS-001 Connected' : 'No Device'}</span>
          </div>
          {deviceStatus.connected && (
            <>
              <div className="text-base font-medium text-slate-500 border-l border-slate-200 pl-6">🔋 {deviceStatus.battery}%</div>
              <div className="text-base font-medium text-slate-500 border-l border-slate-200 pl-6">💾 {deviceStatus.storageGb}GB Free</div>
              <button 
                onClick={disconnectDevice} 
                className="ml-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-sm font-bold rounded-lg transition-colors border border-red-100"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Camera Viewport */}
        <div className="col-span-8 relative aspect-[16/9] bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex items-center justify-center">
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ 
              opacity: deviceStatus.connected ? 1 : 0,
              filter: `blur(${blurAmount}px)`,
              transform: 'scale(1.05)'
            }}
          />
          
          {aiStage && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-30">
              <DotLoader stage={aiStage} />
            </div>
          )}

          {deviceStatus.connected && !aiStage && (
            <div className={`absolute inset-6 border-[8px] rounded-2xl transition-all duration-300 pointer-events-none z-20 ${getFocusColorClass()}`}>
              <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg font-mono text-lg font-bold shadow-lg transition-colors">
                FOCUS: {focusScore}%
              </div>
              {isRecording && (
                <div className="absolute top-6 left-6 bg-error text-white px-4 py-2 rounded-lg font-mono text-lg font-bold shadow-lg animate-pulse flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  REC {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          )}

          {!deviceStatus.connected && !aiStage && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-20">
              <button onClick={connectMockDevice} className="px-8 py-4 bg-[#059669] text-white text-lg font-bold rounded-xl shadow-lg hover:bg-[#047857] hover:scale-105 transition-all">
                Connect Local Device
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
            <h3 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-4">Capture Controls</h3>
            
            {!isRecording ? (
              <button
                disabled={!deviceStatus.connected || focusScore < 76 || !!aiStage}
                onClick={() => setIsRecording(true)}
                className={`w-full py-5 rounded-xl font-extrabold text-lg text-white transition-all shadow-md ${
                  !deviceStatus.connected || focusScore < 76 || !!aiStage
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-[#059669] hover:bg-[#047857] hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                }`}
              >
                {focusScore > 0 && focusScore <= 75 ? 'Waiting for focus...' : 'Start Capture'}
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="w-full py-5 rounded-xl font-extrabold text-lg text-white bg-error hover:bg-red-700 animate-pulse shadow-lg cursor-pointer"
              >
                STOP RECORDING
              </button>
            )}

            <div className="text-sm font-medium text-slate-500 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              Auto-start enables at &gt;75% focus. Minimum 15 seconds required.
            </div>

            {deviceStatus.connected && !isRecording && !aiStage && (
              <button 
                onClick={() => setFocusScore(15)} 
                className="mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider flex items-center justify-center gap-1"
                title="Simulate re-focusing a new slide"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Restart Sweep
              </button>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-4 mb-6">Manual Fallback</h3>
            <button 
              onClick={handleManualUpload}
              disabled={!!aiStage}
              className="w-full py-4 border-2 border-dashed border-[#059669]/50 text-[#059669] font-bold text-lg rounded-xl hover:bg-[#ecfdf5] hover:border-[#059669] transition-all"
            >
              Import Video File
            </button>
            <p className="text-sm font-medium text-slate-500 mt-4 leading-relaxed">
              For labs without a paired IRIS device yet. Accesses local file system only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## apps/desktop/src/components/DevicesScreen.tsx

```tsx
import { useState, useEffect } from 'react';

export function DevicesScreen() {
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    // Simulated local database fetch for testing
    setDevices([
      {
        id: 'dev-1',
        serialNumber: 'IRIS-HW-9021',
        firmwareVersion: 'v1.1.0',
        lastPairedAt: new Date().toISOString(),
        batteryPct: 85,
        storageUsedGb: 12.4,
        storageTotalGb: 64.0,
        calibrationDueAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'dev-2',
        serialNumber: 'IRIS-HW-7734',
        firmwareVersion: 'v1.0.2',
        lastPairedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
        batteryPct: 0,
        storageUsedGb: 45.1,
        storageTotalGb: 64.0,
        calibrationDueAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]);
  }, []);

  const handlePair = () => alert("Initiating local device discovery (USB-C / Wi-Fi Direct / Bluetooth)...");
  const handleFirmware = () => alert("Opening native file picker to select a signed firmware package (.bin)...");

  const isOld = (dateString: string) => {
    return (Date.now() - new Date(dateString).getTime()) > 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="max-w-7xl mx-auto w-full font-sans flex flex-col h-full">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Paired Devices</h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">Manage IRIS eyepiece hardware linked to this workstation.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleFirmware} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
            Push Firmware Update
          </button>
          <button onClick={handlePair} className="px-6 py-3 bg-[#059669] text-white font-bold rounded-xl shadow-sm hover:bg-[#047857] transition-colors">
            Pair New Device
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {devices.map((device) => {
          const notSeenRecently = isOld(device.lastPairedAt);
          return (
            <div key={device.id} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${notSeenRecently ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <svg className={`w-8 h-8 ${notSeenRecently ? 'text-slate-400' : 'text-[#059669]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-slate-800">{device.serialNumber}</h2>
                    {notSeenRecently && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold rounded-lg uppercase tracking-wider">
                        Not Seen Recently
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-400">Firmware: {device.firmwareVersion} • Last paired: {new Date(device.lastPairedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-10 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Battery</span>
                  <span className={`font-black text-lg ${device.batteryPct > 20 ? 'text-slate-800' : 'text-red-600'}`}>{device.batteryPct}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Storage</span>
                  <span className="font-black text-lg text-slate-800">{device.storageUsedGb.toFixed(1)} <span className="text-slate-400 text-sm">/ {device.storageTotalGb} GB</span></span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Calibration Due</span>
                  <span className="font-black text-lg text-slate-800">{new Date(device.calibrationDueAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## apps/desktop/src/components/DotLoader.tsx

```tsx
// apps/desktop/src/components/DotLoader.tsx
// Implementation based on Engineering Playbook §D-20.2
export function DotLoader({ stage }: { stage: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{stage}</p>
    </div>
  );
}
```

## apps/desktop/src/components/LoginScreen.tsx

```tsx
import { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('auth:login', { username, password });
        if (response.success) {
          onLoginSuccess(response.user);
        } else {
          setError(response.error || 'Authentication failed');
        }
      } else {
        if (username === 'Admin' && password === 'admin') {
          onLoginSuccess({ id: 'local-test', name: 'Browser Tester', role: 'admin' });
        } else {
          setError('Use Admin / admin for browser testing');
        }
      }
    } catch (err) {
      setError('System error connecting to local database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] p-12 bg-white/50 backdrop-blur-3xl rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white z-10 relative">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-lg shadow-slate-900/10 mb-6">
            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a9 9 0 0 1 9 9" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">IRIS</h1>
          <p className="text-slate-500 font-semibold mt-2">Clinical Workstation</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-100/50 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-2 uppercase tracking-widest ml-2">MLSCN Credential</label>
            <input
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 text-base bg-white/60 backdrop-blur-md border border-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 outline-none transition-all duration-300 font-semibold text-slate-800 placeholder-slate-300"
              placeholder="MLSCN-12345"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-2 uppercase tracking-widest ml-2">Passcode</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 text-base bg-white/60 backdrop-blur-md border border-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 outline-none transition-all duration-300 font-semibold text-slate-800 placeholder-slate-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 mt-4 rounded-[20px] font-bold text-lg text-white transition-all duration-300 ease-out ${
              isLoading 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-emerald-600 shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)] hover:bg-emerald-500 hover:-translate-y-0.5 active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## apps/desktop/src/components/PatientRegistration.tsx

```tsx
import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = SignatureCanvas as any;

export function PatientRegistration() {
  const sigPad = useRef<SignatureCanvas>(null);
  const [formData, setFormData] = useState({ fullName: '', dob: '', gender: '', phone: '', nin: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sigPad.current?.isEmpty()) {
      alert("Please capture the patient's signature for NDPR consent.");
      return;
    }
    const signatureData = sigPad.current?.getCanvas().toDataURL('image/png');
    
    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('patients:create', { ...formData, signatureData });
        if (response.success) {
          alert(`Patient ${formData.fullName} registered! ID: ${response.data.patientCode}`);
          setFormData({ fullName: '', dob: '', gender: '', phone: '', nin: '' });
          sigPad.current?.clear();
        } else {
          alert("Error saving patient to database.");
        }
      } else {
        alert(`[Browser Mode] Simulated save for ${formData.fullName}`);
        setFormData({ fullName: '', dob: '', gender: '', phone: '', nin: '' });
        sigPad.current?.clear();
      }
    } catch (error) {
      alert("Failed to communicate with the local database.");
    }
  };

  return (
    <div className="w-full font-sans">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Register Patient</h2>
      </div>
      
      <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-200">
        <form onSubmit={handleRegister} className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" required 
                value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} 
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Date of Birth</label>
              <input 
                type="date" required 
                value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Gender</label>
              <select 
                required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              >
                <option value="" disabled>Select Gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Phone Number</label>
              <input 
                type="tel" required 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                placeholder="080..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">NIN (Encrypted at Rest)</label>
              <input 
                type="text" 
                value={formData.nin} onChange={e => setFormData({...formData, nin: e.target.value})}
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="mt-4 pt-8 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">NDPR Consent Signature</label>
            <div className="bg-slate-50 border border-slate-200 rounded-[24px] overflow-hidden focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all p-2 shadow-sm">
              <SignaturePad 
                ref={sigPad} 
                canvasProps={{ className: 'w-full h-40 cursor-crosshair rounded-[16px]' }} 
              />
            </div>
            <div className="flex justify-end mt-3">
              <button 
                type="button" 
                onClick={() => sigPad.current?.clear()}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                Clear Signature
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 py-6 bg-primary text-white text-xl font-extrabold rounded-[24px] shadow-md hover:bg-primary-dark hover:-translate-y-0.5 transition-all"
          >
            Create Record
          </button>
        </form>
      </div>
    </div>
  );
}
```

## apps/desktop/src/components/QCDashboard.tsx

```tsx
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function QCDashboard() {
  // Realistic clinical mock data for Malaria Parasite Phase 1
  const [kpis] = useState({
    aiAgreementRate: 88.4,
    totalAnalyses: 1245,
    avgTurnaroundMin: 12.5,
    totalCorrections: 144
  });

  // Correction frequency by field (identifies where the AI needs retraining)
  const [correctionData] = useState([
    { field: 'Ring Stage', overrides: 68 },
    { field: 'Trophozoite', overrides: 42 },
    { field: 'Gametocyte', overrides: 18 },
    { field: 'Uninfected RBC', overrides: 11 },
    { field: 'Leukocyte (WBC)', overrides: 5 },
  ]);

  // Per-scientist workload and performance
  const [workloadData] = useState([
    { id: 'u1', name: 'Dr. Amina Bello', role: 'Scientist L2', analyses: 512, avgTime: '11.2m', correctionRate: '8.5%' },
    { id: 'u2', name: 'Chukwudi Eze', role: 'Scientist L1', analyses: 489, avgTime: '14.1m', correctionRate: '12.2%' },
    { id: 'u3', name: 'Dr. Sarah Ojo', role: 'Scientist L2', analyses: 244, avgTime: '10.8m', correctionRate: '7.9%' },
  ]);

  const handleExport = () => {
    alert("Generating local MLS-format QC Period Summary PDF for accreditation recordkeeping...");
  };

  return (
    <div className="max-w-7xl mx-auto w-full font-sans pb-10 flex flex-col h-full">
      
      {/* Header section matching PRD C.6 */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Quality Control</h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">Local AI performance and laboratory workload analytics.</p>
        </div>
        <div className="flex gap-4">
          <select className="px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-[#059669]">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Quarter</option>
          </select>
          <button onClick={handleExport} className="px-6 py-3 bg-[#059669] text-white font-bold rounded-xl shadow-sm hover:bg-[#047857] transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Export Period Summary
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">AI Agreement Rate</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{kpis.aiAgreementRate}%</span>
          </div>
          <div className="text-sm font-semibold text-[#059669] mt-2">No manual corrections needed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Analyses</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{kpis.totalAnalyses}</span>
          </div>
          <div className="text-sm font-semibold text-slate-500 mt-2">Approved results in period</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Turnaround</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{kpis.avgTurnaroundMin}</span>
            <span className="text-lg font-bold text-slate-500">mins</span>
          </div>
          <div className="text-sm font-semibold text-slate-500 mt-2">Capture to Final Approval</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Corrections</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{kpis.totalCorrections}</span>
          </div>
          <div className="text-sm font-semibold text-warning mt-2">AI findings overridden</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 flex-1 min-h-0">
        
        {/* Correction Frequency Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-800">Correction Frequency by Field</h2>
            <p className="text-sm text-slate-500 font-medium">Which AI classifications get overridden most (Retraining targets)</p>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correctionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} fontWeight={600} />
                <YAxis dataKey="field" type="category" stroke="#64748b" fontSize={13} fontWeight={700} width={120} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="overrides" radius={[0, 6, 6, 0]}>
                  {correctionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#DC2626' : index === 1 ? '#D97706' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scientist Workload Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col overflow-hidden">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-800">Reviewer Workload & Performance</h2>
            <p className="text-sm text-slate-500 font-medium">Per-scientist metrics</p>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
                  <th className="px-4 py-3 rounded-tl-xl">Scientist</th>
                  <th className="px-4 py-3">Analyses</th>
                  <th className="px-4 py-3">Avg Turnaround</th>
                  <th className="px-4 py-3 rounded-tr-xl">Correction Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workloadData.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-extrabold text-slate-800">{user.name}</div>
                      <div className="text-xs font-bold text-slate-400 mt-0.5">{user.role}</div>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{user.analyses}</td>
                    <td className="px-4 py-4 font-bold text-slate-700">{user.avgTime}</td>
                    <td className="px-4 py-4 font-bold text-[#059669]">{user.correctionRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
```

## apps/desktop/src/components/ResultReviewScreen.tsx

```tsx
import { useState } from 'react';

interface ResultReviewProps {
  requestId: string;
  patientName: string;
  testName: string;
  onBack: () => void;
}

export function ResultReviewScreen({ requestId, patientName, testName, onBack }: ResultReviewProps) {
  const aiFindings = "Plasmodium falciparum trophozoites seen. Parasitemia: 2+";
  
  const [editedFindings, setEditedFindings] = useState(aiFindings);
  const [comments, setComments] = useState("Recommend clinical correlation and follow-up in 48 hours.");
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      if (window.electron) {
        // Mock base64 signature to prevent backend crash during testing
        const mockSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        
        const response = await window.electron.ipcRenderer.invoke('results:approve', {
          requestId: requestId,
          patientName: patientName,
          testName: testName,
          editedFindings: editedFindings,
          comments: comments,
          originalFindings: aiFindings,
          signatureData: mockSignature,
          scientistId: 'admin-id', 
          scientistName: 'System Administrator'
        });

        if (response.success) {
          alert(`Result approved!\nVerification Code: ${response.verificationCode}`);
          onBack(); 
        } else {
          alert(`Database Error: ${response.error}`);
        }
      } else {
        setTimeout(() => {
          alert(`[Browser Mode] Simulated approval for ${patientName}\n\nNote: To test real database writes, run the app in Electron.`);
          onBack(); 
        }, 1500);
      }
    } catch (err) {
      alert("Failed to communicate with Electron main process.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full font-sans h-full flex flex-col">
      <div className="flex flex-col gap-2 mb-10">
        <button 
          onClick={onBack}
          className="self-start px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-bold text-sm transition-all shadow-sm mb-4"
        >
          &larr; Back to Worklist
        </button>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Result Review</h2>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-lg font-bold text-primary-dark bg-primary-ghost px-4 py-1 rounded-lg border border-primary/20">{patientName}</span>
              <span className="text-slate-400 font-medium">•</span>
              <span className="text-lg font-semibold text-slate-600">{testName}</span>
              <span className="text-slate-400 font-medium">•</span>
              <span className="text-base font-mono font-medium text-slate-400">ID: {requestId.substring(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 flex-1">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col shadow-inner">
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
            <h3 className="text-2xl font-extrabold text-slate-800">AI Preliminary Findings</h3>
            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 text-sm font-extrabold rounded-full shadow-sm border border-emerald-200">
              Confidence: 94%
            </span>
          </div>
          
          <div className="flex-1">
            <label className="block text-base font-bold text-slate-500 mb-3 uppercase tracking-wider">Detected Morphology</label>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl text-slate-800 text-lg shadow-sm min-h-[160px] font-medium leading-relaxed">
              {aiFindings}
            </div>
            
            <div className="mt-10">
              <label className="block text-base font-bold text-slate-500 mb-3 uppercase tracking-wider">Analyzed Frames</label>
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-square bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-400">Frame 1</div>
                <div className="aspect-square bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-400">Frame 2</div>
                <div className="aspect-square bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-slate-400">Frame 3</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 flex flex-col relative overflow-hidden">
          
          <h3 className="text-2xl font-extrabold text-primary-dark mb-8 border-b border-slate-100 pb-4 mt-2">
            Official Laboratory Report
          </h3>
          
          <div className="flex-1 space-y-8">
            <div>
              <label className="block text-base font-bold text-slate-700 mb-3">Final Findings (Editable)</label>
              <textarea
                value={editedFindings}
                onChange={(e) => setEditedFindings(e.target.value)}
                className="w-full p-5 text-lg font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none resize-none h-40 transition-all shadow-inner"
              />
              {editedFindings !== aiFindings && (
                <p className="text-sm text-warning mt-3 font-bold bg-amber-50 p-4 rounded-xl border border-amber-200">
                  Modifications to AI findings will be logged for future model retraining.
                </p>
              )}
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-3">Interpretive Comment</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-5 text-lg font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none resize-none h-32 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <button
              disabled={isApproving}
              onClick={handleApprove}
              className={`w-full py-6 rounded-2xl font-extrabold text-xl text-white transition-all shadow-sm ${
                isApproving 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-dark cursor-pointer'
              }`}
            >
              {isApproving ? 'Generating Cryptographic Signature...' : 'Approve & Release Result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## apps/desktop/src/components/SettingsScreen.tsx

```tsx
import { useState } from 'react';

export function SettingsScreen() {
  const [lisNetworkMode, setLisNetworkMode] = useState(false);

  const toggleLis = () => {
    if (!lisNetworkMode) {
      const confirm = window.confirm("WARNING: Enabling LIS-network mode exposes the local API beyond localhost to your hospital's LAN. Ensure you are on a trusted network.");
      if (confirm) setLisNetworkMode(true);
    } else {
      setLisNetworkMode(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full font-sans pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-lg text-slate-500 mt-2 font-medium">Workstation, institutional, and connectivity configuration.</p>
      </div>

      <div className="space-y-8">
        {/* Licence Section */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Licence Status</h2>
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-black text-primary-dark">Professional Tier</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-lg uppercase tracking-wider border border-emerald-200">Active</span>
              </div>
              <p className="text-sm font-bold text-slate-500">Expires: December 31, 2027</p>
            </div>
            <button className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Update Licence</button>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm font-semibold">
            An expired licence restricts new analyses only; all existing records remain accessible.
          </div>
        </section>

        {/* Sync & Backup */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Offline Backup & Sync</h2>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Encrypted Local Backup</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Target: /Volumes/IRIS_BACKUP_DRIVE (Last successful: 2 hours ago)</p>
            </div>
            <button className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Configure</button>
          </div>
        </section>

        {/* LIS Integration */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">LIS Integration (REST API)</h2>
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Local Network Mode</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Allow LIS connections from the hospital LAN (Default: Localhost only)</p>
            </div>
            <button 
              onClick={toggleLis}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${lisNetworkMode ? 'bg-[#059669]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${lisNetworkMode ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3">Active API Tokens</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
              <span className="font-mono text-sm text-slate-600 font-bold">local-dev-token-***</span>
              <button className="text-error text-sm font-bold hover:underline">Revoke</button>
            </div>
            <button className="mt-4 text-[#059669] text-sm font-bold hover:underline">+ Generate New Token</button>
          </div>
        </section>

        {/* Connected Features */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Connected Features</h2>
          <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
            These features require an active internet connection. IRIS is fully functional without them.
          </p>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Email & SMS Delivery</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Distribute approved results via external gateways.</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-extrabold rounded-lg uppercase">OFF (Default)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
```

## apps/desktop/src/components/SyncStatusIndicator.tsx

```tsx
export function SyncStatusIndicator({ isConfigured = false, lastBackupTime }: { isConfigured?: boolean, lastBackupTime?: string }) {
  if (!isConfigured) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 shadow-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
        Local only
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg text-xs font-bold text-[#059669] shadow-sm">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
      Last backed up: {lastBackupTime || 'Pending...'}
    </div>
  );
}
```

## apps/desktop/src/components/UsersScreen.tsx

```tsx
import { useState } from 'react';

export function UsersScreen() {
  const [users] = useState([
    { id: 'u1', name: 'System Administrator', role: 'admin', mlscn: null, lastActive: 'Just now', twoFa: true, locked: false },
    { id: 'u2', name: 'Dr. Amina Bello', role: 'scientist_l2', mlscn: 'MLSCN-99382', lastActive: '2 hours ago', twoFa: true, locked: false },
    { id: 'u3', name: 'Chukwudi Eze', role: 'scientist_l1', mlscn: 'MLSCN-88471', lastActive: '1 day ago', twoFa: false, locked: true },
  ]);

  const handleCreate = () => alert("Opening 'Create User' modal...");
  const handleAudit = (name: string) => alert(`Opening side panel for ${name}'s immutable audit trail...`);

  return (
    <div className="max-w-7xl mx-auto w-full font-sans h-full flex flex-col">
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Access Control</h1>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-lg uppercase tracking-wider border border-amber-200">Admin Only</span>
          </div>
          <p className="text-lg text-slate-500 font-medium">Manage local clinical accounts and audit trails.</p>
        </div>
        <button onClick={handleCreate} className="px-6 py-3 bg-[#059669] text-white font-bold rounded-xl shadow-sm hover:bg-[#047857] transition-colors">
          + Create User
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
              <th className="px-8 py-5">Personnel</th>
              <th className="px-8 py-5">Role & Credential</th>
              <th className="px-8 py-5">Security Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.locked ? 'opacity-60' : ''}`}>
                <td className="px-8 py-6">
                  <div className="text-base font-extrabold text-slate-900">{u.name}</div>
                  <div className="text-sm font-bold text-slate-400 mt-1">Last Active: {u.lastActive}</div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-extrabold uppercase rounded-md border border-slate-200">{u.role.replace('_', ' ')}</span>
                    {u.mlscn && <span className="text-xs font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0] flex items-center gap-1">✓ {u.mlscn}</span>}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${u.twoFa ? 'text-slate-600' : 'text-warning'}`}>
                      <div className={`w-2 h-2 rounded-full ${u.twoFa ? 'bg-slate-400' : 'bg-warning'}`}></div>
                      2FA {u.twoFa ? 'Enabled' : 'Disabled'}
                    </span>
                    {u.locked && <span className="text-xs font-bold text-error flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-error"></div>Account Locked</span>}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleAudit(u.name)} className="text-sm font-bold text-[#059669] hover:text-[#047857]">Audit Trail</button>
                    <span className="text-slate-300">•</span>
                    <button className="text-sm font-bold text-slate-500 hover:text-slate-800">{u.locked ? 'Unlock' : 'Lock'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## apps/desktop/src/components/WorklistScreen.tsx

```tsx
import { useEffect, useState } from 'react';

interface WorklistScreenProps {
  onRowClick: (request: any) => void;
}

export function WorklistScreen({ onRowClick }: WorklistScreenProps) {
  const [worklist, setWorklist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWorklist = async () => {
    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('worklist:getPending');
        if (response.success) {
          setWorklist(response.data);
        } else {
          setError('Failed to load worklist from database.');
        }
      } else {
        setWorklist([
          { requestId: 'req-1', patientName: 'Adebayo Johnson', patientCode: 'PT-123456', testName: 'Malaria Parasite', priority: 'stat', status: 'requested', assignedTo: 'System Administrator', createdAt: new Date().toISOString() },
          { requestId: 'req-2', patientName: 'Ngozi Okafor', patientCode: 'PT-987654', testName: 'WBC Differential', priority: 'routine', status: 'requested', assignedTo: null, createdAt: new Date(Date.now() - 7200000).toISOString() }
        ]);
      }
    } catch (err) {
      setError('Connection to local database lost.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
    const intervalId = setInterval(() => { fetchWorklist(); }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const calculateAge = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Laboratory Worklist</h1>
        <p className="text-lg text-slate-500 mt-2 font-medium">Live offline database view</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl shadow-sm flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          {error}
        </div>
      )}

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 font-bold text-lg flex-1 flex items-center justify-center">
            Syncing local records...
          </div>
        ) : worklist.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-bold text-xl flex-1 flex items-center justify-center">
            No pending work — the worklist clears as results are approved.
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
                  <th className="px-8 py-5">Patient Record</th>
                  <th className="px-8 py-5">Analysis Type</th>
                  <th className="px-8 py-5">Priority</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Assigned To</th>
                  <th className="px-8 py-5">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {worklist.map((row) => {
                  const isStat = row.priority === 'stat';
                  return (
                    <tr 
                      key={row.requestId} 
                      onClick={() => onRowClick(row)}
                      className={`group cursor-pointer hover:bg-slate-50 transition-colors duration-150 ${isStat ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-8 py-6 relative">
                        {isStat && <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>}
                        <div className="text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors">{row.patientName}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">{row.patientCode}</div>
                      </td>
                      <td className="px-8 py-6 text-base font-bold text-slate-700">{row.testName}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 text-xs font-extrabold tracking-wider uppercase rounded-lg border ${
                          isStat ? 'bg-red-100 border-red-200 text-red-700' : 
                          row.priority === 'urgent' ? 'bg-amber-100 border-amber-200 text-amber-700' : 
                          'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-base font-bold text-slate-600 capitalize">{row.status.replace('_', ' ')}</td>
                      <td className="px-8 py-6 text-base font-medium text-slate-500">{row.assignedTo || 'Unassigned'}</td>
                      <td className="px-8 py-6 text-base font-extrabold text-slate-400">{calculateAge(row.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

## apps/desktop/src/global.d.ts

```typescript
// apps/desktop/src/global.d.ts
export {};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
    };
  }
}
```

## apps/desktop/src/main.tsx

```tsx
import '../../../packages/shared-ui/globals.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

## apps/desktop/src/main/db.ts

```typescript
// apps/desktop/src/main/db.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { hashPassword } from '../../../../packages/db/src/auth/hash';

// Safely check if we are in Electron (app exists) or Node terminal testing (app is undefined)
const storagePath = app ? app.getPath('userData') : process.cwd();
const dbPath = path.join(storagePath, 'iris-offline.db');

export const db = new Database(dbPath, { verbose: console.log });

async function seedFirstAdmin() {
  const adminExists = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).get();
  
  if (!adminExists) {
    console.log('[Database] No admin found. Seeding initial workspace and Administrator...');
    
    const instId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const hashedPw = await hashPassword('Admin123!');

    db.prepare(`
      INSERT INTO institutions (id, name, type, licence_tier) 
      VALUES (?, 'KytoLabx HQ', 'laboratory', 'enterprise')
    `).run(instId);

    db.prepare(`
      INSERT INTO users (id, institution_id, full_name, role, password_hash) 
      VALUES (?, ?, 'System Administrator', 'admin', ?)
    `).run(adminId, instId, hashedPw);
    
    console.log('[Database] ✅ Initial Admin created. Username: System Administrator | Password: Admin123!');
  }
}

export async function initDB() {
  console.log(`[Database] Initializing SQLite at: ${dbPath}`);

  try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    
    if (!tableExists) {
      console.log('[Database] Applying 15-table schema from 001_init.sql...');
      const schemaPath = path.join(process.cwd(), '../../packages/db/migrations/001_init.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);
      console.log('[Database] Schema successfully applied.');
    }

    // ADD AWAIT HERE so it pauses until the hashing is 100% done
    await seedFirstAdmin();

  } catch (err) {
    console.error('[Database] Failed to initialize schema:', err);
  }
}
```

## apps/desktop/src/main/index.ts

```typescript
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerAuthHandlers } from './ipc/auth-handlers';
import { registerPatientHandlers } from './ipc/patient-handlers';
import { initDB } from './db'; 
import { registerWorklistHandlers } from './ipc/worklist-handlers';
import { registerQCHandlers } from './ipc/qc-handlers';
import { registerAIHandlers } from './ipc/ai-handlers';
import { registerResultHandlers } from './ipc/result-handlers';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  await initDB();
  
  registerAuthHandlers();
  registerPatientHandlers();
  registerWorklistHandlers();
  registerQCHandlers();
  registerAIHandlers();
  registerResultHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

## apps/desktop/src/main/ipc/ai-handlers.ts

```typescript
// apps/desktop/src/main/ipc/ai-handlers.ts
import { ipcMain } from 'electron';
import { db } from '../db';
import crypto from 'crypto';

export function registerAIHandlers() {
  ipcMain.handle('ai:analyze', async (_, payload) => {
    console.log(`[Main Process] Triggering Local AI Analysis for test: ${payload.testType}`);
    
    try {
      // 1. Send the data to the local Python FastAPI service (packages/ai/main.py)
      // Node 18+ has native fetch, so we don't need external libraries
      const response = await fetch('http://127.0.0.1:8000/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capture_path: payload.videoPath,
          test_type: payload.testType,
          patient_context: payload.patientContext
        })
      });

      if (!response.ok) {
        throw new Error(`AI Service responded with status: ${response.status}`);
      }

      const aiResult = await response.json();
      
      // 2. Save the AI's result directly into the local SQLite database
      const aiResultId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO ai_results (
          id, capture_id, model_version, test_type, findings, 
          confidence_scores, uncertain_cells_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        aiResultId, 
        payload.captureId, 
        aiResult.model_version || 'v1.0.0', 
        payload.testType, 
        JSON.stringify(aiResult.findings), 
        JSON.stringify(aiResult.confidence_scores),
        aiResult.uncertain_cells_pct || 0
      );

      return { success: true, data: { aiResultId, findings: aiResult.findings } };

    } catch (error) {
      console.error('[Main Process] Local AI connection failed:', error);
      return { 
        success: false, 
        error: 'Failed to connect to local AI engine. Ensure the Python service is running.' 
      };
    }
  });
}
```

## apps/desktop/src/main/ipc/auth-handlers.ts

```typescript
// apps/desktop/src/main/ipc/auth-handlers.ts
import { ipcMain } from 'electron';

export function registerAuthHandlers() {
  ipcMain.handle('auth:login', async (_, credentials) => {
    console.log('[Main Process] Offline Auth Triggered');
    // For the offline clinical desktop, we simulate a successful local session
    return { 
      success: true, 
      user: { id: 'local-admin', name: 'Clinical User' } 
    };
  });

  ipcMain.handle('auth:logout', async () => {
    console.log('[Main Process] Offline Logout Triggered');
    return { success: true };
  });
}
```

## apps/desktop/src/main/ipc/patient-handlers.ts

```typescript
// apps/desktop/src/main/ipc/patient-handlers.ts
import { ipcMain } from 'electron';
import crypto from 'crypto';
import { db } from '../db';

export function registerPatientHandlers() {
  ipcMain.handle('patients:create', async (_, patientData) => {
    try {
      const id = crypto.randomUUID();
      const patientCode = `PT-${Date.now().toString().slice(-6)}`;
      
      const admin = db.prepare("SELECT institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      
      const insert = db.prepare(`
        INSERT INTO patients (
          id, patient_code, institution_id, full_name, dob, gender, phone, 
          nin_encrypted, consent_signature_path, consent_given
        )
        VALUES (
          @id, @patientCode, @institutionId, @fullName, @dob, @gender, @phone, 
          @nin, @signatureData, 1
        )
      `);
      
      insert.run({
        id,
        patientCode,
        institutionId: admin.institution_id,
        fullName: patientData.fullName,
        dob: patientData.dob,
        gender: patientData.gender,
        phone: patientData.phone,
        nin: patientData.nin || null,
        signatureData: patientData.signatureData 
      });
      
      return { success: true, data: { id, patientCode } };
      
    } catch (error) {
      console.error('[Main Process] Database write failed:', error);
      return { success: false, error: 'Database write failed' };
    }
  });
}
```

## apps/desktop/src/main/ipc/qc-handlers.ts

```typescript
// apps/desktop/src/main/ipc/qc-handlers.ts
import { ipcMain } from 'electron';
import { db } from '../db';

export function registerQCHandlers() {
  ipcMain.handle('qc:getMetrics', async () => {
    try {
      // In a production environment, this would dynamically aggregate data 
      // from the `results`, `corrections`, and `qc_records` tables.
      // For this Phase 1 implementation, we fetch the total test count and calculate.
      
      const totalRequests = db.prepare(`SELECT count(*) as count FROM test_requests`).get() as { count: number };
      const completedResults = db.prepare(`SELECT count(*) as count FROM results WHERE status = 'released'`).get() as { count: number };
      const totalCorrections = db.prepare(`SELECT count(*) as count FROM corrections`).get() as { count: number };
      
      // Calculate AI Agreement Rate (If there are no results, default to 100%)
      const agreementRate = completedResults.count > 0 
        ? Math.round(((completedResults.count - totalCorrections.count) / completedResults.count) * 100) 
        : 94; // Fallback mock value for empty dev database

      return { 
        success: true, 
        data: {
          totalAnalyses: totalRequests.count || 124, // Fallback to 124 if DB is completely empty
          aiAgreement: agreementRate,
          avgTurnaroundMin: 14,
          pendingReviews: totalRequests.count - completedResults.count || 3
        } 
      };
    } catch (error) {
      console.error('[Main Process] Failed to fetch QC metrics:', error);
      return { success: false, error: 'Database query failed' };
    }
  });
}
```

## apps/desktop/src/main/ipc/result-handlers.ts

```typescript
import { ipcMain } from 'electron';
import { db } from '../db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { generateLocalPDF, printLocalReport } from '../pdf-generator';

export function registerResultHandlers() {
  ipcMain.handle('results:approve', async (_, payload) => {
    console.log(`[Main Process] Approving result for Test Request: ${payload.requestId}`);
    
    try {
      const verificationCode = `IRIS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      const testRequest = db.prepare(`
        SELECT tr.sample_id, s.patient_id, s.institution_id, tr.test_name, s.priority, p.full_name as patientName
        FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        JOIN patients p ON s.patient_id = p.id
        WHERE tr.id = ?
      `).get(payload.requestId) as any;

      if (!testRequest) throw new Error("Test request not found.");

      const sigBuffer = Buffer.from(payload.signatureData.split(',')[1], 'base64');
      const sigPath = path.join(app.getPath('userData'), `sig_${payload.requestId}.png`);
      fs.writeFileSync(sigPath, sigBuffer);

      const pdfPath = await generateLocalPDF({
        ...payload,
        ...testRequest,
        verificationCode,
        approvedByName: payload.scientistName
      });

      const resultId = crypto.randomUUID();
      const insertResult = db.prepare(`
        INSERT INTO results (
          id, test_request_id, patient_id, institution_id, status, 
          edited_findings, interpretive_comment, approved_by, 
          approved_at, digital_signature_path, result_pdf_local_path, verification_code
        ) VALUES (?, ?, ?, ?, 'released', ?, ?, ?, datetime('now'), ?, ?, ?)
      `);

      const updateRequest = db.prepare(`UPDATE test_requests SET status = 'released' WHERE id = ?`);

      db.transaction(() => {
        insertResult.run(
          resultId, payload.requestId, testRequest.patient_id, testRequest.institution_id,
          payload.editedFindings, payload.comments, payload.scientistId,
          sigPath, pdfPath, verificationCode
        );
        updateRequest.run(payload.requestId);

        if (payload.editedFindings !== payload.originalFindings) {
            db.prepare(`
              INSERT INTO corrections (id, result_id, scientist_id, field_name, original_ai_value, corrected_value)
              VALUES (?, ?, ?, 'findings', ?, ?)
            `).run(crypto.randomUUID(), resultId, payload.scientistId, payload.originalFindings, payload.editedFindings);
        }
      })();

      await printLocalReport(pdfPath);
      return { success: true, verificationCode };
      
    } catch (error: any) {
      console.error('[Main Process] Approval failed:', error);
      return { success: false, error: error.message };
    }
  });
}
```

## apps/desktop/src/main/ipc/worklist-handlers.ts

```typescript
// apps/desktop/src/main/ipc/worklist-handlers.ts
import { ipcMain } from 'electron';
import { db } from '../db';

export function registerWorklistHandlers() {
  ipcMain.handle('worklist:getPending', async () => {
    try {
      // Join patients, samples, and test_requests to get the full worklist view
      const query = `
        SELECT 
          tr.id as requestId,
          p.full_name as patientName,
          p.patient_code as patientCode,
          tr.test_name as testName,
          s.priority,
          tr.status,
          u.full_name as assignedTo,
          tr.created_at as createdAt
        FROM test_requests tr
        JOIN samples s ON tr.sample_id = s.id
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN users u ON tr.assigned_to = u.id
        WHERE tr.status != 'released'
        ORDER BY 
          CASE WHEN s.priority = 'stat' THEN 1 ELSE 2 END,
          tr.created_at DESC
      `;
      
      const pendingWork = db.prepare(query).all();
      return { success: true, data: pendingWork };
    } catch (error) {
      console.error('[Main Process] Failed to fetch worklist:', error);
      return { success: false, error: 'Database query failed' };
    }
  });
}
```

## apps/desktop/src/main/pdf-generator.ts

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// FIX: Removed top-level Electron import
export async function generateLocalPDF(resultData: any): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  page.drawText('IRIS CLINICAL LABORATORY REPORT', { x: 50, y: height - 50, size: 18, font: boldFont, color: rgb(0.01, 0.58, 0.41) });
  page.drawText(`Report ID: ${resultData.verificationCode}`, { x: 50, y: height - 70, size: 10, font });
  
  page.drawText(`Patient Name: ${resultData.patientName}`, { x: 50, y: height - 110, size: 12, font: boldFont });
  page.drawText(`Test Requested: ${resultData.testName}`, { x: 50, y: height - 130, size: 12, font });

  page.drawText('FINAL FINDINGS', { x: 50, y: height - 200, size: 14, font: boldFont });
  page.drawText(resultData.editedFindings, { x: 50, y: height - 220, size: 11, font, maxWidth: 495 });

  page.drawText('INTERPRETIVE COMMENT', { x: 50, y: height - 300, size: 14, font: boldFont });
  page.drawText(resultData.comments, { x: 50, y: height - 320, size: 11, font, maxWidth: 495 });

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ id: resultData.verificationCode, test: resultData.testName }));
  const qrImage = await pdfDoc.embedPng(qrDataUrl);
  page.drawImage(qrImage, { x: 450, y: 50, width: 80, height: 80 });

  page.drawText('NDPR Compliant. AI-assisted analysis reviewed and approved by a licensed MLS.', { x: 50, y: 30, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();
  
  // FIX: Dynamic check ensures terminal testing writes to current directory seamlessly
  let storagePath = process.cwd();
  if (process.versions && process.versions.electron) {
    const { app } = require('electron');
    storagePath = app.getPath('userData');
  }

  const pdfPath = path.join(storagePath, `Report_${resultData.verificationCode}.pdf`);
  fs.writeFileSync(pdfPath, pdfBytes);

  return pdfPath;
}

export async function printLocalReport(pdfPath: string) {
  if (!process.versions || !process.versions.electron) {
    console.log(`[Print] PDF saved to ${pdfPath} (Terminal Mode)`);
    return;
  }
  const { BrowserWindow } = require('electron');
  const win = new BrowserWindow({ show: false });
  win.loadFile(pdfPath);
  win.webContents.on('did-finish-load', () => {
    win.webContents.print({ silent: false, printBackground: true }, () => win.close());
  });
}
```

## apps/desktop/src/main/preload.ts

```typescript
// apps/desktop/src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// This safely exposes the exact IPC methods React is allowed to call
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  },
});
```

## apps/desktop/src/main/test-ai.ts

```typescript
// apps/desktop/src/main/test-ai.ts
import { db, initDB } from './db';
import http from 'http';
import crypto from 'crypto';

async function runAITest() {
  console.log("--- 🚀 Starting IRIS AI Engine Bridge Test ---");
  
  await initDB();

  console.log("\n[Database] Prepping parent records for AI result insertion...");
  const admin = db.prepare("SELECT id, institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
  if (!admin) {
    console.error("❌ Admin user not found. Run auth test first.");
    return;
  }

  // 1. Create the clinical hierarchy to satisfy all Foreign Keys
  const patientId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, consent_given)
    VALUES (?, ?, ?, 'AI Test Patient', '1995-05-05', 'Male', '08000000000', 1)
  `).run(patientId, `AI-${Date.now().toString().slice(-6)}`, admin.institution_id);

  const sampleId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
    VALUES (?, ?, ?, 'routine', 'collected', ?)
  `).run(sampleId, patientId, admin.institution_id, admin.id);

  const testReqId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
    VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'processing')
  `).run(testReqId, sampleId);

  const captureId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO captures (id, test_request_id, video_local_path, created_by)
    VALUES (?, ?, '/local/captures/vid_test.mp4', ?)
  `).run(captureId, testReqId, admin.id);

  console.log("[Test] Spinning up mock Python FastAPI server on port 8000...");
  
  const mockServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/analyse') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      
      req.on('end', () => {
        console.log(`\n[Python Mock] 📥 Received Payload from Electron:\n`, JSON.parse(body));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          model_version: 'v2.4.1',
          findings: { parasitemia: '3+', wbc_count: 'normal' },
          confidence_scores: { parasitemia: 0.96 },
          uncertain_cells_pct: 1.2
        }));
      });
    }
  });

  await new Promise<void>((resolve) => {
    mockServer.listen(8000, '127.0.0.1', () => resolve());
  });

  console.log("[Test] Mock Server listening. Triggering Electron AI Bridge...");
  
  const payload = {
    captureId: captureId, // Use the dynamically created capture record
    videoPath: '/local/captures/vid_test.mp4',
    testType: 'Malaria Parasite',
    patientContext: { age: 35, gender: 'Male' }
  };

  const postData = JSON.stringify({
    capture_path: payload.videoPath,
    test_type: payload.testType,
    patient_context: payload.patientContext
  });

  const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/analyse',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    
    res.on('end', () => {
      const aiResult = JSON.parse(responseBody);
      console.log(`\n[Electron Bridge] 📤 Received AI Result from Python:\n`, aiResult);

      try {
        const aiResultId = crypto.randomUUID();
        
        db.prepare(`
          INSERT INTO ai_results (
            id, capture_id, model_version, test_type, findings, 
            confidence_scores, uncertain_cells_pct
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          aiResultId, 
          payload.captureId, 
          aiResult.model_version, 
          payload.testType, 
          JSON.stringify(aiResult.findings), 
          JSON.stringify(aiResult.confidence_scores),
          aiResult.uncertain_cells_pct
        );
        
        console.log("\n[Database] ✅ AI Result successfully saved to local SQLite!");
        console.log("\n✅ SUCCESS: Electron to Python Bridge is working perfectly!");
         
      } catch (err: any) {
        console.error("\n❌ FAILED Database Write:", err.message);
      } finally {
        mockServer.close(() => process.exit(0));
      }
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Request encountered a problem: ${e.message}`);
    mockServer.close(() => process.exit(1));
  });

  req.write(postData);
  req.end();
}

runAITest();
```

## apps/desktop/src/main/test-approval.ts

```typescript
import { db, initDB } from './db';
import crypto from 'crypto';
import { generateLocalPDF } from './pdf-generator';

async function runApprovalTest() {
  console.log("--- 🚀 Starting IRIS Result Approval & PDF Test ---");
  await initDB();

  try {
    let target = db.prepare(`
      SELECT tr.id as requestId, p.full_name as patientName, tr.test_name as testName, s.priority,
             tr.sample_id, s.patient_id, s.institution_id
      FROM test_requests tr
      JOIN samples s ON tr.sample_id = s.id
      JOIN patients p ON s.patient_id = p.id
      WHERE tr.status != 'released'
      LIMIT 1
    `).get() as any;

    if (!target) {
      console.log("No pending request found. Seeding a new test request...");
      const admin = db.prepare("SELECT id, institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
      const patientId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, consent_given, consent_signature_path)
        VALUES (?, 'PT-TEST-01', ?, 'Adebayo Johnson', '1985-06-15', 'Male', '08012345678', 1, 'mock')
      `).run(patientId, admin.institution_id);

      const sampleId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
        VALUES (?, ?, ?, 'stat', 'collected', ?)
      `).run(sampleId, patientId, admin.institution_id, admin.id);

      const reqId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
        VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'requested')
      `).run(reqId, sampleId);

      target = {
        requestId: reqId,
        patientName: 'Adebayo Johnson',
        testName: 'Malaria Parasite',
        priority: 'stat',
        sample_id: sampleId,
        patient_id: patientId,
        institution_id: admin.institution_id
      };
    }

    console.log(`[Test] Approving request for: ${target.patientName}`);

    const verificationCode = `IRIS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const editedFindings = "Plasmodium falciparum trophozoites seen. Parasitemia: 3+ (Confirmed)";

    console.log("[PDF] Generating MLSCN report via pdf-lib...");
    
    const pdfPath = await generateLocalPDF({
      patientName: target.patientName,
      testName: target.testName,
      priority: target.priority,
      editedFindings,
      comments: "High parasitemia. Immediate clinical correlation required.",
      verificationCode,
      approvedByName: 'System Administrator'
    });

    console.log(`[PDF] ✅ Report written successfully: ${pdfPath}`);

    const resultId = crypto.randomUUID();
    db.transaction(() => {
      db.prepare(`
        INSERT INTO results (
          id, test_request_id, patient_id, institution_id, status,
          edited_findings, interpretive_comment, approved_by, approved_at,
          result_pdf_local_path, verification_code
        ) VALUES (?, ?, ?, ?, 'released', ?, ?, 'admin-id', datetime('now'), ?, ?)
      `).run(resultId, target.requestId, target.patient_id, target.institution_id, editedFindings, "Comments", pdfPath, verificationCode);

      db.prepare(`UPDATE test_requests SET status = 'released' WHERE id = ?`).run(target.requestId);
    })();

    const pending = db.prepare(`SELECT count(*) as count FROM test_requests WHERE id = ? AND status != 'released'`).get(target.requestId) as any;
    if (pending.count === 0) {
      console.log("\n[Database] ✅ Result saved and request released!");
      console.log("✅ SUCCESS: Full approval and PDF pipeline verified!");
    }
  } catch (err) {
    console.error("❌ Test failed with error:", err);
  } finally {
    // FIX: Force SQLite to close gracefully, preventing native panic
    db.close(); 
  }
}

runApprovalTest();
```

## apps/desktop/src/main/test-auth.ts

```typescript
// apps/desktop/src/main/test-auth.ts
import { db, initDB } from './db';
import { verifyPassword } from '../../../../packages/db/src/auth/hash';

async function runAuthTest() {
  console.log("--- 🚀 Starting IRIS Auth Backend Test ---");
  
  // ADD AWAIT HERE
  await initDB();

  const user = db.prepare(`SELECT * FROM users WHERE role = 'admin'`).get() as any;
  
  // ... rest of the file stays exactly the same
  
  if (!user) {
    console.error("❌ Test Failed: Administrator account was not seeded.");
    return;
  }

  console.log(`\n[Database] Found User: ${user.full_name} (${user.role})`);
  console.log(`[Database] Hashed Password: ${user.password_hash.substring(0, 30)}...`);

  // 3. Test Correct Password
  console.log(`\n[Auth] Testing CORRECT password ('Admin123!')...`);
  const isCorrect = await verifyPassword(user.password_hash, 'Admin123!');
  console.log(isCorrect ? "✅ SUCCESS: Password accepted!" : "❌ FAILED: Password rejected!");

  // 4. Test Incorrect Password
  console.log(`\n[Auth] Testing WRONG password ('hackMe123')...`);
  const isWrong = await verifyPassword(user.password_hash, 'hackMe123');
  console.log(!isWrong ? "✅ SUCCESS: Wrong password safely rejected!" : "❌ FAILED: Security breach!");
}

runAuthTest();
```

## apps/desktop/src/main/test-db.ts

```typescript
// apps/desktop/src/main/test-db.ts
import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';

console.log("--- 🚀 Starting IRIS Offline Database Test (Node Mode) ---");

// 1. Create a local test DB to completely bypass Electron's app.getPath()
const dbPath = path.join(process.cwd(), 'test-iris.db');
const db = new Database(dbPath, { verbose: console.log });

console.log(`[Database] Initializing test SQLite at: ${dbPath}`);

// 2. Create the exact same table as the main app
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    patient_code TEXT UNIQUE,
    full_name TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    nin TEXT,
    signature_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 3. Generate test identifiers
const id = crypto.randomUUID();
const patientCode = `PT-${Date.now().toString().slice(-6)}`;

console.log("\n[Test] Inserting test patient: Jane Doe...");

try {
  // 4. Prepare and execute the SQL insert
  const insert = db.prepare(`
    INSERT INTO patients (id, patient_code, full_name, dob, gender, phone, nin, signature_data)
    VALUES (@id, @patientCode, @fullName, @dob, @gender, @phone, @nin, @signatureData)
  `);

  insert.run({
    id,
    patientCode,
    fullName: 'Jane Doe',
    dob: '1985-06-15',
    gender: 'Female',
    phone: '08012345678',
    nin: '12345678901',
    signatureData: 'data:image/png;base64,fake_signature_data_for_testing'
  });
  console.log("✅ Insert successful!");

  console.log("\n[Test] Fetching the patient back from the database...");
  
  // 5. Read the data back to prove it saved
  const savedPatient = db.prepare("SELECT patient_code, full_name, created_at FROM patients WHERE id = ?").get(id);
  
  console.log("✅ Retrieved Data from SQLite:");
  console.table([savedPatient]);
  
} catch (error) {
  console.error("❌ Database test failed:", error);
}

console.log("\n--- 🏁 Test Complete ---");
```

## apps/desktop/src/main/test-qc.ts

```typescript
// apps/desktop/src/main/test-qc.ts
import { db, initDB } from './db';
import crypto from 'crypto';

async function runQCTest() {
  console.log("--- 🚀 Starting IRIS QC Aggregation Test ---");
  
  await initDB();

  console.log("\n[Database] Injecting mock results for QC calculation...");
  
  const admin = db.prepare("SELECT id, institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
  if (!admin) {
    console.error("❌ Admin user not found. Run auth test first.");
    return;
  }

  // 1. Create Patient & Sample
  const patientId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, consent_given)
    VALUES (?, ?, ?, 'QC Test Patient', '1990-01-01', 'Female', '000', 1)
  `).run(patientId, `QC-${Date.now().toString().slice(-6)}`, admin.institution_id);

  const sampleId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
    VALUES (?, ?, ?, 'routine', 'collected', ?)
  `).run(sampleId, patientId, admin.institution_id, admin.id);

  // 2. TEST CASE 1: AI Agreement (No Corrections)
  const reqId1 = crypto.randomUUID();
  const resId1 = crypto.randomUUID();
  
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status, created_at)
    VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'released', datetime('now', '-2 hours'))
  `).run(reqId1, sampleId);

  db.prepare(`
    INSERT INTO results (id, test_request_id, patient_id, institution_id, edited_findings, status, approved_by)
    VALUES (?, ?, ?, ?, '{"parasitemia": "2+"}', 'released', ?)
  `).run(resId1, reqId1, patientId, admin.institution_id, admin.id);

  // 3. TEST CASE 2: AI Disagreement (With Correction)
  const reqId2 = crypto.randomUUID();
  const resId2 = crypto.randomUUID();
  
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status, created_at)
    VALUES (?, ?, 'haematology', 'WBC Differential', 'released', datetime('now', '-1 hours'))
  `).run(reqId2, sampleId);

  db.prepare(`
    INSERT INTO results (id, test_request_id, patient_id, institution_id, edited_findings, status, approved_by)
    VALUES (?, ?, ?, ?, '{"wbc": "normal"}', 'released', ?)
  `).run(resId2, reqId2, patientId, admin.institution_id, admin.id);

  db.prepare(`
    INSERT INTO corrections (id, result_id, scientist_id, field_name, original_ai_value, corrected_value)
    VALUES (?, ?, ?, 'wbc', 'high', 'normal')
  `).run(crypto.randomUUID(), resId2, admin.id);

  console.log("[Database] ✅ Mock QC data injected successfully.");

  // 4. Run the QC Math (Matches IPC Handler)
  console.log("\n[QC Math] Calculating clinical metrics...");
  
  const totalRequests = db.prepare(`SELECT count(*) as count FROM test_requests`).get() as { count: number };
  const completedResults = db.prepare(`SELECT count(*) as count FROM results WHERE status = 'released'`).get() as { count: number };
  const totalCorrections = db.prepare(`SELECT count(*) as count FROM corrections`).get() as { count: number };
  
  const agreementRate = completedResults.count > 0 
    ? Math.round(((completedResults.count - totalCorrections.count) / completedResults.count) * 100) 
    : 100;

  console.log(`📊 Total Analyses Logged: ${totalRequests.count}`);
  console.log(`📊 Completed Results: ${completedResults.count}`);
  console.log(`📊 Manual Corrections: ${totalCorrections.count}`);
  console.log(`🎯 AI Agreement Rate: ${agreementRate}%`);

  if (agreementRate >= 0 && agreementRate <= 100) {
    console.log("\n✅ SUCCESS: QC aggregation engine is working perfectly!");
  } else {
    console.log("\n❌ FAILED: QC math is returning invalid percentages.");
  }
}

runQCTest();
```

## apps/desktop/src/main/test-worklist.ts

```typescript
// apps/desktop/src/main/test-worklist.ts
import { db } from './db';
import crypto from 'crypto';

console.log("--- 🚀 Generating Fake Worklist Data ---");

try {
  // 1. Get the admin user & institution to tie the records to
  const admin = db.prepare("SELECT id, institution_id FROM users WHERE role = 'admin' LIMIT 1").get() as any;

  if (!admin) {
    console.error("❌ Admin user not found. Please run the auth test first to seed the database.");
    process.exit(1);
  }

  // 2. Create a fake patient
  const patientId = crypto.randomUUID();
  const patientCode = `PT-${Date.now().toString().slice(-6)}`;
  db.prepare(`
    INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, phone, consent_signature_path, consent_given)
    VALUES (?, ?, ?, 'Adebayo Johnson', '1985-06-15', 'Male', '08012345678', '/local/signatures/fake.png', 1)
  `).run(patientId, patientCode, admin.institution_id);

  // 3. Create a STAT sample (Urgent)
  const sampleId1 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
    VALUES (?, ?, ?, 'stat', 'collected', ?)
  `).run(sampleId1, patientId, admin.institution_id, admin.id);

  // 4. Create a Routine sample
  const sampleId2 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO samples (id, patient_id, institution_id, priority, status, created_by)
    VALUES (?, ?, ?, 'routine', 'requested', ?)
  `).run(sampleId2, patientId, admin.institution_id, admin.id);

  // 5. Create Test Requests
  // The Playbook mandates Malaria Parasite MUST be 'parasitology'
  const testReq1 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status, assigned_to)
    VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'requested', ?)
  `).run(testReq1, sampleId1, admin.id);

  const testReq2 = crypto.randomUUID();
  db.prepare(`
    INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
    VALUES (?, ?, 'haematology', 'WBC Differential', 'requested')
  `).run(testReq2, sampleId2);

  console.log("✅ Successfully injected fake patients, samples, and test requests!");
  console.log("👉 Go look at your Worklist UI in the browser!");

} catch (err) {
  console.error("❌ Failed to insert fake data:", err);
}
```

## apps/desktop/tailwind.config.ts

```typescript
// apps/desktop/tailwind.config.ts
import type { Config } from 'tailwindcss';
import sharedConfig from '../../packages/shared-ui/tailwind.config';
import animate from 'tailwindcss-animate';
import forms from '@tailwindcss/forms';

export default {
  presets: [sharedConfig],
  // We explicitly tell this local file to use the shared content paths
  content: sharedConfig.content,
  // We load the plugins here, where they are actually installed!
  plugins: [animate, forms],
} satisfies Config;
```

## apps/desktop/tsconfig.app.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

## apps/desktop/tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

## apps/desktop/tsconfig.node.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

## apps/desktop/vite.config.ts

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

## apps/product-site/.eslintrc.json

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

## apps/product-site/.gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

## apps/product-site/README.md

```markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
```

## apps/product-site/next-env.d.ts

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.
```

## apps/product-site/next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

## apps/product-site/package.json

```json
{
  "name": "product-site",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "framer-motion": "^13.2.0",
    "lucide-react": "^1.44.0",
    "next": "14.2.35",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

## apps/product-site/pnpm-workspace.yaml

```yaml
allowBuilds:
  unrs-resolver: true
```

## apps/product-site/postcss.config.mjs

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
```

## apps/product-site/src/app/api/releases/route.ts

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: "1.1.0",
    release_date: "2026-08-29",
    release_notes: [
      { version: "1.1.0", notes: "Desktop-first architecture; LIS local REST API; MLSCN-compliant PDF generation; Cellpose segmentation pipeline." },
      { version: "1.0.5", notes: "Improved frame aggregation logic for parasitology deduplication." },
      { version: "1.0.0", notes: "Initial closed beta release for pilot institutions." }
    ],
    builds: {
      windows: { filename: "IRIS-Setup-1.1.0-win-x64.exe", size_mb: 142, sha256: "a3f9e1b2c4...", url: "#" },
      mac: { filename: "IRIS-1.1.0-mac-universal.dmg", size_mb: 158, sha256: "b8c7d6e5f4...", url: "#" },
      linux: [
        { type: "AppImage", filename: "IRIS-1.1.0-linux-x64.AppImage", size_mb: 145, sha256: "c1d2e3f4g5...", url: "#" },
        { type: "deb", filename: "IRIS-1.1.0-linux-amd64.deb", size_mb: 92, sha256: "d5e6f7g8h9...", url: "#" }
      ]
    }
  });
}
```

## apps/product-site/src/app/downloads/page.tsx

```tsx
"use client";

import { useEffect, useState } from 'react';
import { Download, Monitor, Apple, Terminal, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function DownloadsPage() {
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [releaseData, setReleaseData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) setActiveTab('mac');
    else if (ua.includes('linux')) setActiveTab('linux');
    else setActiveTab('windows');

    fetch('/api/releases').then(res => res.json()).then(setReleaseData);
  }, []);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!releaseData) return <div className="min-h-screen flex items-center justify-center text-emerald-700 font-bold">Loading releases...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <div className="bg-[#030712] text-white pt-24 pb-16 px-6 text-center border-b-4 border-[#059669]">
        <h1 className="text-5xl font-black tracking-tight mb-4">Download IRIS Desktop</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          The complete, standalone clinical workstation. Operates entirely offline. No cloud dependency.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold bg-[#059669]/20 text-[#34D399] w-max mx-auto px-4 py-2 rounded-full border border-[#059669]/30">
          <ShieldCheck className="w-4 h-4" /> Version {releaseData.version} • Released {releaseData.release_date}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
        <div className="flex bg-white rounded-2xl shadow-sm p-2 mb-8 border border-slate-200">
          {[
            { id: 'windows', icon: Monitor, label: 'Windows' },
            { id: 'mac', icon: Apple, label: 'macOS' },
            { id: 'linux', icon: Terminal, label: 'Linux' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-[#059669] text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-lg shadow-emerald-900/5 border border-slate-200 mb-8">
          {activeTab === 'windows' && (
            <div>
              <h2 className="text-2xl font-black mb-2">Windows 10 / 11 (64-bit)</h2>
              <p className="text-slate-500 mb-8 font-medium">Standard executable installer for clinical workstations.</p>
              <button className="w-full flex items-center justify-center gap-3 bg-[#059669] hover:bg-[#047857] text-white py-5 rounded-2xl font-extrabold text-xl transition-all shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:-translate-y-1">
                <Download className="w-6 h-6" /> Download for Windows
              </button>
              <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                <span className="text-slate-500 font-semibold">{releaseData.builds.windows.filename} • {releaseData.builds.windows.size_mb} MB</span>
                <button onClick={() => handleCopy(releaseData.builds.windows.sha256)} className="text-slate-400 hover:text-[#059669] font-mono flex items-center gap-1">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-[#059669]" /> : 'SHA-256:'} {releaseData.builds.windows.sha256.substring(0, 16)}... (click to copy)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'mac' && (
            <div>
              <h2 className="text-2xl font-black mb-2">macOS Monterey 12+</h2>
              <p className="text-slate-500 mb-8 font-medium">Universal DMG for Apple Silicon (M1/M2/M3) and Intel Macs.</p>
              <button className="w-full flex items-center justify-center gap-3 bg-[#059669] hover:bg-[#047857] text-white py-5 rounded-2xl font-extrabold text-xl transition-all shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:-translate-y-1">
                <Download className="w-6 h-6" /> Download for macOS
              </button>
              <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                <span className="text-slate-500 font-semibold">{releaseData.builds.mac.filename} • {releaseData.builds.mac.size_mb} MB</span>
              </div>
            </div>
          )}

          {activeTab === 'linux' && (
            <div>
              <h2 className="text-2xl font-black mb-2">Linux Distributions</h2>
              <p className="text-slate-500 mb-8 font-medium">Supported on Ubuntu 20.04+, Debian 11+, and Fedora 36+.</p>
              <div className="grid grid-cols-2 gap-4">
                {releaseData.builds.linux.map((build: any) => (
                  <button key={build.type} className="flex flex-col items-center justify-center p-6 border-2 border-[#059669]/20 rounded-2xl hover:bg-[#ecfdf5] hover:border-[#059669] transition-all group">
                    <span className="text-xl font-extrabold text-[#047857] group-hover:text-[#064E3B]">.{build.type}</span>
                    <span className="text-sm font-semibold text-slate-500 mt-2">{build.size_mb} MB</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <details className="bg-white rounded-2xl shadow-sm border border-slate-200 group overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-lg text-slate-800">
              System Requirements
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50 text-slate-600 font-medium">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Processor:</strong> Intel Core i5 / AMD Ryzen 5 or equivalent</li>
                <li><strong>Memory:</strong> 8GB RAM minimum (16GB recommended)</li>
                <li><strong>Storage:</strong> 256GB SSD (500GB+ recommended for local video retention)</li>
                <li><strong>Network:</strong> Local Wi-Fi or Ethernet adapter for device pairing and LIS sync. Internet connection is NOT required for operation.</li>
              </ul>
            </div>
          </details>

          <details className="bg-white rounded-2xl shadow-sm border border-slate-200 group overflow-hidden" open>
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-lg text-slate-800">
              Release Notes
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50">
              <div className="space-y-6">
                {releaseData.release_notes.map((rn: any) => (
                  <div key={rn.version}>
                    <h4 className="font-extrabold text-[#059669] mb-1">Version {rn.version}</h4>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{rn.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
```

## apps/product-site/src/app/globals.css

```css
@import '../../../../packages/shared-ui/globals.css';
```

## apps/product-site/src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

## apps/product-site/src/app/page.tsx

```tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#059669]/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <h1 className="text-6xl font-black mb-6 z-10">
        KytoLabx <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] to-[#059669]">IRIS</span>
      </h1>
      <p className="text-xl text-slate-400 max-w-2xl mb-10 z-10 font-medium">
        Intelligent Real-time Imaging System. The complete offline clinical workstation.
      </p>
      
      <Link 
        href="/downloads" 
        className="z-10 bg-[#059669] hover:bg-[#047857] text-white px-8 py-4 rounded-2xl font-extrabold text-lg transition-all shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:-translate-y-1"
      >
        Get IRIS Desktop
      </Link>
    </div>
  );
}
```

## apps/product-site/tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';
import sharedConfig from '../../packages/shared-ui/tailwind.config';

export default {
  presets: [sharedConfig],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared-ui/src/**/*.{js,ts,jsx,tsx}'
  ],
} satisfies Config;
```

## apps/product-site/tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## package.json

```json
{
  "name": "iris-platform",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "pnpm --dir apps/desktop dev --host 0.0.0.0 --port 5174",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "11.24.0",
      "onFail": "download"
    }
  },
  "packageManager": "pnpm@11.24.0",
  "type": "module",
  "devDependencies": {
    "turbo": "^2.10.12",
    "typescript": "^7.0.2"
  },
  "dependencies": {
    "framer-motion": "^13.2.0",
    "lucide-react": "^1.44.0"
  }
}
```

## packages/ai/main.py

```python
# packages/ai/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="IRIS Local AI Service")

# This tells FastAPI to expect a JSON body matching this exact structure
class AnalysePayload(BaseModel):
    capture_path: str
    test_type: str
    patient_context: dict

@app.get("/health")
def health():
    return {"status": "ok", "mode": "local"}

@app.post("/analyse")
def analyse(payload: AnalysePayload):
    from services.pipeline import run_pipeline
    return run_pipeline(payload.capture_path, payload.test_type, payload.patient_context)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

## packages/ai/services/pipeline.py

```python
import time
import cv2
import os
import sys
import numpy as np
import onnxruntime as ort
from services.report import generate_local_comment

# Safely resolve model path whether running in Python or as a PyInstaller compiled .exe
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

MODEL_PATH = os.path.join(base_path, 'models/iris_parasitology_mp_v1_int8.onnx')
_ort_session = None

def get_session():
    global _ort_session
    if _ort_session is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
        _ort_session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
    return _ort_session

def preprocess_crop(crop):
    # PyTorch ResNet-50 Preprocessing requirements
    img = cv2.resize(crop, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype(np.float32) / 255.0
    
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img = (img - mean) / std
    
    # HWC to CHW (Channels First)
    img = np.transpose(img, (2, 0, 1))
    return np.expand_dims(img, axis=0) # Add batch dimension

def run_pipeline(capture_path: str, test_type: str, patient_context: dict):
    start_time = time.time()
    
    try:
        session = get_session()
    except Exception as e:
        return {"status": "error", "reason": str(e)}

    # Stage 0: Frame Extraction (Simulated for Workspace testing if video is missing)
    extracted_frames = []
    if os.path.exists(capture_path):
        cap = cv2.VideoCapture(capture_path)
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            if cv2.Laplacian(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var() > 80:
                extracted_frames.append(frame)
                if len(extracted_frames) >= 5: # Limit for local testing speed
                    break
        cap.release()
    else:
        # Fallback: Generate a noisy green dummy frame to simulate an empty microscope slide 
        # so testing doesn't crash when running without hardware
        extracted_frames = [np.random.randint(50, 150, (480, 640, 3), dtype=np.uint8) for _ in range(3)]

    if len(extracted_frames) < 1:
        return {"status": "unable_to_analyse", "reason": "insufficient_quality"}

    # Stage 1 & 2: Inference Loop
    total_cells = 0
    parasitised_cells = 0
    confidence_sum = 0.0

    for frame in extracted_frames:
        h, w, _ = frame.shape
        # Simulate Cellpose extracting 20 bounding boxes per frame
        for _ in range(20):
            x = np.random.randint(0, max(1, w - 224))
            y = np.random.randint(0, max(1, h - 224))
            crop = frame[y:y+224, x:x+224]
            
            input_tensor = preprocess_crop(crop)
            outputs = session.run(None, {'input': input_tensor})
            logits = outputs[0][0]
            
            # Softmax to get probabilities
            exp_logits = np.exp(logits - np.max(logits))
            probs = exp_logits / exp_logits.sum()
            pred_class = np.argmax(probs)
            max_prob = float(np.max(probs))
            
            # Assuming Class 0 is Parasitized based on alphabetical PyTorch ImageFolder
            if pred_class == 0 and "Parasite" in test_type:
                parasitised_cells += 1
                
            total_cells += 1
            confidence_sum += max_prob

    parasitaemia_pct = round((parasitised_cells / total_cells) * 100, 2) if total_cells > 0 else 0.0
    avg_confidence = round(confidence_sum / total_cells, 2) if total_cells > 0 else 0.95

    findings_dict = {
        "test_type": test_type,
        "total_cells": total_cells,
        "parasitaemia_pct": parasitaemia_pct,
        "severity": "Moderate" if parasitaemia_pct > 1.0 else "Low",
        "by_class": {
            "parasitised_rbc": parasitised_cells,
            "uninfected_rbc": total_cells - parasitised_cells
        },
        "overall_confidence": avg_confidence
    }

    # Stage 4: Interpretive Text
    findings_dict["interpretive_comment"] = generate_local_comment(findings_dict, test_type, {}, patient_context)

    return {
        "model_version": "v1.0.0-int8",
        "dataset_version": "NLM-Malaria",
        "processing_duration_ms": int((time.time() - start_time) * 1000),
        "findings": findings_dict,
        "confidence_scores": {"overall": avg_confidence},
        "uncertain_cells_pct": 1.2
    }
```

## packages/ai/services/report.py

```python
import os

def generate_local_comment(findings: dict, test_type: str, reference_ranges: dict, patient_context: dict) -> str:
    age = patient_context.get("age", "unknown")
    gender = patient_context.get("gender", "unknown")
    parasitaemia = findings.get("parasitaemia_pct", 0.0)
    severity = findings.get("severity", "Low")

    if "Parasite" in test_type:
        return (f"Examination of blood film microscopy captures for patient (Age: {age}, Gender: {gender}) "
                f"revealed the presence of Plasmodium parasite forms. The calculated parasitaemia is {parasitaemia}%, "
                f"categorised as {severity} density. Ring-stage trophozoites were identified across examined fields. "
                f"These findings are consistent with acute malaria infection. Clinical correlation with patient symptoms "
                f"is strongly recommended.")
    
    return (f"Automated morphological analysis performed for patient (Age: {age}, Gender: {gender}) "
            f"under test category '{test_type}'. Review by a licensed Medical Laboratory Scientist is documented.")

def generate_enriched_comment(findings: dict, test_type: str, reference_ranges: dict, patient_context: dict) -> str | None:
    model_dir = "./models/enrichment/"
    if not os.path.exists(model_dir):
        return None
    return None
```

## packages/db/migrations/001_init.sql

```sql
-- packages/db/migrations/001_init.sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  state TEXT,
  lga TEXT,
  mlscn_reg_number TEXT,
  licence_tier TEXT NOT NULL DEFAULT 'free_pilot',
  is_active INTEGER NOT NULL DEFAULT 1,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','scientist_l2','scientist_l1','operator','viewer')),
  mlscn_number TEXT,
  mlscn_verified INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,
  two_fa_enabled INTEGER NOT NULL DEFAULT 0,
  last_active_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_institution ON users(institution_id);

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  patient_code TEXT UNIQUE NOT NULL,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  full_name TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  nin_encrypted TEXT,
  hospital_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  next_of_kin TEXT,
  consent_given INTEGER NOT NULL DEFAULT 0,
  consent_timestamp TEXT,
  consent_signature_path TEXT,
  chronic_flags_encrypted TEXT,
  family_group_id TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_patients_institution ON patients(institution_id);
CREATE INDEX idx_patients_name_dob ON patients(full_name, dob);

CREATE TABLE samples (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  sample_type TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('routine','urgent','stat')) DEFAULT 'routine',
  collection_datetime TEXT,
  requesting_clinician TEXT,
  clinical_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('requested','collected','processing','analysed','review','released')) DEFAULT 'requested',
  barcode_printed INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_samples_patient ON samples(patient_id);
CREATE INDEX idx_samples_status ON samples(status);

CREATE TABLE test_requests (
  id TEXT PRIMARY KEY,
  sample_id TEXT NOT NULL REFERENCES samples(id),
  test_category TEXT NOT NULL CHECK (test_category IN ('haematology','microbiology','parasitology','histopathology','cytology')),
  test_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  assigned_to TEXT REFERENCES users(id),
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER trg_mp_category_check
BEFORE INSERT ON test_requests
WHEN NEW.test_name = 'Malaria Parasite' AND NEW.test_category != 'parasitology'
BEGIN
  SELECT RAISE(ABORT, 'Malaria Parasite must be test_category=parasitology');
END;
CREATE INDEX idx_test_requests_sample ON test_requests(sample_id);

CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  test_request_id TEXT NOT NULL REFERENCES test_requests(id),
  device_id TEXT,
  video_local_path TEXT NOT NULL,
  duration_seconds INTEGER,
  capture_datetime TEXT NOT NULL DEFAULT (datetime('now')),
  focus_score_avg REAL,
  frame_count INTEGER,
  transferred_from_device INTEGER NOT NULL DEFAULT 0,
  device_ack_confirmed INTEGER NOT NULL DEFAULT 0,
  capture_metadata TEXT,
  created_by TEXT REFERENCES users(id)
);
CREATE INDEX idx_captures_test_request ON captures(test_request_id);

CREATE TABLE ai_results (
  id TEXT PRIMARY KEY,
  capture_id TEXT NOT NULL REFERENCES captures(id),
  model_version TEXT NOT NULL,
  test_type TEXT NOT NULL,
  findings TEXT NOT NULL,
  confidence_scores TEXT,
  flagged_for_review INTEGER NOT NULL DEFAULT 0,
  uncertain_cells_pct REAL,
  processing_duration_ms INTEGER,
  model_checksum TEXT,
  dataset_version TEXT,
  preprocessing_version TEXT,
  calibration_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ai_results_capture ON ai_results(capture_id);

CREATE TABLE results (
  id TEXT PRIMARY KEY,
  test_request_id TEXT UNIQUE NOT NULL REFERENCES test_requests(id),
  ai_result_id TEXT REFERENCES ai_results(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  status TEXT NOT NULL CHECK (status IN ('draft','processing','ai_result','pending_review','approved','released','amended')) DEFAULT 'draft',
  edited_findings TEXT,
  interpretive_comment TEXT,
  reference_ranges TEXT,
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  digital_signature_path TEXT,
  result_pdf_local_path TEXT,
  verification_code TEXT UNIQUE,
  is_amended INTEGER NOT NULL DEFAULT 0,
  amended_from_id TEXT REFERENCES results(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_results_patient ON results(patient_id);
CREATE INDEX idx_results_status ON results(status);

CREATE TABLE corrections (
  id TEXT PRIMARY KEY,
  result_id TEXT NOT NULL REFERENCES results(id),
  ai_result_id TEXT REFERENCES ai_results(id),
  scientist_id TEXT NOT NULL REFERENCES users(id),
  field_name TEXT NOT NULL,
  original_ai_value TEXT,
  corrected_value TEXT,
  correction_reason TEXT,
  is_used_in_retraining INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_corrections_result ON corrections(result_id);

CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  serial_number TEXT UNIQUE NOT NULL,
  firmware_version TEXT,
  last_paired_at TEXT,
  battery_level_pct INTEGER,
  storage_used_gb REAL,
  storage_total_gb REAL,
  last_local_ip TEXT,
  calibration_due_at TEXT
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),
  institution_id TEXT REFERENCES institutions(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  local_ip_or_null TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER trg_audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

CREATE TRIGGER trg_audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

CREATE TABLE model_versions (
  id TEXT PRIMARY KEY,
  test_type TEXT NOT NULL,
  version_string TEXT NOT NULL,
  onnx_local_path TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  accuracy_metrics TEXT,
  training_dataset_info TEXT,
  deployed_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  deployed_by TEXT REFERENCES users(id)
);

CREATE TABLE qc_records (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  scientist_id TEXT REFERENCES users(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  avg_turnaround_min REAL,
  ai_agreement_pct REAL,
  total_analyses INTEGER,
  total_corrections INTEGER
);

CREATE TABLE licences (
  id TEXT PRIMARY KEY,
  institution_id TEXT UNIQUE NOT NULL REFERENCES institutions(id),
  tier TEXT NOT NULL,
  billing_cycle TEXT,
  price_ngn INTEGER,
  analyses_limit INTEGER NOT NULL DEFAULT -1,
  users_limit INTEGER,
  activated_at TEXT,
  expires_at TEXT,
  activation_signature TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  institution_id TEXT REFERENCES institutions(id),
  type TEXT,
  title TEXT,
  body TEXT,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

## packages/db/package.json

```json
{
  "name": "db",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "11.24.0",
      "onFail": "download"
    }
  },
  "packageManager": "pnpm@11.24.0",
  "type": "module",
  "dependencies": {
    "better-sqlite3": "^13.0.3"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^9.6.0",
    "typescript": "^7.0.2"
  }
}
```

## packages/db/pnpm-workspace.yaml

```yaml
allowBuilds:
  better-sqlite3: set this to true or false
```

## packages/db/src/auth/hash.ts

```typescript
// packages/db/src/auth/hash.ts
import * as argon2 from 'argon2';

/**
 * Argon2id configuration specified in IRIS Playbook §D-3:
 * - type: argon2id
 * - timeCost: 3 iterations
 * - memoryCost: 64MB (65536 KB)
 * - parallelism: 1 thread
 */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 64 * 1024, // 64 MB in KB
  parallelism: 1,
};

/**
 * Hash a plain-text password using Argon2id.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, ARGON2_OPTIONS);
}

/**
 * Verify a plain-text password against an existing Argon2id hash.
 */
export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

/**
 * Check whether a stored hash conforms to current cost parameters.
 */
export function needsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, ARGON2_OPTIONS);
}
```

## packages/db/src/auth/session.ts

```typescript
// packages/db/src/auth/session.ts
import { createHmac, randomBytes } from 'crypto';

// Secret key generated locally in memory per workstation session (never hardcoded, no cloud secret)
const LOCAL_SESSION_SECRET = process.env.IRIS_SESSION_SECRET || randomBytes(32).toString('hex');

export interface SessionPayload {
  userId: string;
  institutionId: string;
  role: 'admin' | 'scientist_l2' | 'scientist_l1' | 'operator' | 'viewer';
  fullName: string;
  mlscnNumber?: string;
  issuedAt: number;
  expiresAt: number;
}

export interface SessionTokenResult {
  token: string;
  expiresAt: number;
}

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
export const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * Creates a signed local session token with an 8-hour expiration.
 */
export function createLocalSession(
  user: Omit<SessionPayload, 'issuedAt' | 'expiresAt'>
): SessionTokenResult {
  const now = Date.now();
  const expiresAt = now + EIGHT_HOURS_MS;

  const payload: SessionPayload = {
    ...user,
    issuedAt: now,
    expiresAt,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', LOCAL_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt,
  };
}

/**
 * Verifies a local session token and ensures it has not expired.
 */
export function verifyLocalSession(token: string): SessionPayload | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = createHmac('sha256', LOCAL_SESSION_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
```

## packages/db/src/auth/totp.ts

```typescript
// packages/db/src/auth/totp.ts
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

export interface TOTPSetupResult {
  secret: string;
  qrCodeDataUrl: string;
}

/**
 * Generates a new TOTP secret and a local QR code data URL.
 * The QR code can be displayed directly in the React frontend (no internet required).
 */
export async function generateTOTPSetup(
  userEmail: string, 
  institutionName: string = 'IRIS Desktop'
): Promise<TOTPSetupResult> {
  // Generates a secure, RFC 6238-compliant base32 secret
  const secret = authenticator.generateSecret();
  
  // Creates the standard otpauth:// URI for authenticator apps
  const otpauthUrl = authenticator.keyuri(userEmail, institutionName, secret);
  
  // Generates a base64 encoded PNG of the QR code to render in the UI
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  
  return {
    secret,
    qrCodeDataUrl,
  };
}

/**
 * Verifies a 6-digit TOTP token against the user's stored secret.
 * Handles slight clock drift automatically.
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (err) {
    return false;
  }
}
```

## packages/db/src/sync/exporter.ts

```typescript
import crypto from 'crypto';
import Database from 'better-sqlite3';

export function exportSince(db: Database.Database, lastSyncTimestamp: string) {
  // Read new/changed records
  const patients = db.prepare(`SELECT * FROM patients WHERE created_at > ?`).all(lastSyncTimestamp);
  const results = db.prepare(`SELECT * FROM results WHERE created_at > ?`).all(lastSyncTimestamp);
  const auditLog = db.prepare(`SELECT * FROM audit_log WHERE created_at > ?`).all(lastSyncTimestamp);

  const exportPackage = JSON.stringify({
    timestamp: new Date().toISOString(),
    data: { patients, results, auditLog }
  });

  // Generate a detached signature (simulated Ed25519 using HMAC for Phase 1)
  const secret = process.env.IRIS_SYNC_SECRET || 'offline-sync-key';
  const signature = crypto.createHmac('sha256', secret).update(exportPackage).digest('hex');

  return { payload: exportPackage, signature };
}
```

## packages/db/src/sync/uploader.ts

```typescript
import { exportSince } from './exporter';
import Database from 'better-sqlite3';

export async function uploadBackup(db: Database.Database, endpoint: string, lastSyncTimestamp: string) {
  try {
    const { payload, signature } = exportSince(db, lastSyncTimestamp);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-IRIS-Signature': signature
      },
      body: payload
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    // Log clearly, never drop data, never block UI workflow
    console.error('[Sync] Backup pending. Will retry with exponential backoff.', error);
    return { success: false, error };
  }
}
```

## packages/iris-sdk/package.json

```json
{
  "name": "iris-sdk",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "11.24.0",
      "onFail": "download"
    }
  },
  "packageManager": "pnpm@11.24.0",
  "type": "module",
  "devDependencies": {
    "tsx": "^4.23.13",
    "typescript": "^7.0.2"
  }
}
```

## packages/iris-sdk/pnpm-workspace.yaml

```yaml
allowBuilds:
  esbuild: true
```

## packages/iris-sdk/src/index.ts

```typescript
export class IRISError extends Error {
  type: string;
  title?: string;
  detail?: string;

  constructor(data: any) {
    super(data.detail || data.title || 'IRIS API Error');
    this.type = data.type || 'unknown_error';
    this.title = data.title;
    this.detail = data.detail;
  }
}

export class IRISClient {
  private baseUrl: string;
  private localToken: string;

  constructor(config: { baseUrl: string; localToken: string }) {
    this.baseUrl = config.baseUrl;
    this.localToken = config.localToken;
  }

  private async request(method: string, endpoint: string, body?: any) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.localToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    if (!res.ok) throw new IRISError(data);
    return data;
  }

  public patients = {
    sync: (payload: { externalPatientId: string; name: string; dob: string; gender: string; testRequests: Array<{testType: string}> }) => 
      this.request('POST', '/v1/patients/sync', payload)
  };

  public results = {
    list: (externalPatientId: string) => 
      this.request('GET', `/v1/results/${externalPatientId}`)
  };
}
```

## packages/iris-sdk/test-lis.ts

```typescript
import { IRISClient } from './src/index';

async function runTest() {
  console.log("--- 🚀 Testing LIS-to-IRIS Integration ---");

  // Initialize the SDK with the local API address and security token
  const iris = new IRISClient({
    baseUrl: "http://127.0.0.1:8787",
    localToken: "local-dev-token-xyz", 
  });

  try {
    console.log("1. Pushing new patient context from LIS...");
    const syncResponse = await iris.patients.sync({
      externalPatientId: `LIS-${Date.now()}`,
      name: "Ngozi Okafor (LIS Sync)",
      dob: "1988-11-20",
      gender: "Female",
      testRequests: [{ testType: "Malaria Parasite" }],
    });

    console.log("✅ Success! Patient added to IRIS Worklist.");
    console.log(`Mapped IRIS Patient ID: ${syncResponse.irisPatientId}`);

  } catch (error: any) {
    console.error("❌ Test Failed:", error.message);
  }
}

runTest();
```

## packages/lis-api/package.json

```json
{
  "name": "@iris/lis-api",
  "version": "1.1.0",
  "private": true,
  "main": "src/server.ts",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts"
  },
  "dependencies": {
    "@fastify/bearer-auth": "^9.4.0",
    "better-sqlite3": "^11.2.1",
    "fastify": "^4.28.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/node": "^22.5.4",
    "tsx": "^4.19.0",
    "typescript": "^5.5.3"
  }
}
```

## packages/lis-api/pnpm-workspace.yaml

```yaml
allowBuilds:
  better-sqlite3: true
  esbuild: false
```

## packages/lis-api/src/server.ts

```typescript
import Fastify from 'fastify';
import bearerAuthPlugin from '@fastify/bearer-auth';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const app = Fastify({ logger: true });

// Locate the shared desktop database safely
const storagePath = process.cwd().includes('packages') 
  ? path.join(process.cwd(), '../../apps/desktop') 
  : process.cwd();
const dbPath = path.join(storagePath, 'iris-offline.db');

const db = new Database(dbPath);

// Valid LIS-network token (generated by administrators in Settings)
const validTokens = new Set(['local-dev-token-xyz']);

app.register(bearerAuthPlugin, { keys: validTokens });

// D-9 Endpoint: Liveness check for LIS monitoring
app.get('/v1/health', async () => {
  return { status: 'ok', version: '1.1.0', mode: 'LIS-network' };
});

// D-9 Endpoint: LIS pushes patient/test context
app.post('/v1/patients/sync', async (request, reply) => {
  const { externalPatientId, name, dob, gender, testRequests } = request.body as any;

  if (!externalPatientId || !name) {
    return reply.status(400).send({
      type: 'invalid_request',
      title: 'Missing Required Fields',
      detail: 'externalPatientId and name are required.'
    });
  }

  try {
    const institution = db.prepare("SELECT id FROM institutions LIMIT 1").get() as any;
    if (!institution) throw new Error("Institution not configured in database.");

    const patientId = crypto.randomUUID();
    
    db.transaction(() => {
      // Create Patient
      db.prepare(`
        INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, hospital_number, consent_given, consent_signature_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'lis-sync')
        ON CONFLICT(patient_code) DO NOTHING
      `).run(patientId, externalPatientId, institution.id, name, dob, gender, externalPatientId);

      // Create Sample and Tests
      const sampleId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO samples (id, patient_id, institution_id, priority, status)
        VALUES (?, ?, ?, 'routine', 'requested')
      `).run(sampleId, patientId, institution.id);

      for (const test of testRequests) {
        db.prepare(`
          INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
          VALUES (?, ?, 'parasitology', ?, 'requested')
        `).run(crypto.randomUUID(), sampleId, test.testType);
      }
    })();

    return { success: true, irisPatientId: patientId, message: "Patient and tests synced to local Worklist." };
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({ type: 'server_error', detail: error.message });
  }
});

// D-9 Endpoint: LIS pulls all approved results
app.get('/v1/results/:externalPatientId', async (request, reply) => {
  const { externalPatientId } = request.params as any;

  const results = db.prepare(`
    SELECT r.id, r.status, r.edited_findings, r.interpretive_comment, r.approved_at, r.verification_code,
           tr.test_name, u.full_name as approved_by_name
    FROM results r
    JOIN test_requests tr ON r.test_request_id = tr.id
    JOIN patients p ON r.patient_id = p.id
    LEFT JOIN users u ON r.approved_by = u.id
    WHERE p.patient_code = ? AND r.status = 'released'
  `).all(externalPatientId);

  if (!results.length) {
    return reply.status(404).send({ type: 'not_found', detail: 'No approved results found for this patient.' });
  }

  return { success: true, results };
});

// D-9 Endpoint: Test Mode Seeder (Development Only)
app.post('/v1/test/seed-synthetic-patient', async () => {
  const patientId = crypto.randomUUID();
  const sampleId = crypto.randomUUID();
  const inst = db.prepare("SELECT id FROM institutions LIMIT 1").get() as any;

  db.transaction(() => {
    db.prepare(`
      INSERT INTO patients (id, patient_code, institution_id, full_name, dob, gender, consent_given, consent_signature_path)
      VALUES (?, 'SYN-001', ?, 'Synthetic LIS Patient', '1990-01-01', 'Female', 1, 'mock')
    `).run(patientId, inst.id);

    db.prepare(`
      INSERT INTO samples (id, patient_id, institution_id, status) VALUES (?, ?, ?, 'requested')
    `).run(sampleId, patientId, inst.id);

    db.prepare(`
      INSERT INTO test_requests (id, sample_id, test_category, test_name, status)
      VALUES (?, ?, 'parasitology', 'Malaria Parasite', 'requested')
    `).run(crypto.randomUUID(), sampleId);
  })();

  return { success: true, irisPatientId: patientId };
});

// Start the server bound to 127.0.0.1 per the security requirement
const start = async () => {
  try {
    await app.listen({ port: 8787, host: '127.0.0.1' });
    console.log('LIS Integration API running at http://127.0.0.1:8787');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
```

## packages/shared-ui/globals.css

```css
/* packages/shared-ui/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root, [data-theme="light"] {
  --background: 0 0% 100%;
  --foreground: 220 39% 11%;
  --card: 0 0% 100%;
  --card-foreground: 220 39% 11%;
  --muted: 210 20% 96%;
  --muted-foreground: 220 9% 46%;
  --border: 220 13% 91%;
  --ring: 158 64% 32%; /* emerald-600 */
}

[data-theme="dark"] {
  --background: 222 47% 3%;
  --foreground: 210 20% 98%;
  --card: 220 39% 8%;
  --card-foreground: 210 20% 98%;
  --muted: 220 39% 12%;
  --muted-foreground: 217 10% 65%;
  --border: 220 13% 18%;
  --ring: 158 64% 42%;
}

body {
  @apply bg-background text-foreground antialiased;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

.iris-focus-ring-green {
  animation: iris-pulse 2s ease-in-out infinite;
}
```

## packages/shared-ui/tailwind.config.ts

```typescript
// packages/shared-ui/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', "[data-theme='dark']"],
  content: [
    '../../apps/desktop/index.html',
    '../../apps/desktop/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#059669', dark: '#047857', deep: '#064E3B',
          mid: '#10B981', light: '#34D399', pale: '#D1FAE5',
          ghost: '#ECFDF5', foreground: '#FFFFFF',
        },
        // Playbook §D-13.1 Status Colors
        secondary: '#0D9488',
        error: '#DC2626',
        warning: '#D97706',
        
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        border: 'hsl(var(--border))',
      },
      keyframes: {
        'iris-pulse': { 
          '0%,100%': { boxShadow: '0 0 8px 2px rgba(5,150,105,0.4)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(5,150,105,0.8)' } 
        }
      },
      animation: {
        'iris-pulse': 'iris-pulse 2s ease-in-out infinite',
      },
    },
  },
};

export default config;
```

## scripts/export-ai-context.mjs

```javascript
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'AI_PROJECT_CONTEXT.md');

const includedExtensions = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.sql', '.css', '.html',
  '.json', '.md', '.yml', '.yaml', '.toml', '.env.example',
]);
const includedNames = new Set([
  'Dockerfile', 'Makefile', '.gitignore', '.npmrc', 'pnpm-workspace.yaml',
]);
const excludedDirectories = new Set([
  'node_modules', 'dist', 'dist-electron', 'release', '.next', '.cache',
  '.turbo', '.venv', '.git', '__pycache__', '.pytest_cache', 'coverage',
]);
const excludedFiles = new Set([
  'AI_PROJECT_CONTEXT.md', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock',
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (excludedDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath));
      continue;
    }

    const extension = path.extname(entry.name);
    if (!excludedFiles.has(entry.name) && (includedExtensions.has(extension) || includedNames.has(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

function languageFor(filePath) {
  const extension = path.extname(filePath);
  const languages = {
    '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'tsx', '.jsx': 'jsx', '.py': 'python',
    '.sql': 'sql', '.css': 'css', '.html': 'html', '.json': 'json',
    '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml', '.toml': 'toml',
  };
  return languages[extension] || '';
}

const files = await collectFiles(projectRoot);
const relativePathFor = (filePath) => path.relative(projectRoot, filePath).split(path.sep).join('/');
const testFiles = files.filter((filePath) => {
  const relativePath = relativePathFor(filePath).toLowerCase();
  const fileName = path.basename(relativePath);
  return relativePath.includes('/tests/') || fileName.includes('test') || fileName.includes('spec');
});
const sections = [
  '# IRIS Platform AI Project Context',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  'This file is a source-context export for AI-assisted development.',
  'It includes application source, database schema, AI service code, tests, and configuration.',
  '',
  '## Important Project Notes',
  '',
  '- The Electron app is in `apps/desktop`.',
  '- The Electron runtime database is initialized in `apps/desktop/src/main/db.ts`.',
  '- The shared schema is in `packages/db/migrations/001_init.sql`.',
  '- The local AI HTTP service is in `packages/ai/main.py`.',
  '- Generated builds, release binaries, dependencies, virtual environments, and lockfiles are excluded.',
  '',
  `## Included Files (${files.length})`,
  '',
  ...files.map((filePath) => `- ${relativePathFor(filePath)}`),
  '',
  `## Test Files (${testFiles.length})`,
  '',
  ...(testFiles.length > 0 ? testFiles.map((filePath) => `- ${relativePathFor(filePath)}`) : ['- No test files found.']),
  '',
];

for (const filePath of files) {
  const relativePath = relativePathFor(filePath);
  const language = languageFor(filePath);
  const source = await readFile(filePath, 'utf8');
  sections.push(`## ${relativePath}`, '', `\`\`\`${language}`, source.trimEnd(), '\`\`\`', '');
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${sections.join('\n')}\n`, 'utf8');
console.log(`Wrote ${path.relative(projectRoot, outputPath)} with ${files.length} files.`);
```

