import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Compression is handled by hosting environment or reverse proxy.
  // Native compression middleware is not supported in Next.js Edge Middleware.
  return res;
}

export const config = {
  matcher: '/:path*',
};
