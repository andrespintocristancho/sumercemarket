import * as authService from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const result = authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const result = authService.loginUser(req.body);
    res.json(result);
  } catch (e) { next(e); }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
