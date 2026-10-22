import { Router } from 'express';
import { Contact } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, EMAIL_RE, PHONE_RE, str } from '../utils/helpers.js';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = str(req.body.name, 80);
    const email = str(req.body.email, 120);
    const phone = str(req.body.phone, 20);
    const message = str(req.body.message, 2000);

    if (name.length < 2) return res.status(400).json({ message: 'Please enter your name.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (phone && !PHONE_RE.test(phone)) return res.status(400).json({ message: 'Enter a valid phone number or leave it empty.' });
    if (message.length < 10) return res.status(400).json({ message: 'Message should be at least 10 characters.' });

    await Contact.create({ name, email, phone, message });
    res.status(201).json({ ok: true, message: 'Thanks! Your message has been received.' });
  })
);

router.get(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await Contact.find().sort('-createdAt').limit(100).lean());
  })
);

export default router;
