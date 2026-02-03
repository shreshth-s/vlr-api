import { Router, Request, Response } from 'express';
import {
  getTeamRankings,
  getTeamProfile,
  getTeamMatches,
  searchTeams,
  REGIONS,
  Region,
} from '../scrapers/teams.js';
import { cache, cacheKey } from '../lib/cache.js';
import { ApiResponse, Team, TeamProfile } from '../types/index.js';
import { T1_TEAMS, getT1Teams, TierStatus, VCTRegion } from '../data/tiers.js';

const router = Router();

// GET /teams - Search teams
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

    const data = await searchTeams(q);
    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /teams/rankings - Get team rankings (global)
router.get('/rankings', async (req: Request, res: Response) => {
  try {
    const key = cacheKey('teams', 'rankings', 'all');
    const cached = await cache.get<Team[]>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getTeamRankings('all');
    await cache.set(key, data, 'rankings');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /teams/rankings/:region - Get team rankings by region
router.get('/rankings/:region', async (req: Request, res: Response) => {
  try {
    const { region } = req.params;

    // Validate region
    if (!REGIONS.includes(region as Region)) {
      return res.status(400).json({
        success: false,
        error: `Invalid region. Valid regions: ${REGIONS.join(', ')}`,
        code: 400,
      });
    }

    const key = cacheKey('teams', 'rankings', region);
    const cached = await cache.get<Team[]>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getTeamRankings(region as Region);
    await cache.set(key, data, 'rankings');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /teams/regions - Get available regions
router.get('/regions', (_req: Request, res: Response) => {
  res.json(response({
    regions: REGIONS,
    descriptions: {
      na: 'North America',
      eu: 'Europe',
      ap: 'Asia Pacific',
      la: 'Latin America',
      'la-s': 'Latin America South',
      'la-n': 'Latin America North',
      oce: 'Oceania',
      kr: 'Korea',
      mn: 'MENA',
      gc: 'Game Changers',
      br: 'Brazil',
      cn: 'China',
      jp: 'Japan',
    },
  }));
});

// GET /teams/tiers - Get tier info
router.get('/tiers', (_req: Request, res: Response) => {
  res.json(response({
    description: 'VCT 2026 Tier Classification',
    tiers: {
      t1: 'VCT International League (partners + ascended)',
      t2: 'All other teams (Challengers, T3, etc.)',
    },
    statuses: {
      partner: 'Franchised partner teams (10 per region)',
      ascended: 'Teams promoted through Ascension (2 per region)',
    },
    regions: ['americas', 'emea', 'pacific', 'china'],
    total_t1_teams: T1_TEAMS.length,
  }));
});

// GET /teams/tiers/t1 - Get all T1 teams
router.get('/tiers/t1', (req: Request, res: Response) => {
  const status = req.query.status as TierStatus | undefined;
  const region = req.query.region as VCTRegion | undefined;

  if (status && !['partner', 'ascended'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Valid values: partner, ascended',
      code: 400,
    });
  }

  if (region && !['americas', 'emea', 'pacific', 'china'].includes(region)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid region. Valid values: americas, emea, pacific, china',
      code: 400,
    });
  }

  const teams = getT1Teams({ status, region });
  const grouped = {
    americas: teams.filter(t => t.region === 'americas'),
    emea: teams.filter(t => t.region === 'emea'),
    pacific: teams.filter(t => t.region === 'pacific'),
    china: teams.filter(t => t.region === 'china'),
  };

  res.json(response({
    total: teams.length,
    filters: { status: status || 'all', region: region || 'all' },
    teams: region ? teams : grouped,
  }));
});

// GET /teams/:id - Get team profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const key = cacheKey('team', id);
    const cached = await cache.get<TeamProfile>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getTeamProfile(id);
    await cache.set(key, data, 'team');

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /teams/:id/matches - Get team match history
router.get('/:id/matches', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const type = (req.query.type as 'upcoming' | 'completed') || 'completed';
    const page = parseInt(req.query.page as string) || 1;

    const key = cacheKey('team', id, 'matches', type, page);
    const cached = await cache.get<{ matches: any[]; hasMore: boolean }>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getTeamMatches(id, type, page);
    await cache.set(key, data, 'team');

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
