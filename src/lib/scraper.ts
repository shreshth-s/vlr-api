import axios, { AxiosInstance, AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { config } from '../config/index.js';
import { saveSample } from './debug.js';
import { CaptureType, HtmlSample } from '../types/debug.js';

export type CheerioAPI = cheerio.CheerioAPI;
export type CheerioElement = Element;

export interface FetchWithHtmlResult {
  $: CheerioAPI;
  html: string;
  url: string;
}

class Scraper {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.vlr.baseUrl,
      timeout: config.scraper.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    });
  }

  async fetch(path: string, retries: number = config.scraper.retries): Promise<CheerioAPI> {
    try {
      const url = path.startsWith('http') ? path : path;
      const response = await this.client.get(url);
      return cheerio.load(response.data);
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        await this.delay(config.scraper.retryDelay);
        return this.fetch(path, retries - 1);
      }
      throw this.formatError(error);
    }
  }

  async fetchWithHtml(path: string, retries: number = config.scraper.retries): Promise<FetchWithHtmlResult> {
    try {
      const url = path.startsWith('http') ? path : path;
      const response = await this.client.get(url);
      const html = response.data as string;
      return {
        $: cheerio.load(html),
        html,
        url: `${config.vlr.baseUrl}${path}`,
      };
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        await this.delay(config.scraper.retryDelay);
        return this.fetchWithHtml(path, retries - 1);
      }
      throw this.formatError(error);
    }
  }

  async captureSample(
    type: CaptureType,
    path: string,
    context?: Record<string, unknown>
  ): Promise<HtmlSample> {
    if (!config.debug.enabled) {
      throw new Error('Debug mode is disabled');
    }

    const { html, url } = await this.fetchWithHtml(path);
    return saveSample(type, url, html, undefined, context);
  }

  async captureOnError(
    type: CaptureType,
    path: string,
    html: string,
    error: string,
    context?: Record<string, unknown>
  ): Promise<HtmlSample | null> {
    if (!config.debug.enabled || !config.debug.captureOnError) {
      return null;
    }

    try {
      const url = `${config.vlr.baseUrl}${path}`;
      return saveSample(type, url, html, error, context);
    } catch {
      return null;
    }
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // Retry on timeout, 5xx errors, or network errors
      return !status || status >= 500 || error.code === 'ECONNABORTED';
    }
    return false;
  }

  private formatError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      if (status === 404) {
        return new Error('Resource not found');
      }
      if (status === 403) {
        return new Error('Access forbidden - possible rate limiting');
      }
      return new Error(`Request failed: ${error.message}`);
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const scraper = new Scraper();

// Helper functions for common parsing tasks
export function parseText($el: cheerio.Cheerio<CheerioElement>): string {
  return $el.text().trim();
}

export function parseNumber(text: string): number {
  const cleaned = text.replace(/[,%]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseId(url: string | undefined, pattern: RegExp): string | undefined {
  if (!url) return undefined;
  const match = url.match(pattern);
  return match ? match[1] : undefined;
}

export function parseImageUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('//')) {
    return `https:${src}`;
  }
  if (src.startsWith('/')) {
    return `${config.vlr.baseUrl}${src}`;
  }
  return src;
}

export function parseCountryCode(classes: string | undefined): string | undefined {
  if (!classes) return undefined;
  const match = classes.match(/mod-(\w{2})/);
  return match ? match[1] : undefined;
}

export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
