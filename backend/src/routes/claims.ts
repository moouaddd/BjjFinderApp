import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { loadGyms } from '../data/gymsLoader';

const router = Router();
const prisma = new PrismaClient();

// POST /api/gyms/:id/claim
router.post('/:id/claim', requireAuth, async (req: Request, res: Response) => {
  const gymId = req.params.id;
  const { message } = req.body;
  const gym = loadGyms().find((g) => g.id === gymId);
  if (!gym) { res.status(404).json({ error: 'Academia no encontrada' }); return; }
  const existing = await prisma.gymProfile.findUnique({ where: { gymId } });
  if (existing?.claimedByOwner) { res.status(409).json({ error: 'Esta academia ya tiene propietario verificado' }); return; }
  const pendingClaim = await prisma.gymClaim.findFirst({ where: { gymId, userId: req.user!.userId, status: 'pending' } });
  if (pendingClaim) { res.status(409).json({ error: 'Ya tienes una solicitud pendiente para esta academia' }); return; }
  const claim = await prisma.gymClaim.create({ data: { gymId, userId: req.user!.userId, message: message ?? null } });
  res.status(201).json({ message: 'Solicitud enviada. El administrador la revisará pronto.', claim });
});

// PATCH /api/gyms/:id/openmat — update open mat settings
router.patch('/:id/openmat', requireAuth, async (req: Request, res: Response) => {
  const gymId = req.params.id;
  const {
    openMatFriday, openMatFridayTime, openMatFridayDuration,
    openMatSaturday, openMatSaturdayTime, openMatSaturdayDuration,
    openMatNotes,
  } = req.body;

  if (req.user!.role !== 'admin') {
    const profile = await prisma.gymProfile.findUnique({ where: { gymId } });
    if (!profile || profile.ownerId !== req.user!.userId) {
      res.status(403).json({ error: 'Solo el propietario puede editar esta academia' }); return;
    }
  }

  const nullIfEmpty = (v: string | undefined): string | null | undefined =>
    v === undefined ? undefined : v.trim() === '' ? null : v;
  const data = {
    gymId,
    ...(openMatFriday !== undefined && { openMatFriday: Boolean(openMatFriday) }),
    ...(openMatFridayTime !== undefined && { openMatFridayTime: nullIfEmpty(String(openMatFridayTime)) }),
    ...(openMatFridayDuration !== undefined && { openMatFridayDuration: nullIfEmpty(String(openMatFridayDuration)) }),
    ...(openMatSaturday !== undefined && { openMatSaturday: Boolean(openMatSaturday) }),
    ...(openMatSaturdayTime !== undefined && { openMatSaturdayTime: nullIfEmpty(String(openMatSaturdayTime)) }),
    ...(openMatSaturdayDuration !== undefined && { openMatSaturdayDuration: nullIfEmpty(String(openMatSaturdayDuration)) }),
    ...(openMatNotes !== undefined && { openMatNotes: nullIfEmpty(String(openMatNotes)) }),
  };

  const profile = await prisma.gymProfile.upsert({ where: { gymId }, create: data, update: data });
  res.json(profile);
});

// PATCH /api/gyms/:id/profile — update contact, schedule, prices
router.patch('/:id/profile', requireAuth, async (req: Request, res: Response) => {
  const gymId = req.params.id;
  const { phoneOverride, emailOverride, websiteOverride, pricePerClass, monthlyFee, scheduleJson, description } = req.body;

  if (req.user!.role !== 'admin') {
    const profile = await prisma.gymProfile.findUnique({ where: { gymId } });
    if (!profile || profile.ownerId !== req.user!.userId) {
      res.status(403).json({ error: 'Solo el propietario puede editar esta academia' }); return;
    }
  }

  const data = {
    gymId,
    ...(phoneOverride !== undefined && { phoneOverride }),
    ...(emailOverride !== undefined && { emailOverride }),
    ...(websiteOverride !== undefined && { websiteOverride }),
    ...(pricePerClass !== undefined && { pricePerClass: pricePerClass === '' ? null : Number(pricePerClass) }),
    ...(monthlyFee !== undefined && { monthlyFee: monthlyFee === '' ? null : Number(monthlyFee) }),
    ...(scheduleJson !== undefined && { scheduleJson }),
    ...(description !== undefined && { description }),
  };

  const profile = await prisma.gymProfile.upsert({ where: { gymId }, create: data, update: data });
  res.json(profile);
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

router.get('/admin/claims', requireAuth, requireRole('admin'), async (_req, res) => {
  const claims = await prisma.gymClaim.findMany({
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const gymMap = new Map(loadGyms().map((g) => [g.id, g]));
  res.json(claims.map((c) => ({ ...c, gym: gymMap.get(c.gymId) ?? { id: c.gymId, name: c.gymId } })));
});

router.patch('/admin/claims/:claimId', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { action } = req.body;
  if (!['approve', 'reject'].includes(action)) { res.status(400).json({ error: 'action debe ser approve o reject' }); return; }
  const claim = await prisma.gymClaim.findUnique({ where: { id: req.params.claimId } });
  if (!claim) { res.status(404).json({ error: 'Solicitud no encontrada' }); return; }
  if (action === 'approve') {
    await prisma.$transaction([
      prisma.gymClaim.update({ where: { id: claim.id }, data: { status: 'approved' } }),
      prisma.gymProfile.upsert({
        where: { gymId: claim.gymId },
        create: { gymId: claim.gymId, ownerId: claim.userId, isVerified: true, claimedByOwner: true },
        update: { ownerId: claim.userId, isVerified: true, claimedByOwner: true },
      }),
      prisma.user.update({ where: { id: claim.userId }, data: { role: 'gym_owner' } }),
    ]);
  } else {
    await prisma.gymClaim.update({ where: { id: claim.id }, data: { status: 'rejected' } });
  }
  res.json({ ok: true, action });
});

router.get('/admin/stats', requireAuth, requireRole('admin'), async (_req, res) => {
  const [users, pending, approved, profiles, pendingOrganizers] = await Promise.all([
    prisma.user.count(),
    prisma.gymClaim.count({ where: { status: 'pending' } }),
    prisma.gymClaim.count({ where: { status: 'approved' } }),
    prisma.gymProfile.count({ where: { claimedByOwner: true } }),
    prisma.organizerRequest.count({ where: { status: 'pending' } }),
  ]);
  res.json({ users, pendingClaims: pending, approvedClaims: approved, claimedGyms: profiles, pendingOrganizers });
});

export default router;
