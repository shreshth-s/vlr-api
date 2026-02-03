import { Router } from 'express';
import matchesRouter from './matches.js';
import playersRouter from './players.js';
import teamsRouter from './teams.js';
import eventsRouter from './events.js';
import debugRouter from './debug.js';

const router = Router();

router.use('/matches', matchesRouter);
router.use('/players', playersRouter);
router.use('/teams', teamsRouter);
router.use('/events', eventsRouter);
router.use('/debug', debugRouter);

export default router;
