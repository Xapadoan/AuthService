import { Router } from 'express';
import { init } from './init';

const router = Router();

router.post('/', init);

export default router;
