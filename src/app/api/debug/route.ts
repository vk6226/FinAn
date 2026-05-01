import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const postgresUrl = process.env.POSTGRES_URL;

  if (!postgresUrl) {
    return NextResponse.json({ error: 'POSTGRES_URL is not set!' });
  }

  // Force pgbouncer=true for Supabase transaction pooler
  const u = new URL(postgresUrl);
  u.searchParams.set('pgbouncer', 'true');
  u.searchParams.set('connection_limit', '1');
  const connectionUrl = u.toString();

  const prisma = new PrismaClient({ datasourceUrl: connectionUrl });

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
