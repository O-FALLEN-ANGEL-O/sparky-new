'use client'

import dynamic from 'next/dynamic'
import type { Chapter } from '@/components/three/scroll-story'

const ScrollStory = dynamic(() => import('@/components/three/scroll-story'), {
  ssr: false,
  loading: () => <div className="h-dvh bg-velvet" />,
})

export function Story({ chapters }: { chapters: Chapter[] }) {
  return <ScrollStory chapters={chapters} />
}
