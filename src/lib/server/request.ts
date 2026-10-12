import 'server-only'
import { headers } from 'next/headers'

export async function requestMeta() {
  const h = await headers()
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '127.0.0.1').trim()
  return { ip, userAgent: h.get('user-agent') ?? '' }
}
