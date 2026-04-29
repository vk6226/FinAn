'use server'

import db from '@/lib/db'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import bcryptjs from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password required' }
  }

  // Bootstrap admin logic
  if (email === 'admin@finan.com' && password === 'admin') {
    let admin = await db.user.findUnique({ where: { email } })
    if (!admin) {
      const initHashed = bcryptjs.hashSync(password, 10)
      admin = await db.user.create({
        data: {
          email,
          name: 'System Admin',
          password: initHashed,
          role: 'ADMIN' // ADMIN, ANALYST, BANKER
        }
      })
    }
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    return { error: 'Invalid credentials' }
  }

  const isPasswordValid = bcryptjs.compareSync(password, user.password)
  if (!isPasswordValid) {
    return { error: 'Invalid credentials' }
  }

  // Set Session
  const sessionData = { 
    user: { id: user.id, email: user.email, name: user.name, role: user.role } 
  }
  const session = await encrypt(sessionData)
  
  const cookieStore = await cookies()
  cookieStore.set('session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })

  // Log action
  await db.log.create({
    data: { action: 'USER_LOGIN', userId: user.id, details: `User logged in from login portal` }
  })

  // Redirect to respective dashboard
  if (user.role === 'ADMIN') redirect('/admin')
  if (user.role === 'ANALYST') redirect('/analyst')
  if (user.role === 'BANKER') redirect('/banker')
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.set('session', '', { expires: new Date(0) })
    redirect('/')
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'Email is required' };

  const user = await db.user.findUnique({ where: { email } });
  
  if (user) {
    const token = Math.random().toString(36).substring(2, 15);
    
    await db.log.create({
      data: {
        action: 'PASSWORD_RESET_REQUEST',
        userId: user.id,
        details: `Reset link requested. Token: ${token}`
      }
    });

    // In a real app, this would be a URL like: https://yourdomain.com/reset-password?token=${token}&email=${email}
    console.log(`\n--- [PASSWORD RESET EMAIL] ---`);
    console.log(`To: ${email}`);
    console.log(`Link: http://localhost:3000/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
    console.log(`-------------------------------\n`);
  }

  return { success: true };
}

export async function completePasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  if (!email || !password || !confirm) return { error: 'All fields are required' };
  if (password !== confirm) return { error: 'Passwords do not match' };
  
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: 'User not found' };

  const hashed = bcryptjs.hashSync(password, 10);
  
  await db.user.update({
    where: { email },
    data: { password: hashed }
  });

  await db.log.create({
    data: { action: 'PASSWORD_RESET_COMPLETE', userId: user.id, details: `Password reset successfully via recovery portal` }
  });

  return { success: true };
}
