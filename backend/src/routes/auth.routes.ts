// src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../utils/validators';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

router.post('/register', validate(registerSchema), (req, res, next) => {
	register(req, res, next).catch(next);
});
router.post('/login', validate(loginSchema), (req, res, next) => {
	login(req, res, next).catch(next);
});

export default router;
