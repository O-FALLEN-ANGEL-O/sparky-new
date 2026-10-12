'use client'

import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { Jewel, poseFor, type JewelSpec } from './designs'
import { StudioLighting } from './stage'

/** Interactive 3D view of one piece: drag to turn, scroll or pinch to zoom. */
export default function JewelViewer({ spec, className }: { spec: JewelSpec; className?: string }) {
  const pose = poseFor(spec.design)
  const [interacted, setInteracted] = useState(false)
  return (
    <div className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 4.6], fov: 35 }}
        gl={{ antialias: true, preserveDrawingBuffer: false }}
        onPointerDown={() => setInteracted(true)}
        aria-label="3D model of the piece. Drag to rotate, scroll to zoom."
      >
        <Suspense fallback={null}>
          <StudioLighting />
          <group rotation={pose.rotation} scale={pose.scale} position={[0, pose.y + 0.15, 0]}>
            <Jewel {...spec} />
          </group>
          <ContactShadows position={[0, -1.35, 0]} opacity={0.35} scale={8} blur={2.6} far={3} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2.6}
          maxDistance={7}
          autoRotate={!interacted}
          autoRotateSpeed={1.2}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
