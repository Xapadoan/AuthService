import { Router } from 'express';
import { confirm } from './confirm';

const router = Router();

router.put('/', confirm);

export default router;
