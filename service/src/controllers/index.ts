import { Router } from 'express';
import { integrationAuth } from '@middlewares/integrationAuth';
import registerRouter from './register';
import integrationsRouter from './integrations';

const router = Router();

router.use('/:integrationId/*', integrationAuth);
router.use('/:integrationId/register', registerRouter);
router.use('/:integrationId/*', integrationsRouter);
router.use('*', (_, res) => res.status(404).json({ error: 'Route not found' }));

export default router;
