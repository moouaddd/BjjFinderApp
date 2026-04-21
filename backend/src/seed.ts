import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Limpiando y sembrando base de datos...\n');

  await prisma.communityEvent.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.gymClaim.deleteMany();
  await prisma.gymProfile.deleteMany();

  console.log('🗑️   Datos ficticios eliminados');

  // Admin user (preserve if exists)
  const adminEmail = 'admin@bjjspain.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('admin123', 10),
        name: 'Admin BJJ Spain',
        role: 'admin',
      },
    });
    console.log('✅  Admin creado: admin@bjjspain.com / admin123');
  } else {
    console.log('ℹ️   Admin ya existe');
  }

  console.log('\n✨ Base de datos lista. Solo datos reales a partir de ahora.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
