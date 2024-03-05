import { Router } from 'express';
import { read } from './read';
import { initRegister } from './initRegister';
import { initRestore } from './initRestore';
import { initReset } from './initReset';

const router = Router();

router.get('/', read);
router.post('/register', initRegister);
router.post('/restore', initRestore);
router.post('/reset', initReset);

export default router;
