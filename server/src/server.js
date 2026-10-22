import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import doctorRoutes from './routes/doctors.js';
import bedRoutes from './routes/beds.js';
import patientRoutes from './routes/patients.js';
import contactRoutes from './routes/contact.js';
import statsRoutes from './routes/stats.js';
import { seedIfEmpty } from './seed/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
  if (isProd) {
    console.error('JWT_SECRET is required in production.');
    process.exit(1);
  }
  process.env.JWT_SECRET = 'dev-only-secret-do-not-use-in-production';
  console.warn('JWT_SECRET not set - using an insecure development secret.');
}

const app = express();
app.set('trust proxy', 1); // Render / Railway / Nginx sit in front of the app

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);
app.use(compression());

const allowed = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => cb(null, !origin || !isProd || allowed.includes(origin)) }));
app.use(express.json({ limit: '100kb' }));

const limiter = (windowMs, max) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests. Try again in a few minutes.' } });
app.use('/api', limiter(15 * 60 * 1000, 1000));
app.use('/api/auth', limiter(15 * 60 * 1000, 30));
app.use('/api/contact', limiter(60 * 60 * 1000, 10));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));

// Serve the built React app (single-service deployment)
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: isProd ? '1h' : 0 }));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('/', (req, res) => res.json({ message: 'API is running. Build the client (npm run build) to serve the website here.' }));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ message: err.message });
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id.' });
  res.status(500).json({ message: isProd ? 'Something went wrong on the server.' : err.message });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    if (process.env.SEED_ON_START !== 'false') await seedIfEmpty();
    app.listen(PORT, () => console.log('Server listening on port ' + PORT));
  })
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
