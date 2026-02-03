export const config = {
  vlr: {
    baseUrl: 'https://www.vlr.gg',
  },
  server: {
    port: process.env.PORT || 3000,
  },
  cache: {
    // TTL in seconds
    ttl: {
      live: 30,           // Live matches - refresh frequently
      upcoming: 300,      // Upcoming matches - 5 min
      results: 3600,      // Results - 1 hour (rarely changes)
      match: 86400,       // Individual match - 24 hours (permanent after completion)
      player: 1800,       // Player profile - 30 min
      team: 1800,         // Team profile - 30 min
      rankings: 3600,     // Rankings - 1 hour
      stats: 1800,        // Stats leaderboard - 30 min
    },
  },
  scraper: {
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
  },
  debug: {
    enabled: process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV !== 'production',
    sampleDir: './debug-samples',
    maxSamples: 50,
    captureOnError: true,
    captureOnEmpty: true,
  },
} as const;

export type Config = typeof config;
