import { notFound } from 'next/navigation'
import { StudioCanvas } from './studio-canvas'
import type { Design } from '@/components/three/designs'
import type { Gem, Metal } from '@/components/three/materials'

/**
 * Photo studio used by `npm run render:products` to shoot product images.
 * Disabled in production unless RENDER_STUDIO=1.
 */
export default async function Studio({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_STUDIO !== '1') notFound()
  const q = await searchParams
  return (
    <StudioCanvas
      spec={{ design: (q.design ?? 'solitaire') as Design, metal: (q.metal ?? 'yellow_gold') as Metal, gem: (q.gem ?? 'diamond') as Gem }}
      angle={Number(q.angle ?? 0)}
      background={q.bg ?? 'paper'}
    />
  )
}
