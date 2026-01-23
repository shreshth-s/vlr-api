import { Router, Request, Response } from 'express';
import {
  getPlayerProfile,
  getPlayerMatches,
  getPlayerAgentStats,
  getStatsLeaderboard,
  searchPlayers,
} from '../scrapers/players.js';
import { getMatchDetails } from '../scrapers/matches.js';
import { cache, cacheKey } from '../lib/cache.js';
import { analyzePlayerRole, PlayerRoleAnalysis } from '../lib/roles.js';
import { ApiResponse, PlayerProfile, LeaderboardEntry, StatsFilter, PlayerMatchStats } from '../types/index.js';

const router = Router();

// GET /players - Search players
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
        code: 400,
      });
    }

    const data = await searchPlayers(q);
    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /players/stats - Get stats leaderboard
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const filters: StatsFilter = {
      eventId: req.query.event_id as string,
      eventSeries: req.query.event_series as string,
      region: req.query.region as string,
      country: req.query.country as string,
      minRounds: req.query.min_rounds ? parseInt(req.query.min_rounds as string) : undefined,
      minRating: req.query.min_rating ? parseFloat(req.query.min_rating as string) : undefined,
      agent: req.query.agent as string,
      map: req.query.map as string,
      timespan: req.query.timespan as '30' | '60' | '90' | 'all',
    };

    // Create cache key from filters
    const filterKey = Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}:${v}`)
      .join('_') || 'default';

    const key = cacheKey('stats', 'leaderboard', filterKey);
    const cached = await cache.get<LeaderboardEntry[]>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getStatsLeaderboard(filters);
    await cache.set(key, data, 'stats');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /players/:id - Get player profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const key = cacheKey('player', id);
    const cached = await cache.get<PlayerProfile>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getPlayerProfile(id);
    await cache.set(key, data, 'player');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /players/:id/matches - Get player match history
router.get('/:id/matches', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;

    const key = cacheKey('player', id, 'matches', page);
    const cached = await cache.get<{ matches: any[]; hasMore: boolean }>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getPlayerMatches(id, page);
    await cache.set(key, data, 'player');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /players/:id/agents - Get player agent stats
router.get('/:id/agents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timespan = (req.query.timespan as '30' | '60' | '90' | 'all') || 'all';

    const key = cacheKey('player', id, 'agents', timespan);
    const cached = await cache.get<any[]>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getPlayerAgentStats(id, timespan);
    await cache.set(key, data, 'player');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// Note: Clutch stats are available in the /players/stats leaderboard endpoint
// Individual match details don't include per-map clutch data on VLR

// GET /players/:id/role - Analyze player's role based on recent matches
router.get('/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const key = cacheKey('player', id, 'role', limit);
    const cached = await cache.get<PlayerRoleAnalysis>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    // Get player's recent matches
    const { matches } = await getPlayerMatches(id, 1);
    const recentMatches = matches.slice(0, limit);

    // Fetch detailed stats for each match
    const allStats: PlayerMatchStats[] = [];

    for (const match of recentMatches) {
      try {
        const details = await getMatchDetails(match.matchId);
        // Find this player's stats across all maps
        for (const map of details.maps) {
          const playerStats = [...map.team1Players, ...map.team2Players];
          // Note: We'd need player ID matching here - for now add all
          allStats.push(...playerStats);
        }
      } catch {
        // Skip matches that fail to fetch
      }
    }

    // Analyze role
    const roleAnalysis = analyzePlayerRole(allStats);
    await cache.set(key, roleAnalysis, 'player');

    res.json(response(roleAnalysis));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

function response<T>(data: T, cached = false): ApiResponse<T> {
  return {
    success: true,
    data,
    cached,
    timestamp: new Date().toISOString(),
  };
}

function errorResponse(error: unknown) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    code: 500,
  };
}

export default router;
