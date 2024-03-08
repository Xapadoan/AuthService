import { Router } from 'express';
import cors from 'cors';
import { registerUpload } from './register';
import { restoreUpload } from './restore';
import { resetUpload } from './reset';

const router = Router({ mergeParams: true });

router.use(cors({ origin: '*' }));
router.post('/register', registerUpload);
router.post('/restore', restoreUpload);
router.post('/reset', resetUpload);

export default router;
