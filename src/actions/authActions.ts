'use server'

import db from '@/lib/db'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import bcryptjs from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  if (!email || !password) return { error: 'Email and password required' }
  const user = await db.user.findUnique({ where: { email } })
  if (!user || !bcryptjs.compareSync(password, user.password)) return { error: 'Invalid credentials' }
  const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  const cookieStore = await cookies()
  cookieStore.set('session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
  await db.log.create({ data: { action: 'USER_LOGIN', userId: user.id, details: `Logged in to platform` } })
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
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    await db.log.create({
      data: { action: 'SECURITY_TOKEN_GEN', userId: user.id, details: `Recovery Token generated for ${email}: [ ${token} ]` }
    });
    // Returning success with email for the frontend to handle redirect
    return { success: true, email };
  }
  return { error: 'Account not found. Verify your email or contact Admin.' };
}

export async function completePasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  if (!email || !token || !password) return { error: 'All fields required' };
  const lastLog = await db.log.findFirst({
    where: { action: 'SECURITY_TOKEN_GEN', details: { contains: email } },
    orderBy: { createdAt: 'desc' }
  });
  if (!lastLog || !lastLog.details?.includes(token)) {
    return { error: 'Invalid or expired recovery token. Please verify the code in Admin logs.' };
  }
  const hashed = bcryptjs.hashSync(password, 10);
  await db.user.update({ where: { email }, data: { password: hashed } });
  await db.log.create({ data: { action: 'PASSWORD_RESET_COMPLETE', userId: lastLog.userId, details: `Recovered account via Token: ${token}` } });
  return { success: true };
}
