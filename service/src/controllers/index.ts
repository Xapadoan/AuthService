import { Router } from 'express';
import { integrationAuth } from '@middlewares/integrationAuth';
import integrationsRouter from './integrations';
import uploadRouter from './upload';
import resetRouter from './reset';

const router = Router();

router.use('/upload/', uploadRouter);
router.use('/reset', resetRouter);
router.use('/integrations/:integrationId', integrationAuth, integrationsRouter);
router.use('*', (_, res) => res.status(404).json({ error: 'Route not found' }));

export default router;
