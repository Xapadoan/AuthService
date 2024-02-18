import { Router } from 'express';
import { integrationAuth } from '@middlewares/integrationAuth';
import registerRouter from './register';

const router = Router();

router.use('/:integrationId/*', integrationAuth);
router.use('/:integrationId/register', registerRouter);
router.use('*', (_, res) => res.status(404).json({ error: 'Route not found' }));

export default router;
