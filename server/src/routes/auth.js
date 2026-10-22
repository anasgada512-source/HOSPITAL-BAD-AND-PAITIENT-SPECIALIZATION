import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, nextId } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, EMAIL_RE, str } from '../utils/helpers.js';

const router = Router();
const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = str(req.body.name, 60);
    const email = str(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (name.length < 2) return res.status(400).json({ message: 'Name must be 2 to 60 characters.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'An account with this email already exists. Log in instead.' });

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const user = await User.create({
      userId: await nextId('user', 'HMS'),
      name,
      email,
      password: await bcrypt.hash(password, 11),
      role: adminEmail && email === adminEmail ? 'admin' : 'staff',
    });
    res.status(201).json({ token: sign(user), user: user.toPublic() });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = str(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = email ? await User.findOne({ email }).select('+password') : null;
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ message: 'Email or password is incorrect.' });
    res.json({ token: sign(user), user: user.toPublic() });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toPublic() }));

export default router;
