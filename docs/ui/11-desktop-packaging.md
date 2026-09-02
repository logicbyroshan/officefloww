# 11 - Desktop Packaging & Installer Generation Guide

## Overview
OfficeFloww Desktop is packaged into production binaries using `electron-builder` and `esbuild`. The packaging pipeline bundles all React components, single-accent design system tokens, secure preload bridge, and Electron runtime into signed Windows NSIS installers and portable executables.

---

## Packaging Architecture & Directory Output
```
apps/desktop/
├── main.js                      # Electron main entry point
├── preload.js                   # Secure contextBridge isolation
├── index.html                   # HTML container
├── dist/
│   ├── bundle.js                # React/TypeScript bundled application
│   └── bundle.js.map            # Source maps
├── release/                     # Production installer artifacts (generated)
│   ├── OfficeFloww Setup 1.0.0.exe        # Full NSIS installer with custom directory picker
│   ├── OfficeFloww 1.0.0.exe              # Standalone portable binary
│   └── win-unpacked/                      # Extracted portable application bundle
└── package.json                 # electron-builder configuration block
```

---

## Build & Packaging Commands

### 1. Development Mode
Run the live bundler watcher and launch Electron connected to the local FastAPI backend (`http://127.0.0.1:8000`):
```bash
cd apps/desktop

# In terminal 1 (Bundler watch mode):
npm run watch

# In terminal 2 (Electron runtime):
npm start
```

### 2. Typecheck & Verification
Validate all TypeScript interfaces against `@officefloww/api-types`:
```bash
npm run typecheck
```

### 3. Production Compilation (`esbuild`)
Compile all JSX and TypeScript into optimized static browser bundles:
```bash
npm run build
```

### 4. Generate Unpacked Application Folder (`--dir`)
Quickly packages the application into `release/win-unpacked` without creating the installer archive (useful for rapid binary testing):
```bash
npm run package
```

### 5. Generate Final Windows Installer (`NSIS`)
Generates the complete, standalone Windows setup executable with desktop shortcut and start menu integration:
```bash
npm run dist
```
Output artifact: `apps/desktop/release/OfficeFloww Setup 1.0.0.exe`.

---

## Production Security Checklist
- [x] `contextIsolation: true` enforced on all browser windows.
- [x] `nodeIntegration: false` enforced to prevent remote code execution in renderer.
- [x] Local storage stores only JWT session tokens with automatic header injection.
- [x] Content Security Policy blocks arbitrary third-party scripts.
- [x] Electron sandboxing active with zero access to Node.js internals from the DOM.
