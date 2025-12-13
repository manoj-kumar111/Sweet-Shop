import { Router } from 'express';
import * as sweetController from './sweet.controller';
import * as inventoryController from '../inventory/inventory.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN']), sweetController.create);
router.get('/', authenticate, sweetController.getAll);
router.get('/search', authenticate, sweetController.search);
router.post('/:id/purchase', authenticate, inventoryController.purchase);
router.post('/:id/restock', authenticate, authorize(['ADMIN']), inventoryController.restock);
router.put('/:id', authenticate, authorize(['ADMIN']), sweetController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), sweetController.remove);

export default router;