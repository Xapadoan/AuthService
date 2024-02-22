import { Router } from 'express';
import { read } from './read';

const router = Router();

router.get('/', read);

export default router;
