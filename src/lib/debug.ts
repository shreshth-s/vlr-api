import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import {
  HtmlSample,
  HtmlSampleMetadata,
  SampleIndex,
  CaptureType,
} from '../types/debug.js';

const INDEX_FILE = 'index.json';

function getSampleDir(): string {
  return path.resolve(config.debug.sampleDir);
}

function getIndexPath(): string {
  return path.join(getSampleDir(), INDEX_FILE);
}

function getSamplePath(id: string): string {
  return path.join(getSampleDir(), `${id}.html`);
}

function ensureDirectoryExists(): void {
  const dir = getSampleDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadIndex(): SampleIndex {
  const indexPath = getIndexPath();
  if (!fs.existsSync(indexPath)) {
    return { samples: [], lastUpdated: new Date().toISOString() };
  }
  try {
    const data = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { samples: [], lastUpdated: new Date().toISOString() };
  }
}

function saveIndex(index: SampleIndex): void {
  ensureDirectoryExists();
  const indexPath = getIndexPath();
  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

function generateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

export function saveSample(
  type: CaptureType,
  url: string,
  html: string,
  error?: string,
  context?: Record<string, unknown>
): HtmlSample {
  if (!config.debug.enabled) {
    throw new Error('Debug mode is disabled');
  }

  ensureDirectoryExists();

  const id = generateId();
  const timestamp = new Date().toISOString();
  const samplePath = getSamplePath(id);

  // Save HTML file
  fs.writeFileSync(samplePath, html, 'utf-8');
  const fileSize = Buffer.byteLength(html, 'utf-8');

  // Update index
  const index = loadIndex();
  const metadata: HtmlSampleMetadata = {
    id,
    type,
    url,
    timestamp,
    error,
    fileSize,
  };
  index.samples.unshift(metadata);
  saveIndex(index);

  // Auto-cleanup if over limit
  if (index.samples.length > config.debug.maxSamples) {
    cleanupOldSamples(config.debug.maxSamples);
  }

  return {
    id,
    type,
    url,
    timestamp,
    error,
    context,
    fileSize,
  };
}

export function getSamples(type?: CaptureType): HtmlSampleMetadata[] {
  const index = loadIndex();
  if (type) {
    return index.samples.filter(s => s.type === type);
  }
  return index.samples;
}

export function getSample(id: string): HtmlSample | null {
  const index = loadIndex();
  const metadata = index.samples.find(s => s.id === id);
  if (!metadata) {
    return null;
  }

  const samplePath = getSamplePath(id);
  if (!fs.existsSync(samplePath)) {
    return null;
  }

  const html = fs.readFileSync(samplePath, 'utf-8');

  return {
    ...metadata,
    html,
  };
}

export function deleteSample(id: string): boolean {
  const index = loadIndex();
  const sampleIndex = index.samples.findIndex(s => s.id === id);
  if (sampleIndex === -1) {
    return false;
  }

  // Remove from index
  index.samples.splice(sampleIndex, 1);
  saveIndex(index);

  // Delete file
  const samplePath = getSamplePath(id);
  if (fs.existsSync(samplePath)) {
    fs.unlinkSync(samplePath);
  }

  return true;
}

export function cleanupOldSamples(keepCount: number): number {
  const index = loadIndex();
  const toDelete = index.samples.slice(keepCount);

  let deletedCount = 0;
  for (const sample of toDelete) {
    const samplePath = getSamplePath(sample.id);
    if (fs.existsSync(samplePath)) {
      fs.unlinkSync(samplePath);
      deletedCount++;
    }
  }

  index.samples = index.samples.slice(0, keepCount);
  saveIndex(index);

  return deletedCount;
}

export function initializeDebugDirectory(): void {
  if (config.debug.enabled) {
    ensureDirectoryExists();
    console.log(`Debug sample directory: ${getSampleDir()}`);
  }
}
