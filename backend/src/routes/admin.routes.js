import { Router } from 'express';
import { dashboardStats, listUsers, deleteUser, listAllOffers } from '../controllers/admin.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', dashboardStats);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.get('/offers', listAllOffers);

export default router;
