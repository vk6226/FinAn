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
