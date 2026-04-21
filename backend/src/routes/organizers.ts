import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/organizers/request — submit organizer request
router.post('/organizers/request', requireAuth, async (req: Request, res: Response) => {
  const { message } = req.body;
  const userId = req.user!.userId;

  if (['organizer', 'gym_owner', 'admin'].includes(req.user!.role)) {
    res.status(409).json({ error: 'Ya tienes permisos de organizador' }); return;
  }

  const existing = await prisma.organizerRequest.findFirst({
    where: { userId, status: 'pending' },
  });
  if (existing) {
    res.status(409).json({ error: 'Ya tienes una solicitud pendiente' }); return;
  }

  const request = await prisma.organizerRequest.create({
    data: { userId, message: message ?? null },
  });
  res.status(201).json(request);
});

// GET /api/organizers/my-request — check current user's request status
router.get('/organizers/my-request', requireAuth, async (req: Request, res: Response) => {
  const request = await prisma.organizerRequest.findFirst({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(request ?? null);
});

// GET /api/admin/organizer-requests — admin list all organizer requests
router.get('/admin/organizer-requests', requireAuth, requireRole('admin'), async (_req, res) => {
  const requests = await prisma.organizerRequest.findMany({
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
});

// PATCH /api/admin/organizer-requests/:id — admin approve or reject
router.patch('/admin/organizer-requests/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { action } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    res.status(400).json({ error: 'action debe ser approve o reject' }); return;
  }
  const request = await prisma.organizerRequest.findUnique({ where: { id: req.params.id } });
  if (!request) { res.status(404).json({ error: 'Solicitud no encontrada' }); return; }

  if (action === 'approve') {
    await prisma.$transaction([
      prisma.organizerRequest.update({ where: { id: request.id }, data: { status: 'approved' } }),
      prisma.user.update({ where: { id: request.userId }, data: { role: 'organizer' } }),
    ]);
  } else {
    await prisma.organizerRequest.update({ where: { id: request.id }, data: { status: 'rejected' } });
  }
  res.json({ ok: true, action });
});

export default router;
