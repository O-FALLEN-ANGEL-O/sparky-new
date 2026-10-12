import { NextResponse, type NextRequest } from 'next/server'

// Fast first gate: no session cookie means no access to private areas.
// Role checks happen on the server in each layout (see requireUser).
const PRIVATE = ['/dashboard', '/account', '/checkout', '/delivery']

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (PRIVATE.some((p) => pathname === p || pathname.startsWith(p + '/')) && !req.cookies.has('spk_session')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/checkout/:path*', '/delivery/:path*'],
}
