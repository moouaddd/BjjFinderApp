import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { loadGyms, getGymById, getCities } from '../data/gymsLoader';

const router = Router();
const prisma = new PrismaClient();

type ProfileMap = Map<string, import('@prisma/client').GymProfile>;

async function getProfileMap(): Promise<ProfileMap> {
  const profiles = await prisma.gymProfile.findMany();
  return new Map(profiles.map((p) => [p.gymId, p]));
}

function enrichGym(gym: ReturnType<typeof loadGyms>[0], profileMap: ProfileMap) {
  const p = profileMap.get(gym.id);
  if (p?.hidden) return null;
  return {
    ...gym,
    // Contact override (owner takes priority over CSV)
    phone: p?.phoneOverride ?? gym.phone,
    email: p?.emailOverride ?? gym.email,
    website: p?.websiteOverride ?? gym.website,
    description: p?.description ?? null,
    pricePerClass: p?.pricePerClass ?? null,
    monthlyFee: p?.monthlyFee ?? null,
    scheduleJson: p?.scheduleJson ?? null,
    // Open mat
    openMatFriday: p?.openMatFriday ?? false,
    openMatFridayTime: p?.openMatFridayTime ?? null,
    openMatFridayDuration: p?.openMatFridayDuration ?? null,
    openMatSaturday: p?.openMatSaturday ?? false,
    openMatSaturdayTime: p?.openMatSaturdayTime ?? null,
    openMatSaturdayDuration: p?.openMatSaturdayDuration ?? null,
    openMatNotes: p?.openMatNotes ?? null,
    isVerified: p?.isVerified ?? false,
    claimedByOwner: p?.claimedByOwner ?? false,
  };
}

// GET /api/gyms
router.get('/', async (req: Request, res: Response) => {
  const { city, search, page = '1', limit = '50' } = req.query as Record<string, string>;
  let gyms = loadGyms();
  if (city) gyms = gyms.filter((g) => g.city.toLowerCase().includes(city.trim().toLowerCase()));
  if (search) {
    const q = search.trim().toLowerCase();
    gyms = gyms.filter((g) => g.name.toLowerCase().includes(q) || g.city.toLowerCase().includes(q));
  }
  const total = gyms.length;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 50);
  const data = gyms.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  const profileMap = await getProfileMap();
  const enriched = data.map((g) => enrichGym(g, profileMap)).filter((g): g is NonNullable<ReturnType<typeof enrichGym>> => g !== null);
  res.json({ total: enriched.length, page: pageNum, limit: limitNum, pages: Math.ceil(enriched.length / limitNum), data: enriched });
});

// GET /api/gyms/cities
router.get('/cities', (_req, res) => res.json({ cities: getCities() }));

// GET /api/gyms/:id
router.get('/:id', async (req: Request, res: Response) => {
  const gym = getGymById(req.params.id);
  if (!gym) { res.status(404).json({ error: 'Gym not found' }); return; }
  const profileMap = await getProfileMap();
  const enriched = enrichGym(gym, profileMap);
  if (!enriched) { res.status(404).json({ error: 'Academia no disponible' }); return; }
  res.json(enriched);
});

// DELETE /api/gyms/:id — hide gym from platform (owner or admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const gymId = req.params.id;
  const gym = getGymById(gymId);
  if (!gym) { res.status(404).json({ error: 'Academia no encontrada' }); return; }

  if (req.user!.role !== 'admin') {
    const profile = await prisma.gymProfile.findUnique({ where: { gymId } });
    if (!profile || profile.ownerId !== req.user!.userId) {
      res.status(403).json({ error: 'Sin permisos para eliminar esta academia' }); return;
    }
  }

  await prisma.gymProfile.upsert({
    where: { gymId },
    create: { gymId, hidden: true },
    update: { hidden: true },
  });
  res.status(204).send();
});

export default router;
