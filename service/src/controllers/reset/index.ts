import { Router } from 'express';
import cors from 'cors';
import { confirm } from './confirm';

const router = Router();

router.use(cors({ origin: '*' }));
router.get('/confirm', confirm);

export default router;
