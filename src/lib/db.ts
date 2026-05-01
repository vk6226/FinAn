import { PrismaClient } from '@prisma/client'

// Supabase uses PgBouncer in transaction mode on port 6543.
// Prisma needs pgbouncer=true to disable prepared statements.
// Vercel's auto-integration doesn't add this, so we force it here.
function buildConnectionUrl() {
  const url = process.env.POSTGRES_URL || '';
  try {
    const u = new URL(url);
    u.searchParams.set('pgbouncer', 'true');
    u.searchParams.set('connection_limit', '1');
    return u.toString();
  } catch {
    return url;
  }
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: buildConnectionUrl(),
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton()

export default db

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db
