import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = 'finan_auth_secret_secure_9922';
const key = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  // No session — allow the login page and recovery page, block everything else
  if (!session) {
    if (pathname === '/' || pathname.startsWith('/recovery')) return NextResponse.next()
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Has a session cookie — validate it
  try {
    const { payload } = await jwtVerify(session, key, { algorithms: ['HS256'] })
    const user = payload.user as { role: string }

    // Role-based routing protection
    if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
       return NextResponse.redirect(new URL('/', request.url))
    }
    if (pathname.startsWith('/analyst') && user.role !== 'ANALYST') {
       return NextResponse.redirect(new URL('/', request.url))
    }
    if (pathname.startsWith('/banker') && user.role !== 'BANKER') {
       return NextResponse.redirect(new URL('/', request.url))
    }

    // If on root and already logged in, go to the correct dashboard
    if (pathname === '/') {
        if (user.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
        if (user.role === 'ANALYST') return NextResponse.redirect(new URL('/analyst', request.url))
        if (user.role === 'BANKER') return NextResponse.redirect(new URL('/banker', request.url))
    }

    return NextResponse.next()
  } catch (err) {
    // JWT is expired or invalid — clear the stale cookie then send to login
    // Without clearing it, the browser keeps resending the bad cookie → infinite redirect loop
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('session', '', { expires: new Date(0), path: '/' })
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
