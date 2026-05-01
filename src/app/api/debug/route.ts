import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const postgresUrl = process.env.POSTGRES_URL;

  if (!postgresUrl) {
    return NextResponse.json({ error: 'POSTGRES_URL is not set!' });
  }

  const prisma = new PrismaClient({ datasourceUrl: postgresUrl });

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: 'Connected!',
      POSTGRES_URL_set: true,
      POSTGRES_URL_starts_with: postgresUrl.substring(0, 40) + '...',
      userCount,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'DB Error',
      POSTGRES_URL_set: true,
      POSTGRES_URL_starts_with: postgresUrl.substring(0, 40) + '...',
      error: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
}
