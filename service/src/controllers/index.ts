import { Router } from 'express';
import { integrationAuth } from '@middlewares/integrationAuth';
import registerRouter from './register';
import restoreRouter from './restore';
import integrationsRouter from './integrations';
import uploadRouter from './upload';

const router = Router();

router.use('/upload/', uploadRouter);
router.use('/:integrationId', integrationAuth);
router.use('/:integrationId/register', registerRouter);
router.use('/:integrationId/restore', restoreRouter);
router.use('/:integrationId', integrationsRouter);
router.use('*', (_, res) => res.status(404).json({ error: 'Route not found' }));

export default router;
