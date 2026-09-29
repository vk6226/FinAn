import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo accounts...');
  
  const password = await bcrypt.hash('demo123', 10);
  
  const users = [
    { email: 'admin@finan.com', name: 'Demo Admin', role: 'ADMIN', password },
    { email: 'analyst@finan.com', name: 'Demo Analyst', role: 'ANALYST', password },
    { email: 'banker@finan.com', name: 'Demo Banker', role: 'BANKER', password },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }
  
  console.log('Demo accounts seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
