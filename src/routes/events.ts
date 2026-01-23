import { Router, Request, Response } from 'express';
import {
  getEvents,
  getEventDetails,
  searchEvents,
  EventStatus,
} from '../scrapers/events.js';
import { cache, cacheKey } from '../lib/cache.js';
import { ApiResponse, Event, EventDetails } from '../types/index.js';

const router = Router();

// GET /events - Get events list
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as EventStatus) || 'ongoing';

    // Validate status
    if (!['ongoing', 'upcoming', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Valid values: ongoing, upcoming, completed',
        code: 400,
      });
    }

    const key = cacheKey('events', status);
    const cached = await cache.get<Event[]>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getEvents(status);
    await cache.set(key, data, 'results'); // Use results TTL (1 hour)

    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /events/search - Search events
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
        code: 400,
      });
    }

    const data = await searchEvents(q);
    res.json(response(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
});

// GET /events/:id - Get event details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const key = cacheKey('event', id);
    const cached = await cache.get<EventDetails>(key);

    if (cached) {
      return res.json(response(cached.data, true));
    }

    const data = await getEventDetails(id);
    await cache.set(key, data, 'results');

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
