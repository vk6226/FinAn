'use server'

import db from '@/lib/db'
import bcryptjs from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function createUser(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') return { error: 'Unauthorized' }

  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string // ANALYST, BANKER, ADMIN
  const password = formData.get('password') as string

  if (!email || !name || !role || !password) return { error: 'All fields required' }

  try {
    const hashed = bcryptjs.hashSync(password, 10)
    await db.user.create({
      data: { email, name, role, password: hashed }
    })

    await db.log.create({
        data: { action: 'USER_CREATED', userId: session.user.id, details: `Created user ${email} with role ${role}` }
    })

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    if (err.code === 'P2002') return { error: 'Email already exists' }
    return { error: 'Failed to create user' }
  }
}

export async function deleteUser(id: string) {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') return { error: 'Unauthorized' }

    try {
        const target = await db.user.findUnique({where: {id}})
        await db.user.delete({ where: { id } })
        
        await db.log.create({
            data: { action: 'USER_DELETED', userId: session.user.id, details: `Deleted user ${target?.email}` }
        })

        revalidatePath('/admin')
        return { success: true }
    } catch(err) {
        return { error: 'Failed to delete' }
    }
}
