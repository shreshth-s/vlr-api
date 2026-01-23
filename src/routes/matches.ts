import { Router, Request, Response } from 'express';
import { getMatches, getMatchDetails } from '../scrapers/matches.js';
import { cache, cacheKey } from '../lib/cache.js';
import { ApiResponse, MatchSummary, MatchDetails } from '../types/index.js';

const router = Router();

// GET /matches/live - Get live matches
router.get('/live', async (req: Request, res: Response) => {
  try {
    const key = cacheKey('matches', 'live');
    const cached = await cache.get<MatchSummary[]>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getMatches('live');
    await cache.set(key, data, 'live');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /matches/upcoming - Get upcoming matches
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const key = cacheKey('matches', 'upcoming');
    const cached = await cache.get<MatchSummary[]>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getMatches('upcoming');
    await cache.set(key, data, 'upcoming');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /matches/results - Get completed matches
router.get('/results', async (req: Request, res: Response) => {
  try {
    const key = cacheKey('matches', 'results');
    const cached = await cache.get<MatchSummary[]>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getMatches('results');
    await cache.set(key, data, 'results');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /matches/:id - Get match details with player stats
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const key = cacheKey('match', id);
    const cached = await cache.get<MatchDetails>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getMatchDetails(id);
    await cache.set(key, data, 'match');

    res.json(response(data));
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
