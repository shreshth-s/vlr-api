import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { cache } from './lib/cache.js';
import routes from './routes/index.js';
import { initializeDebugDirectory } from './lib/debug.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 429,
  },
});
app.use(limiter);

// Body parsing
app.use(express.json());

// API info endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'VLR.gg API',
    version: '1.0.0',
    description: 'Comprehensive Valorant esports API',
    endpoints: {
      matches: {
        'GET /api/matches/live': 'Get live matches',
        'GET /api/matches/upcoming': 'Get upcoming matches',
        'GET /api/matches/results': 'Get completed matches',
        'GET /api/matches/:id': 'Get match details with player stats per map',
      },
      players: {
        'GET /api/players?q=:query': 'Search players',
        'GET /api/players/stats': 'Get stats leaderboard (filterable)',
        'GET /api/players/:id': 'Get player profile',
        'GET /api/players/:id/matches': 'Get player match history',
        'GET /api/players/:id/agents': 'Get player agent stats',
      },
      teams: {
        'GET /api/teams?q=:query': 'Search teams',
        'GET /api/teams/rankings': 'Get global team rankings',
        'GET /api/teams/rankings/:region': 'Get regional team rankings',
        'GET /api/teams/regions': 'Get available regions',
        'GET /api/teams/:id': 'Get team profile with roster',
        'GET /api/teams/:id/matches': 'Get team match history',
      },
      events: {
        'GET /api/events?status=:status': 'Get events (ongoing/upcoming/completed)',
        'GET /api/events/search?q=:query': 'Search events',
        'GET /api/events/:id': 'Get event details',
      },
      debug: {
        'GET /api/debug/capture/:type': 'Manually capture HTML sample (dev only)',
        'GET /api/debug/samples': 'List saved HTML samples (dev only)',
        'GET /api/debug/samples/:id': 'Get specific sample with HTML (dev only)',
        'DELETE /api/debug/samples/:id': 'Delete a sample (dev only)',
        'POST /api/debug/cleanup': 'Clean up old samples (dev only)',
        'GET /api/debug/types': 'List available capture types (dev only)',
      },
    },
    filters: {
      '/api/players/stats': {
        event_id: 'Filter by event ID',
        event_series: 'Filter by event series',
        region: 'Filter by region',
        country: 'Filter by country',
        min_rounds: 'Minimum rounds played',
        min_rating: 'Minimum rating',
        agent: 'Filter by agent',
        map: 'Filter by map',
        timespan: '30, 60, 90, or all',
      },
    },
    github: 'https://github.com/yourusername/vlr-api',
    disclaimer: 'This is an unofficial API. Not affiliated with vlr.gg.',
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 404,
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: 500,
  });
});

// Start server
async function start() {
  try {
    // Initialize cache
    await cache.connect();

    // Initialize debug directory
    initializeDebugDirectory();

    const port = config.server.port;
    const debugStatus = config.debug.enabled ? 'ENABLED' : 'DISABLED';
    app.listen(port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                    VLR.gg API                         ║
║                                                       ║
║  Server running on http://localhost:${port}             ║
║  Debug mode: ${debugStatus.padEnd(42)}║
║                                                       ║
║  Endpoints:                                           ║
║    GET /api/matches/live     - Live matches           ║
║    GET /api/matches/upcoming - Upcoming matches       ║
║    GET /api/matches/results  - Completed matches      ║
║    GET /api/matches/:id      - Match details          ║
║    GET /api/players/stats    - Stats leaderboard      ║
║    GET /api/players/:id      - Player profile         ║
║    GET /api/teams/rankings   - Team rankings          ║
║    GET /api/teams/:id        - Team profile           ║
║    GET /api/events           - Events list            ║
║    GET /api/debug/*          - Debug endpoints        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
