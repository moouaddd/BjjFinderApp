import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

type EventRow = Awaited<ReturnType<typeof prisma.communityEvent.findFirst>>;

function serialize(row: NonNullable<EventRow>) {
  return { ...row, tags: JSON.parse(row.tags) as string[] };
}

// GET /api/events — lista todos los eventos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.communityEvent.findMany({ orderBy: { date: 'asc' } });
    res.json(rows.map(serialize));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// GET /api/events/:id — obtiene un evento
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const row = await prisma.communityEvent.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(serialize(row));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el evento' });
  }
});

// POST /api/events — crea un nuevo evento (requiere rol organizer/gym_owner/admin)
router.post('/', requireAuth, requireRole('organizer', 'gym_owner', 'admin'), async (req: Request, res: Response) => {
  const b = req.body;
  if (!b.title || !b.organizer || !b.gym || !b.date || !b.time || !b.description) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const row = await prisma.communityEvent.create({
      data: {
        type: b.type ?? 'openmat',
        title: String(b.title).trim(),
        organizer: String(b.organizer).trim(),
        organizerContact: String(b.organizerContact ?? '').trim(),
        gym: String(b.gym).trim(),
        address: String(b.address ?? '').trim(),
        city: String(b.city ?? 'Madrid').trim(),
        date: String(b.date),
        time: String(b.time),
        duration: String(b.duration ?? '').trim(),
        price: Number(b.price) || 0,
        category: b.category ?? 'mixto',
        modality: b.modality ?? 'gi',
        description: String(b.description).trim(),
        spotsTotal: b.spotsTotal ? Number(b.spotsTotal) : null,
        spotsLeft: b.spotsTotal ? Number(b.spotsTotal) : null,
        instructor: b.instructor ? String(b.instructor).trim() : null,
        instructorBelt: b.instructorBelt ? String(b.instructorBelt).trim() : null,
        tags: JSON.stringify(Array.isArray(b.tags) ? b.tags : []),
        organizerId: req.user?.userId ?? null,
      },
    });
    res.status(201).json(serialize(row));
  } catch (err) {
    res.status(400).json({ error: 'Error al crear el evento' });
  }
});

// PATCH /api/events/:id/spots — reduce spotsLeft en 1 (inscripción)
router.patch('/:id/spots', async (req: Request, res: Response) => {
  try {
    const row = await prisma.communityEvent.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: 'Evento no encontrado' });
    if (row.spotsLeft !== null && row.spotsLeft <= 0) {
      return res.status(409).json({ error: 'No quedan plazas disponibles' });
    }
    const updated = await prisma.communityEvent.update({
      where: { id: req.params.id },
      data: { spotsLeft: row.spotsLeft !== null ? row.spotsLeft - 1 : null },
    });
    res.json(serialize(updated));
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar plazas' });
  }
});

// DELETE /api/events/:id — elimina un evento (admin: cualquiera; owner/organizer: solo los suyos)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const row = await prisma.communityEvent.findUnique({ where: { id: req.params.id } });
    if (!row) { res.status(404).json({ error: 'Evento no encontrado' }); return; }
    if (req.user!.role !== 'admin' && row.organizerId !== req.user!.userId) {
      res.status(403).json({ error: 'Sin permisos para eliminar este evento' }); return;
    }
    await prisma.communityEvent.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
});

export default router;
