'use client'

import { Environment, Lightformer } from '@react-three/drei'

/**
 * Jeweller's light box built from softbox-shaped light cards (no HDR download),
 * so metals get long crisp highlights and stones pick up sparkle.
 */
export function StudioLighting({ warm = 1, mood = 'light' }: { warm?: number; mood?: 'light' | 'velvet' }) {
  return (
    <>
      <ambientLight intensity={mood === 'velvet' ? 0.15 : 0.35} />
      <directionalLight position={[3, 5, 4]} intensity={mood === 'velvet' ? 2.6 : 2} color="#fff6e6" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={0.9 * warm} color="#ffd9a0" />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={[mood === 'velvet' ? '#4a3b2e' : '#a89c8a']} />
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="rect" intensity={5} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={2.5} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[8, 2, 1]} />
          <Lightformer form="rect" intensity={2.5} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[8, 2, 1]} />
          <Lightformer form="rect" intensity={2} color="#ffe7c2" rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 2, 1]} />
          <Lightformer form="ring" intensity={4} color="#fff3d6" position={[6, 6, 4]} scale={4} onUpdate={(self) => self.lookAt(0, 0, 0)} />
          {/* dark flags give polished metal its contrast, like black cards in a jewellery shoot */}
          <Lightformer form="rect" intensity={1} color="#1a1410" position={[0, -6, 2]} rotation-x={-Math.PI / 2} scale={[20, 6, 1]} />
          <Lightformer form="rect" intensity={1} color="#2a211a" position={[-9, 0, 4]} rotation-y={Math.PI / 2} scale={[4, 10, 1]} />
        </group>
      </Environment>
    </>
  )
}
