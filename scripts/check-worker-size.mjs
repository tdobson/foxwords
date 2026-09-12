#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const WORKER_SCRIPT = path.resolve(process.cwd(), '.open-next/worker.js');
const ASSETS_DIR = path.resolve(process.cwd(), '.open-next/assets');

// Cloudflare free limit is 3,145,728 bytes (3 MiB). Conservative Foxwords budget is 2,500,000 bytes.
const MAX_COMPRESSED_WORKER_BYTES = 2_500_000;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let totalSize = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      totalSize += getDirectorySize(fullPath);
    } else if (entry.isFile()) {
      totalSize += fs.statSync(fullPath).size;
    }
  }
  return totalSize;
}

function checkWorkerSize() {
  if (!fs.existsSync(WORKER_SCRIPT)) {
    console.error(`Worker script not found at ${WORKER_SCRIPT}. Run yarn build first.`);
    process.exit(1);
  }

  const rawBuffer = fs.readFileSync(WORKER_SCRIPT);
  const rawSize = rawBuffer.length;
  const gzipBuffer = zlib.gzipSync(rawBuffer);
  const gzipSize = gzipBuffer.length;

  const assetsSize = getDirectorySize(ASSETS_DIR);

  console.log('--------------------------------------------------');
  console.log('Foxwords Cloudflare Worker Bundle Size Analysis');
  console.log('--------------------------------------------------');
  console.log(
    `Worker Raw Script (.open-next/worker.js):  ${formatBytes(rawSize)} (${rawSize} bytes)`
  );
  console.log(
    `Worker Gzip Script (counted by Cloudflare): ${formatBytes(gzipSize)} (${gzipSize} bytes)`
  );
  console.log(
    `Worker Script Budget Ceiling:               ${formatBytes(MAX_COMPRESSED_WORKER_BYTES)} (${MAX_COMPRESSED_WORKER_BYTES} bytes)`
  );
  console.log(
    `Static Assets (.open-next/assets, Workers Assets): ${formatBytes(assetsSize)} (${assetsSize} bytes)`
  );
  console.log(
    'Note: Static assets and R2 media are uploaded separately and DO NOT count towards the script limit.'
  );
  console.log('--------------------------------------------------');

  if (gzipSize > MAX_COMPRESSED_WORKER_BYTES) {
    console.error(
      `FAILED: Worker gzip size (${gzipSize} bytes) exceeds budget of ${MAX_COMPRESSED_WORKER_BYTES} bytes!`
    );
    process.exit(1);
  }

  const headroom = MAX_COMPRESSED_WORKER_BYTES - gzipSize;
  console.log(
    `SUCCESS: Worker size is within budget! Remaining headroom: ${formatBytes(headroom)} (${headroom} bytes)`
  );
}

checkWorkerSize();
