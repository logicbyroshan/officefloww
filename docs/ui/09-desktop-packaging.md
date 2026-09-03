# 09 — Desktop Packaging & Electron Runtime

## 1. Electron Runtime Configuration

The desktop application entry point is `apps/desktop/main.js`:
- `nodeIntegration: false`, `contextIsolation: true` for enterprise Chromium security.
- Custom title bar with native frame options.
- Window icon loaded from `assets/logo.png`.
- Persistent minimum dimensions: 1200px × 800px.

---

## 2. Fast Build Pipeline

```bash
# In apps/desktop
npm run build   # Compiles src/index.tsx -> dist/bundle.js in ~70ms
npm start       # Launches Electron desktop runtime
npm run watch   # Incremental watcher for hot development updates
```

The esbuild bundler produces a lean, highly optimized single bundle (`dist/bundle.js`, ~1.5MB) with source maps enabled for developer troubleshooting.
