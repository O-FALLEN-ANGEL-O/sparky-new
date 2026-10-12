'use client'

import { Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import Link from 'next/link'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { Jewel, poseFor, type JewelSpec } from './designs'
import { StudioLighting } from './stage'

export interface Chapter {
  key: string
  name: string
  title: string
  body: string
  href: string
  cta: string
  spec: JewelSpec
}

/** Weight of chapter i (0..1) at scroll progress p, given n chapters after a short intro. */
function weight(p: number, i: number, n: number) {
  const start = 0.1
  const span = (1 - start) / n
  const center = start + span * (i + 0.5)
  const d = Math.abs(p - center) / (span * 0.62)
  return THREE.MathUtils.clamp(1 - d * d, 0, 1)
}

function StoryJewel({ chapter, index, count, progress, still }: { chapter: Chapter; index: number; count: number; progress: MotionValue<number>; still: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const pose = poseFor(chapter.spec.design)
  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    const mobile = state.size.width < 768
    const p = progress.get()
    // the intro shows the first piece large and centred
    const w = index === 0 ? Math.max(weight(p, 0, count), THREE.MathUtils.clamp(1 - p / 0.1, 0, 1)) : weight(p, index, count)
    g.visible = w > 0.01
    if (!g.visible) return
    const start = 0.1 + ((1 - 0.1) / count) * index
    const local = p - start
    const enter = 1 - w
    const dir = p < start + (1 - 0.1) / count / 2 ? 1 : -1
    // phones: smaller piece in the upper half, clear of the copy below
    g.position.set(0.9, pose.y + (mobile ? 1.05 : 0) + enter * -1.6 * dir, -enter * 1.5)
    g.scale.setScalar(pose.scale * (0.72 + 0.28 * w) * (mobile ? 0.62 : 0.92))
    g.rotation.set(pose.rotation[0] + enter * 0.4, pose.rotation[1] + local * 9 + (still ? 0 : state.clock.elapsedTime * 0.25), pose.rotation[2])
    void delta
  })
  return (
    <group ref={ref}>
      <Jewel {...chapter.spec} />
    </group>
  )
}

function Rig({ progress }: { progress: MotionValue<number> }) {
  useFrame(({ camera, size }) => {
    const p = progress.get()
    const mobile = size.width < 768
    // on phones the jewel sits centred above the text; on desktop it sits right of the copy
    camera.position.set(mobile ? 0.9 : -0.25, mobile ? 0.1 : 0.15 + p * 0.2, mobile ? 6.4 : 5.2)
    camera.lookAt(mobile ? 0.9 : 0.25, mobile ? 0.1 : 0, 0)
  })
  return null
}

function ChapterCopy({ chapter, index, count, progress }: { chapter: Chapter; index: number; count: number; progress: MotionValue<number> }) {
  const start = 0.1 + ((1 - 0.1) / count) * index
  const span = (1 - 0.1) / count
  const opacity = useTransform(progress, [start, start + span * 0.25, start + span * 0.75, start + span], [0, 1, 1, 0])
  const y = useTransform(progress, [start, start + span * 0.25, start + span * 0.75, start + span], [24, 0, 0, -24])
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[10vh] z-[2] px-6 md:inset-y-0 md:left-[8vw] md:right-auto md:flex md:max-w-[30rem] md:items-center md:px-0">
    <motion.div style={{ opacity, y }}>
      <p className="mb-4 text-sm text-gilt/80">{chapter.name}</p>
      <h2 className="text-balance text-4xl leading-[1.05] text-[#f6efe2] md:text-6xl">{chapter.title}</h2>
      <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-[#cbbfae] md:text-lg">{chapter.body}</p>
      <Link
        href={chapter.href}
        className="pointer-events-auto mt-8 inline-flex h-11 items-center border border-gold/60 px-6 text-sm tracking-wide text-gilt transition-colors hover:bg-gold hover:text-velvet"
      >
        {chapter.cta}
      </Link>
    </motion.div>
    </div>
  )
}

export default function ScrollStory({ chapters }: { chapters: Chapter[] }) {
  const section = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const introOpacity = useTransform(scrollYProgress, [0, 0.07], [1, 0])
  const introY = useTransform(scrollYProgress, [0, 0.07], [0, -40])

  return (
    <section ref={section} aria-label="Our collections" className="relative bg-velvet" style={{ height: `${120 + chapters.length * 100}vh` }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'radial-gradient(70% 60% at 62% 45%, #3a2c20 0%, #1c1612 45%, #15110e 75%)' }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[55%] bg-gradient-to-t from-velvet via-velvet/80 to-transparent md:hidden" />
        <Canvas
          className="!absolute inset-0"
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 5.2], fov: 32 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          aria-hidden
        >
          <Suspense fallback={null}>
            <StudioLighting mood="velvet" />
            {chapters.map((c, i) => (
              <StoryJewel key={c.key} chapter={c} index={i} count={chapters.length} progress={scrollYProgress} still={reduce} />
            ))}
            <Sparkles count={70} scale={[9, 6, 4]} size={2.2} speed={reduce ? 0 : 0.25} opacity={0.55} color="#e9d08c" />
          </Suspense>
          <Rig progress={scrollYProgress} />
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 bottom-[8vh] z-[2] px-6 md:inset-y-0 md:left-[8vw] md:right-auto md:flex md:max-w-[34rem] md:items-center md:px-0">
        <motion.div style={{ opacity: introOpacity, y: introY }}>
          <h1 className="text-balance text-[2.75rem] leading-[1] text-[#f6efe2] sm:text-6xl md:text-[5.25rem]">Fine jewellery, made by hand in Mangaluru.</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#cbbfae] md:text-lg">
            BIS-hallmarked gold, IGI-certified diamonds and temple work from karigar families we have known for decades. Delivered insured, anywhere in India.
          </p>
          <p className="mt-10 flex items-center gap-3 text-sm text-gilt/70">
            <span className="inline-block h-8 w-px animate-pulse bg-gradient-to-b from-gold to-transparent" aria-hidden />
            Scroll to see the collections
          </p>
        </motion.div>
        </div>

        {chapters.map((c, i) => (
          <ChapterCopy key={c.key} chapter={c} index={i} count={chapters.length} progress={scrollYProgress} />
        ))}

        <Progress chapters={chapters} progress={scrollYProgress} />
      </div>
    </section>
  )
}

function Progress({ chapters, progress }: { chapters: Chapter[]; progress: MotionValue<number> }) {
  return (
    <nav aria-label="Collections in this story" className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
      {chapters.map((c, i) => (
        <ProgressItem key={c.key} chapter={c} index={i} count={chapters.length} progress={progress} />
      ))}
    </nav>
  )
}

function ProgressItem({ chapter, index, count, progress }: { chapter: Chapter; index: number; count: number; progress: MotionValue<number> }) {
  const start = 0.1 + ((1 - 0.1) / count) * index
  const span = (1 - 0.1) / count
  const opacity = useTransform(progress, [start - 0.02, start + span * 0.2, start + span * 0.8, start + span + 0.02], [0.35, 1, 1, 0.35])
  const width = useTransform(progress, [start, start + span * 0.2, start + span * 0.8, start + span], [12, 32, 32, 12])
  return (
    <motion.a href={chapter.href} style={{ opacity }} className="flex items-center justify-end gap-3 text-xs text-gilt">
      {chapter.name}
      <motion.span style={{ width }} className="h-px bg-gold" />
    </motion.a>
  )
}
