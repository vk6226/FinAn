import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@finan.com' }
    });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists', email: existingAdmin.email });
    }

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@finan.com',
        name: 'System Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({ 
      message: 'Successfully created admin user!', 
      email: adminUser.email,
      password: 'admin123',
      role: adminUser.role 
    });
  } catch (error: any) {
    console.error('Error seeding admin user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
