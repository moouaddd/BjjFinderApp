import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events';
import instructorsRouter from './routes/instructors';
import gymsRouter from './routes/gyms';
import authRouter from './routes/auth';
import claimsRouter from './routes/claims';
import organizersRouter from './routes/organizers';
import seoRouter from './routes/seo';
import { loadGyms } from './data/gymsLoader';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/instructors', instructorsRouter);
app.use('/api/gyms', gymsRouter);
app.use('/api/gyms', claimsRouter);   // claim + openmat endpoints on /api/gyms/:id/...
app.use('/api', claimsRouter);        // admin gym-claim endpoints on /api/admin/...
app.use('/api', organizersRouter);    // organizer request endpoints on /api/organizers/... + /api/admin/...

// SEO city pages + sitemap (served as complete HTML, not JSON API)
app.use('/', seoRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  loadGyms();
  console.log(`\n🥋 BJJ Backend corriendo en http://localhost:${PORT}\n`);
});
