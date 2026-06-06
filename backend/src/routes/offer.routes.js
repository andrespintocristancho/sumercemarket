import { Router } from 'express';
import {
  createOffer, listOffers, getOffer, myOffers,
  updateOffer, deleteOffer, registerContact
} from '../controllers/offer.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', listOffers);
router.get('/mine', authMiddleware, myOffers);
router.get('/:id', getOffer);
router.post('/', authMiddleware, upload.array('images', 6), createOffer);
router.put('/:id', authMiddleware, updateOffer);
router.delete('/:id', authMiddleware, deleteOffer);
router.post('/:id/contact', registerContact);

export default router;
