import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { scraper } from '../lib/scraper.js';
import {
  getSamples,
  getSample,
  deleteSample,
  cleanupOldSamples,
} from '../lib/debug.js';
import { CaptureType, CAPTURE_PATHS } from '../types/debug.js';

const router = Router();

// Middleware to restrict debug routes in production
const debugGuard = (_req: Request, res: Response, next: NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';
  const debugEnabled = process.env.ENABLE_DEBUG === 'true';

  if (isProd && !debugEnabled) {
    return res.status(403).json({
      success: false,
      error: 'Debug endpoints disabled in production. Set ENABLE_DEBUG=true to enable.',
      code: 403,
    });
  }

  if (!config.debug.enabled) {
    return res.status(403).json({
      success: false,
      error: 'Debug mode is disabled in configuration.',
      code: 403,
    });
  }

  next();
};

router.use(debugGuard);

// GET /api/debug/capture/:type - Manually capture HTML sample
router.get('/capture/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as CaptureType;

    if (!CAPTURE_PATHS[type]) {
      return res.status(400).json({
        success: false,
        error: `Invalid capture type: ${type}. Valid types: ${Object.keys(CAPTURE_PATHS).join(', ')}`,
        code: 400,
      });
    }

    let path = CAPTURE_PATHS[type];
    const context: Record<string, unknown> = { query: req.query };

    // Replace path parameters
    if (path.includes(':matchId') && req.query.matchId) {
      path = `/${req.query.matchId}`;
    }
    if (path.includes(':id') && req.query.id) {
      path = path.replace(':id', req.query.id as string);
    }

    // Add query params for stats
    if (type === 'player-stats') {
      const params = new URLSearchParams();
      if (req.query.region) params.set('region', req.query.region as string);
      if (req.query.timespan) params.set('timespan', (req.query.timespan as string) + 'd');
      if (req.query.agent) params.set('agent', req.query.agent as string);
      if (req.query.map) params.set('map', req.query.map as string);
      if (req.query.min_rounds) params.set('min_rounds', req.query.min_rounds as string);
      if (req.query.event_id) params.set('event_id', req.query.event_id as string);
      const queryStr = params.toString();
      if (queryStr) {
        path = `/stats/?${queryStr}`;
      }
    }

    // Add search query for search types
    if (type.includes('search') && req.query.q) {
      path = path + encodeURIComponent(req.query.q as string);
    }

    const sample = await scraper.captureSample(type, path, context);

    res.json({
      success: true,
      data: {
        id: sample.id,
        type: sample.type,
        url: sample.url,
        timestamp: sample.timestamp,
        fileSize: sample.fileSize,
      },
      message: `HTML sample captured successfully. ID: ${sample.id}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture sample',
      code: 500,
    });
  }
});

// GET /api/debug/samples - List all saved samples
router.get('/samples', (req: Request, res: Response) => {
  try {
    const type = req.query.type as CaptureType | undefined;
    const samples = getSamples(type);

    res.json({
      success: true,
      data: samples,
      count: samples.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get samples',
      code: 500,
    });
  }
});

// GET /api/debug/samples/:id - Get specific sample with full HTML
router.get('/samples/:id', (req: Request, res: Response) => {
  try {
    const sample = getSample(req.params.id);

    if (!sample) {
      return res.status(404).json({
        success: false,
        error: 'Sample not found',
        code: 404,
      });
    }

    // Check if client wants raw HTML
    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(sample.html);
    }

    res.json({
      success: true,
      data: sample,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sample',
      code: 500,
    });
  }
});

// DELETE /api/debug/samples/:id - Delete a sample
router.delete('/samples/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteSample(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Sample not found',
        code: 404,
      });
    }

    res.json({
      success: true,
      message: 'Sample deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sample',
      code: 500,
    });
  }
});

// POST /api/debug/cleanup - Clean up old samples
router.post('/cleanup', (req: Request, res: Response) => {
  try {
    const keepCount = parseInt(req.query.keep as string) || config.debug.maxSamples;
    const deletedCount = cleanupOldSamples(keepCount);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old sample(s)`,
      deleted: deletedCount,
      remaining: getSamples().length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup samples',
      code: 500,
    });
  }
});

// GET /api/debug/types - List available capture types
router.get('/types', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.entries(CAPTURE_PATHS).map(([type, path]) => ({
      type,
      defaultPath: path,
    })),
  });
});

export default router;
