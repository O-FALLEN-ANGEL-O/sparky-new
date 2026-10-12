'use client'

import { ContactShadows } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Jewel, poseFor, type JewelSpec } from '@/components/three/designs'
import { StudioLighting } from '@/components/three/stage'

function Ready() {
  const { gl } = useThree()
  useEffect(() => {
    // give transmission/env passes a few frames, then signal the renderer script
    let n = 0
    let id = 0
    const tick = () => {
      n++
      if (n > 20) document.body.dataset.ready = '1'
      else id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [gl])
  return null
}

const BACKGROUNDS: Record<string, string> = {
  paper: 'radial-gradient(120% 90% at 50% 35%, #fffdf8 0%, #f1ece2 62%, #e3dccf 100%)',
  velvet: 'radial-gradient(110% 80% at 50% 40%, #2a211a 0%, #15110e 70%)',
}

export function StudioCanvas({ spec, angle, background }: { spec: JewelSpec; angle: number; background: string }) {
  const pose = poseFor(spec.design)
  const yaw = [0, 0.7, -0.75][angle] ?? 0
  const tilt = [0, 0.12, -0.08][angle] ?? 0
  return (
    <div style={{ position: 'fixed', inset: 0, background: BACKGROUNDS[background] ?? BACKGROUNDS.paper }}>
      <Canvas shadows dpr={1} camera={{ position: [0, 0.35, 4.4], fov: 35 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <StudioLighting mood={background === 'velvet' ? 'velvet' : 'light'} />
        <group rotation={[pose.rotation[0] + tilt, pose.rotation[1] + yaw, pose.rotation[2]]} scale={pose.scale} position={[0, pose.y + 0.15, 0]}>
          <Jewel {...spec} />
        </group>
        <ContactShadows position={[0, -1.3, 0]} opacity={background === 'velvet' ? 0.6 : 0.32} scale={8} blur={2.4} far={3} />
        <Ready />
      </Canvas>
    </div>
  )
}
