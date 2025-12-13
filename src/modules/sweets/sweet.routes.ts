import { Router } from 'express';
import * as sweetController from './sweet.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN']), sweetController.create);
router.get('/', authenticate, sweetController.getAll);
router.get('/search', authenticate, sweetController.search);
router.put('/:id', authenticate, authorize(['ADMIN']), sweetController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), sweetController.remove);

export default router;