import { Router } from 'express';
import { getDepartments, getCities } from '../services/location.service.js';

const router = Router();

router.get('/departments', (req, res) => {
  res.json(getDepartments());
});

router.get('/cities/:department', (req, res) => {
  res.json(getCities(req.params.department));
});

export default router;
