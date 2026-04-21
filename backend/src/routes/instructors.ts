import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

type InstructorRow = Awaited<ReturnType<typeof prisma.instructor.findFirst>>;

function serialize(row: NonNullable<InstructorRow>) {
  return {
    ...row,
    specialties: JSON.parse(row.specialties) as string[],
    modalities: JSON.parse(row.modalities) as string[],
    languages: JSON.parse(row.languages) as string[],
  };
}

// GET /api/instructors — lista todos los instructores
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.instructor.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(rows.map(serialize));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener instructores' });
  }
});

// GET /api/instructors/:id — obtiene un instructor
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const row = await prisma.instructor.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: 'Instructor no encontrado' });
    res.json(serialize(row));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener instructor' });
  }
});

// POST /api/instructors — registra un nuevo instructor
router.post('/', async (req: Request, res: Response) => {
  const b = req.body;
  if (!b.name || !b.belt || !b.team || !b.bio || !b.contact || !b.pricePerHour || !b.availability) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const row = await prisma.instructor.create({
      data: {
        name: String(b.name).trim(),
        belt: b.belt,
        stripes: Number(b.stripes) || 0,
        team: String(b.team).trim(),
        city: String(b.city ?? 'Madrid').trim(),
        gym: b.gym ? String(b.gym).trim() : null,
        bio: String(b.bio).trim(),
        specialties: JSON.stringify(Array.isArray(b.specialties) ? b.specialties : []),
        modalities: JSON.stringify(Array.isArray(b.modalities) ? b.modalities : []),
        pricePerHour: Number(b.pricePerHour),
        pricePerSession: b.pricePerSession ? Number(b.pricePerSession) : null,
        online: Boolean(b.online),
        inPerson: Boolean(b.inPerson),
        instagram: b.instagram ? String(b.instagram).trim() : null,
        contact: String(b.contact).trim(),
        experience: b.experience ? String(b.experience).trim() : '',
        languages: JSON.stringify(Array.isArray(b.languages) ? b.languages : []),
        availability: String(b.availability).trim(),
      },
    });
    res.status(201).json(serialize(row));
  } catch (err) {
    res.status(400).json({ error: 'Error al registrar instructor' });
  }
});

// DELETE /api/instructors/:id — elimina un instructor
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.instructor.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar instructor' });
  }
});

export default router;
