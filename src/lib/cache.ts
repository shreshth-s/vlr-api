import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

type CacheType = keyof typeof config.cache.ttl;

class Cache {
  private redis: RedisClientType | null = null;
  private memory: Map<string, { data: string; expires: number }> = new Map();
  private useMemory = false;

  async connect(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.log('No REDIS_URL found, using in-memory cache');
      this.useMemory = true;
      return;
    }

    try {
      this.redis = createClient({ url: redisUrl });
      this.redis.on('error', (err) => {
        console.error('Redis error:', err);
        this.useMemory = true;
      });
      await this.redis.connect();
      console.log('Connected to Redis');
    } catch (error) {
      console.log('Failed to connect to Redis, using in-memory cache');
      this.useMemory = true;
    }
  }

  async get<T>(key: string): Promise<{ data: T; cached: boolean } | null> {
    try {
      let data: string | null = null;

      if (this.useMemory) {
        const entry = this.memory.get(key);
        if (entry && entry.expires > Date.now()) {
          data = entry.data;
        } else if (entry) {
          this.memory.delete(key);
        }
      } else if (this.redis) {
        data = await this.redis.get(key);
      }

      if (data) {
        return { data: JSON.parse(data) as T, cached: true };
      }
      return null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T, type: CacheType): Promise<void> {
    try {
      const ttl = config.cache.ttl[type];
      const serialized = JSON.stringify(data);

      if (this.useMemory) {
        this.memory.set(key, {
          data: serialized,
          expires: Date.now() + ttl * 1000,
        });
        // Clean up old entries periodically
        if (this.memory.size > 1000) {
          this.cleanup();
        }
      } else if (this.redis) {
        await this.redis.setEx(key, ttl, serialized);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      if (this.useMemory) {
        for (const key of this.memory.keys()) {
          if (key.includes(pattern)) {
            this.memory.delete(key);
          }
        }
      } else if (this.redis) {
        const keys = await this.redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory.entries()) {
      if (entry.expires < now) {
        this.memory.delete(key);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

export const cache = new Cache();

// Helper to create cache keys
export function cacheKey(type: string, ...parts: (string | number | undefined)[]): string {
  return `vlr:${type}:${parts.filter(Boolean).join(':')}`;
}
