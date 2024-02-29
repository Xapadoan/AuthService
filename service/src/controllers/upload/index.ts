import { Router } from 'express';
import cors from 'cors';
import { registerUpload } from './register';

const router = Router({ mergeParams: true });

router.use(cors({ origin: '*' }));
router.post('/register', registerUpload);

export default router;
