'use client'

import { Box } from 'lucide-react'
import dynamic from 'next/dynamic'
import { JewelImage as Image } from '@/components/jewel-image'
import { useState } from 'react'
import type { JewelSpec } from '@/components/three/designs'
import { cn } from '@/lib/utils'

const JewelViewer = dynamic(() => import('@/components/three/viewer'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading 3D view…</div>,
})

export function Gallery({ images, name, spec }: { images: string[]; name: string; spec: JewelSpec }) {
  const [active, setActive] = useState(0)
  const [mode, setMode] = useState<'photo' | '3d'>('photo')
  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden bg-[#f1ece2]">
        {mode === 'photo' ? (
          <Image src={images[active]} alt={`${name}, view ${active + 1}`} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        ) : (
          <JewelViewer spec={spec} className="absolute inset-0" />
        )}
        {mode === '3d' && <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-muted-foreground">Drag to turn · Scroll or pinch to zoom</p>}
      </div>
      <div className="flex gap-2 sm:gap-3" role="tablist" aria-label="Views">
        {images.map((src, i) => (
          <button
            key={src}
            role="tab"
            aria-selected={mode === 'photo' && active === i}
            aria-label={`Photo ${i + 1}`}
            onClick={() => {
              setMode('photo')
              setActive(i)
            }}
            className={cn('relative aspect-square min-w-0 max-w-20 flex-1 overflow-hidden bg-[#f1ece2] ring-offset-2 transition', mode === 'photo' && active === i ? 'ring-1 ring-foreground' : 'opacity-70 hover:opacity-100')}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
        <button
          role="tab"
          aria-selected={mode === '3d'}
          onClick={() => setMode('3d')}
          className={cn('flex aspect-square min-w-0 max-w-20 flex-1 flex-col items-center justify-center gap-1 border text-[11px] leading-tight ring-offset-2 sm:text-xs transition', mode === '3d' ? 'ring-1 ring-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          <Box className="h-5 w-5" />
          3D view
        </button>
      </div>
    </div>
  )
}
