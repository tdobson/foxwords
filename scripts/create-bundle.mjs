import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const outDir = path.join(rootDir, 'out');
const distDir = path.join(rootDir, 'dist');
const bundleTempDir = path.join(distDir, 'bundle-temp');
const zipFile = path.join(distDir, 'letter-trail-offline.zip');

// 1. Check if `out/` directory exists
if (!fs.existsSync(outDir) || !fs.statSync(outDir).isDirectory()) {
  console.error(`\x1b[31mError: Build output directory "${outDir}" not found.\x1b[0m`);
  console.error('Please run "npm run build" before creating the bundle.');
  process.exit(1);
}

// 2. Prepare clean staging directory in `dist/bundle-temp`
if (fs.existsSync(bundleTempDir)) {
  fs.rmSync(bundleTempDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(bundleTempDir, 'game'), { recursive: true });

// 3. Copy all files from `out/` into `dist/bundle-temp/game/`
console.log('Copying static build files from out/ to dist/bundle-temp/game/...');
fs.cpSync(outDir, path.join(bundleTempDir, 'game'), { recursive: true });

// 4. Create `start.sh` (macOS / Linux launcher)
const startShContent = `#!/usr/bin/env bash
set -e

PORT=8000
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "\$SCRIPT_DIR"

open_browser() {
  sleep 1
  URL="http://localhost:\$PORT"
  if command -v open >/dev/null 2>&1; then
    open "\$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "\$URL"
  else
    echo "Please open \$URL in your web browser."
  fi
}

echo "Starting Letter Trail Offline..."

open_browser &

if command -v python3 >/dev/null 2>&1; then
  echo "Serving with Python 3 at http://localhost:\$PORT"
  exec python3 -m http.server "\$PORT" --directory game
elif command -v python >/dev/null 2>&1; then
  echo "Serving with Python at http://localhost:\$PORT"
  # Try python -m http.server (Python 3) or fallback to SimpleHTTPServer (Python 2)
  if python -c 'import http.server' >/dev/null 2>&1; then
    exec python -m http.server "\$PORT" --directory game
  else
    cd game && exec python -m SimpleHTTPServer "\$PORT"
  fi
elif command -v npx >/dev/null 2>&1; then
  echo "Serving with npx serve at http://localhost:\$PORT"
  exec npx serve game -p "\$PORT"
else
  echo "Error: Neither python3, python, nor npx was found on your system."
  echo "Please install Python 3 or Node.js to run this launcher, or use any static file web server pointing to the 'game' folder."
  read -p "Press Enter to exit..."
  exit 1
fi
`;

const startShPath = path.join(bundleTempDir, 'start.sh');
fs.writeFileSync(startShPath, startShContent, { encoding: 'utf8', mode: 0o755 });

// 5. Create `start.bat` (Windows launcher)
const startBatContent = `@echo off
setlocal
cd /d "%~dp0"

set PORT=8000
set URL=http://localhost:%PORT%

echo Starting Letter Trail Offline...

start "" "%URL%"

where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Serving with Python 3 at %URL%
    python3 -m http.server %PORT% --directory game
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Serving with Python at %URL%
    python -m http.server %PORT% --directory game
    goto end
)

where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Serving with npx serve at %URL%
    npx serve game -p %PORT%
    goto end
)

echo Error: Neither python3, python, nor npx was found on your system.
echo Please install Python 3 or Node.js to run this launcher, or use any static file web server pointing to the 'game' folder.
pause

:end
`;

const startBatPath = path.join(bundleTempDir, 'start.bat');
fs.writeFileSync(startBatPath, startBatContent, { encoding: 'utf8' });

// 6. Create `README.txt`
const readmeContent = `=========================================
 Letter Trail - Offline Bundle
=========================================

Thank you for downloading Letter Trail!

HOW TO RUN:
-----------
Option 1: Quick Launch
- On macOS / Linux: Double-click or run "./start.sh" in terminal.
- On Windows: Double-click "start.bat".

Option 2: Run Your Own Local Web Server
Because modern browsers restrict local audio playback and module loading
over the "file://" protocol, the game must be served over HTTP.

You can use any local web server pointing to the "game" directory:
- Python 3:  python3 -m http.server 8000 --directory game
- Node.js:   npx serve game -p 8000
- PHP:       php -S localhost:8000 -t game
- Caddy:     caddy file-server --listen :8000 --root game

Then open your browser to:
  http://localhost:8000

Enjoy playing!
`;

const readmePath = path.join(bundleTempDir, 'README.txt');
fs.writeFileSync(readmePath, readmeContent, { encoding: 'utf8' });

// 7. Create `dist/letter-trail-offline.zip`
console.log('Creating zip archive...');
if (fs.existsSync(zipFile)) {
  fs.rmSync(zipFile, { force: true });
}

try {
  // Zip the contents of bundleTempDir into zipFile
  // -r: recursive, -q: quiet
  execSync(`zip -r -q "${zipFile}" game start.sh start.bat README.txt`, {
    cwd: bundleTempDir,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('Failed to create zip archive with zip CLI:', err);
  process.exit(1);
}

// 8. Clean up temporary staging files
fs.rmSync(bundleTempDir, { recursive: true, force: true });

// 9. Log success message and output file size
const stats = fs.statSync(zipFile);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`\x1b[32mSuccessfully created bundle: ${zipFile} (${sizeMB} MB)\x1b[0m`);
