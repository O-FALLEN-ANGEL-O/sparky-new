'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { enamelMaterial, facetedMetal, gemMaterial, metalMaterial, type Gem, type Metal } from './materials'
import {
  Chain,
  Instanced,
  Prongs,
  Stone,
  StonesAlong,
  brilliantGeometry,
  cabochonGeometry,
  circleCurve,
  compose,
  heartCurve,
  necklaceCurve,
  polkiGeometry,
  sample,
  sphereGeometry,
} from './parts'

export type Design =
  | 'solitaire' | 'cocktail' | 'halo' | 'band' | 'eternity'
  | 'temple' | 'riviere' | 'pearl_strand' | 'drop_necklace'
  | 'heart' | 'medallion' | 'teardrop' | 'evil_eye'
  | 'chandbali' | 'stud' | 'jhumka' | 'drop_earring'
  | 'tennis' | 'link' | 'charm'
  | 'kangan' | 'kada' | 'studded_bangle' | 'oxidised_bangle'

export interface JewelSpec {
  design: Design
  metal: Metal
  gem: Gem
}

const Z = new THREE.Vector3(0, 0, 1)
const stoneGem = (g: Gem): Exclude<Gem, 'none' | 'pearl'> => (g === 'none' || g === 'pearl' ? 'diamond' : g)

// ------------------------------------------------------------------ rings

function Band({ metal, width = 1.7, radius = 1, tube = 0.085, faceted = false }: { metal: Metal; width?: number; radius?: number; tube?: number; faceted?: boolean }) {
  const geo = useMemo(() => new THREE.TorusGeometry(radius, tube, faceted ? 8 : 24, faceted ? 48 : 128), [radius, tube, faceted])
  return <mesh geometry={geo} material={faceted ? facetedMetal(metal) : metalMaterial(metal)} scale={[1, 1, width]} castShadow />
}

/** Pavé stones following the top arc of a ring band. */
function Pave({ gem, count, arc = 0.5, radius = 1.09, size = 0.045 }: { gem: Gem; count: number; arc?: number; radius?: number; size?: number }) {
  const matrices = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = Math.PI / 2 + (i / (count - 1) - 0.5) * Math.PI * arc
        const n = new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
        return compose(n.clone().multiplyScalar(radius), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n), size)
      }),
    [count, arc, radius, size],
  )
  return <Instanced geometry={brilliantGeometry(8)} material={gemMaterial(stoneGem(gem), 'accent')} matrices={matrices} />
}

function Ring({ design, metal, gem }: JewelSpec) {
  const m = metalMaterial(metal)
  const R = 1
  if (design === 'band') {
    return (
      <group>
        <Band metal={metal} width={2.6} tube={0.1} />
        <mesh material={metalMaterial(metal, 'satin')} scale={[1, 1, 0.25]}>
          <torusGeometry args={[R + 0.07, 0.03, 12, 128]} />
        </mesh>
      </group>
    )
  }
  if (design === 'eternity') {
    const matrices = Array.from({ length: 30 }, (_, i) => {
      const a = (i / 30) * Math.PI * 2
      const n = new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
      return compose(n.clone().multiplyScalar(R + 0.085), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n), 0.075)
    })
    return (
      <group>
        <Band metal={metal} width={1.9} />
        <Instanced geometry={brilliantGeometry(8)} material={gemMaterial(stoneGem(gem), 'accent')} matrices={matrices} />
      </group>
    )
  }
  const top = R + 0.08
  if (design === 'cocktail') {
    const size = 0.42
    return (
      <group>
        <Band metal={metal} width={2.1} tube={0.095} />
        <mesh material={m} position={[0, top + 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.26, 0.2, 32]} />
        </mesh>
        <Stone material={gemMaterial(stoneGem(gem))} size={size} position={[0, top + 0.34, 0]} geometry={brilliantGeometry(8)} />
        <StonesAlong
          curve={circleCurveY(0.47, top + 0.2)}
          count={16}
          size={0.05}
          material={gemMaterial('diamond', 'accent')}
          facing={new THREE.Vector3(0, 1, 0)}
          from={0}
          to={0.94}
        />
        <Prongs material={m} radius={size} y={top + 0.3} count={4} height={0.18} />
      </group>
    )
  }
  // solitaire and halo
  const size = design === 'halo' ? 0.24 : 0.32
  const y = top + (design === 'halo' ? 0.26 : 0.36)
  return (
    <group>
      <Band metal={metal} width={1.6} tube={0.075} />
      <Prongs material={m} radius={size} y={y} count={design === 'halo' ? 4 : 6} height={design === 'halo' ? 0.22 : 0.34} />
      <Stone material={gemMaterial(stoneGem(gem))} size={size} position={[0, y, 0]} />
      {design === 'halo' && (
        <>
          <StonesAlong curve={circleCurveY(0.33, y - 0.02)} count={16} size={0.048} material={gemMaterial('diamond', 'accent')} facing={new THREE.Vector3(0, 1, 0)} from={0} to={0.94} />
          <mesh material={m} position={[0, y - 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.33, 0.035, 10, 48]} />
          </mesh>
          <Pave gem="diamond" count={18} arc={0.42} radius={R + 0.07} size={0.04} />
        </>
      )}
    </group>
  )
}

function circleCurveY(radius: number, y: number) {
  const pts = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2
    return new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius)
  })
  return new THREE.CatmullRomCurve3(pts, true)
}

// -------------------------------------------------------------- necklaces

function Necklace({ design, metal, gem }: JewelSpec) {
  const m = metalMaterial(metal)
  const curve = useMemo(() => necklaceCurve(), [])
  if (design === 'pearl_strand') {
    const strands = [necklaceCurve(1.2, 1.25, -0.25, 0.2), necklaceCurve(1.27, 1.25, -0.45, 0.24), necklaceCurve(1.34, 1.25, -0.65, 0.28)]
    return (
      <group>
        {strands.map((c, i) => {
          const pts = sample(c, 46 + i * 4, 0.05, 0.95)
          const matrices = pts.map(({ p }) => compose(p, new THREE.Quaternion(), 0.062))
          return <Instanced key={i} geometry={sphereGeometry(20)} material={gemMaterial('pearl')} matrices={matrices} />
        })}
      </group>
    )
  }
  if (design === 'riviere') {
    return (
      <group>
        <Chain curve={curve} material={m} linkSize={0.03} />
        <StonesAlong
          curve={curve}
          count={29}
          from={0.16}
          to={0.84}
          material={gemMaterial('diamond', 'accent')}
          size={(t) => 0.04 + 0.055 * Math.max(0, 1 - Math.abs(t - 0.5) * 2.6)}
        />
      </group>
    )
  }
  if (design === 'temple') {
    const coins = sample(curve, 15, 0.2, 0.8)
    return (
      <group>
        <Chain curve={curve} material={m} linkSize={0.04} />
        {coins.map(({ p }, i) => {
          const center = i === 7
          const r = center ? 0.22 : 0.13
          return (
            <group key={i} position={[p.x, p.y - r * 0.9, p.z + 0.02]}>
              <mesh material={m} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[r, r, 0.035, 32]} />
              </mesh>
              <mesh material={m} position={[0, 0, 0.02]}>
                <torusGeometry args={[r * 0.82, 0.012, 8, 40]} />
              </mesh>
              <mesh geometry={cabochonGeometry()} material={gemMaterial(gem === 'none' ? 'ruby' : stoneGem(gem), center ? 'hero' : 'accent')} position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={center ? 0.1 : 0.055} />
            </group>
          )
        })}
      </group>
    )
  }
  // drop_necklace
  const drops = sample(curve, 5, 0.38, 0.62)
  return (
    <group>
      <Chain curve={curve} material={m} linkSize={0.035} />
      {drops.map(({ p }, i) => {
        const big = i === 2
        const s = big ? 0.2 : 0.13
        return (
          <group key={i} position={[p.x, p.y - s * 1.6, p.z + 0.03]}>
            <mesh material={m} position={[0, s * 1.35, 0]}>
              <torusGeometry args={[0.03, 0.01, 6, 16]} />
            </mesh>
            <Stone material={gemMaterial(stoneGem(gem), big ? 'hero' : 'accent')} size={s} axis={[0, 0, 1]} stretch={[0.8, 0.35, 1.25]} />
          </group>
        )
      })}
    </group>
  )
}

// --------------------------------------------------------------- pendants

function Pendant({ design, metal, gem }: JewelSpec) {
  const m = metalMaterial(metal)
  const chain = useMemo(() => necklaceCurve(1.0, 1.6, 0.55, 0.15), [])
  let body: React.ReactNode
  if (design === 'heart') {
    const hc = heartCurve(0.045)
    body = (
      <group position={[0, -0.05, 0]}>
        <mesh material={m} castShadow>
          <tubeGeometry args={[hc, 160, 0.05, 12, true]} />
        </mesh>
        <StonesAlong curve={hc} count={18} from={0.04} to={0.46} size={0.045} material={gemMaterial(stoneGem(gem), 'accent')} />
      </group>
    )
  } else if (design === 'medallion') {
    body = (
      <group>
        <mesh material={m} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.06, 64]} />
        </mesh>
        <mesh material={m} position={[0, 0, 0.035]}>
          <torusGeometry args={[0.5, 0.03, 12, 64]} />
        </mesh>
        <mesh material={metalMaterial(metal, 'satin')} position={[0, 0, 0.032]}>
          <circleGeometry args={[0.46, 64]} />
        </mesh>
        {/* raised crescent and bindu */}
        <mesh material={m} position={[0.08, 0.16, 0.045]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.14, 0.03, 10, 32, Math.PI]} />
        </mesh>
        <mesh material={m} position={[0.08, 0.27, 0.05]} scale={0.04}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh material={m} position={[-0.08, -0.08, 0.045]}>
          <torusGeometry args={[0.2, 0.035, 10, 48, Math.PI * 1.5]} />
        </mesh>
      </group>
    )
  } else if (design === 'evil_eye') {
    body = (
      <group>
        <mesh material={m} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.05, 48]} />
        </mesh>
        <mesh material={enamelMaterial('#1f4fb8')} position={[0, 0, 0.028]}>
          <circleGeometry args={[0.3, 48]} />
        </mesh>
        <mesh material={enamelMaterial('#f4f2ec')} position={[0, 0, 0.03]}>
          <circleGeometry args={[0.2, 48]} />
        </mesh>
        <Stone material={gemMaterial(stoneGem(gem))} size={0.13} position={[0, 0, 0.05]} axis={[0, 0, 1]} />
        <StonesAlong curve={circleCurve(0.33)} count={20} to={0.95} size={0.03} material={gemMaterial('diamond', 'accent')} />
      </group>
    )
  } else {
    // teardrop
    body = (
      <group>
        <mesh material={m} scale={[1, 1.45, 1]} position={[0, -0.02, 0]}>
          <torusGeometry args={[0.3, 0.04, 12, 64]} />
        </mesh>
        <Stone material={gemMaterial(stoneGem(gem))} size={0.3} position={[0, -0.02, 0.02]} axis={[0, 0, 1]} stretch={[0.95, 0.4, 1.4]} />
      </group>
    )
  }
  return (
    <group>
      <Chain curve={chain} material={m} linkSize={0.03} from={0.08} to={0.92} />
      <mesh material={m} position={[0, 0.66, 0.15]}>
        <torusGeometry args={[0.07, 0.02, 8, 24]} />
      </mesh>
      <group position={[0, 0.05, 0.15]}>{body}</group>
    </group>
  )
}

// --------------------------------------------------------------- earrings

function Earring({ design, metal, gem }: JewelSpec) {
  const m = metalMaterial(metal)
  if (design === 'stud') {
    return (
      <group rotation={[Math.PI / 2 - 0.55, 0, 0]}>
        <Stone material={gemMaterial(stoneGem(gem), 'accent')} size={0.32} geometry={brilliantGeometry(12)} />
        <Prongs material={m} radius={0.32} y={0} count={4} height={0.3} />
        <mesh material={m} position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.025, 8, 32]} />
        </mesh>
        <mesh material={m} position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        </mesh>
      </group>
    )
  }
  if (design === 'jhumka') {
    const bell = new THREE.LatheGeometry(
      [new THREE.Vector2(0.03, 0.3), new THREE.Vector2(0.14, 0.26), new THREE.Vector2(0.28, 0.1), new THREE.Vector2(0.36, -0.12), new THREE.Vector2(0.38, -0.18)],
      48,
    )
    const beads = sample(circleCurveY(0.38, -0.24), 18, 0, 0.95).map(({ p }) => compose(p, new THREE.Quaternion(), 0.035))
    return (
      <group>
        <Stone material={gemMaterial(stoneGem(gem))} size={0.17} position={[0, 0.72, 0]} axis={[0, 0, 1]} geometry={cabochonGeometry()} />
        <mesh material={m} position={[0, 0.72, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 32]} />
        </mesh>
        <mesh material={m} position={[0, 0.48, 0]}>
          <torusGeometry args={[0.05, 0.015, 8, 20]} />
        </mesh>
        <mesh geometry={bell} material={metalMaterial(metal, 'polished', true)} castShadow />
        <Instanced geometry={sphereGeometry(12)} material={m} matrices={beads} />
      </group>
    )
  }
  if (design === 'chandbali') {
    const crescent = new THREE.Shape()
    // outer edge sweeps under the bottom; inner edge returns higher, so the moon is thick at the base
    crescent.absarc(0, 0, 0.5, Math.PI, 0, false)
    crescent.absarc(0, 0.12, 0.34, 0, Math.PI, true)
    const geo = new THREE.ExtrudeGeometry(crescent, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 3, curveSegments: 48 })
    const rim = new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => {
      const a = Math.PI + (i / 29) * Math.PI
      return new THREE.Vector3(Math.cos(a) * 0.57, Math.sin(a) * 0.57, 0.03)
    }))
    const pearls = sample(rim, 13).map(({ p }) => compose(p, new THREE.Quaternion(), 0.055))
    return (
      <group position={[0, 0.1, 0]}>
        <mesh geometry={geo} material={metalMaterial(metal, 'satin')} castShadow />
        {/* fine wire closing the moon at the top, where the stud attaches */}
        <mesh material={m} position={[0, 0.08, 0.025]}>
          <torusGeometry args={[0.42, 0.016, 8, 48, Math.PI]} />
        </mesh>
        <Instanced geometry={sphereGeometry(16)} material={gemMaterial('pearl')} matrices={pearls} />
        <mesh material={m} position={[0, 0.56, 0.02]}>
          <torusGeometry args={[0.06, 0.018, 8, 24]} />
        </mesh>
        <Stone material={gemMaterial(gem === 'pearl' || gem === 'none' ? 'ruby' : gem, 'accent')} size={0.1} position={[0, 0.7, 0.03]} axis={[0, 0, 1]} geometry={cabochonGeometry()} />
      </group>
    )
  }
  // drop_earring
  const hook = <mesh material={m} position={[0, 0.82, -0.05]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.16, 0.018, 8, 32, Math.PI * 1.2]} /></mesh>
  return (
    <group>
      {hook}
      <Stone material={gemMaterial('diamond', 'accent')} size={0.08} position={[0, 0.62, 0]} axis={[0, 0, 1]} />
      <mesh material={m} position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
      </mesh>
      <mesh material={m} position={[0, 0, -0.01]} scale={[1, 1.35, 1]}>
        <torusGeometry args={[0.22, 0.025, 10, 48]} />
      </mesh>
      <Stone material={gemMaterial(stoneGem(gem))} size={0.22} axis={[0, 0, 1]} stretch={[0.95, 0.45, 1.35]} />
    </group>
  )
}

// ------------------------------------------------------- bracelets/bangles

function Bracelet({ design, metal, gem }: JewelSpec) {
  const m = metalMaterial(metal)
  const curve = useMemo(() => circleCurve(1.05), [])
  if (design === 'tennis') {
    const pts = sample(curve, 44, 0, 0.977)
    const stones = pts.map(({ p }) => compose(p.clone().setZ(0.035), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), Z), 0.068))
    const boxes = pts.map(({ p, tangent }) => compose(p.clone().setZ(-0.01), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent), new THREE.Vector3(0.12, 0.1, 0.04)))
    return (
      <group>
        <Instanced geometry={new THREE.BoxGeometry(1, 1, 1)} material={m} matrices={boxes} />
        <Instanced geometry={brilliantGeometry(10)} material={gemMaterial(stoneGem(gem), 'accent')} matrices={stones} />
      </group>
    )
  }
  if (design === 'charm') {
    const charms = sample(curve, 5, 0.55, 0.95)
    return (
      <group>
        <Chain curve={curve} material={m} linkSize={0.06} />
        {charms.map(({ p }, i) => (
          <group key={i} position={[p.x * 1.09, p.y * 1.09, 0.03]}>
            {i % 2 ? (
              <mesh material={m} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.03, 24]} />
              </mesh>
            ) : (
              <mesh material={m} scale={[0.1, 0.1, 0.05]}>
                <octahedronGeometry args={[1, 0]} />
              </mesh>
            )}
          </group>
        ))}
      </group>
    )
  }
  return <Chain curve={curve} material={m} linkSize={0.11} />
}

function Bangle({ design, metal, gem }: JewelSpec) {
  const R = 1.1
  if (design === 'kada') {
    const rows = [-0.13, 0, 0.13]
    const matrices = rows.flatMap((z, r) =>
      Array.from({ length: 22 }, (_, i) => {
        const a = ((i + (r % 2) * 0.5) / 22) * Math.PI * 2
        const n = new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
        return compose(n.clone().multiplyScalar(R + 0.075).setZ(z), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n), 0.062)
      }),
    )
    const cups = matrices.map((mx) => {
      const p = new THREE.Vector3()
      const q = new THREE.Quaternion()
      mx.decompose(p, q, new THREE.Vector3())
      return compose(p.multiplyScalar(0.985), q, new THREE.Vector3(0.075, 0.03, 0.075))
    })
    return (
      <group>
        <mesh material={metalMaterial(metal, 'polished', true)} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[R + 0.05, R + 0.05, 0.42, 96, 1, true]} />
        </mesh>
        <mesh material={metalMaterial(metal)} position={[0, 0, 0.21]}>
          <torusGeometry args={[R + 0.05, 0.03, 10, 96]} />
        </mesh>
        <mesh material={metalMaterial(metal)} position={[0, 0, -0.21]}>
          <torusGeometry args={[R + 0.05, 0.03, 10, 96]} />
        </mesh>
        <Instanced geometry={new THREE.CylinderGeometry(1, 0.85, 1, 16)} material={metalMaterial(metal)} matrices={cups} />
        <Instanced geometry={polkiGeometry()} material={gemMaterial(stoneGem(gem), 'accent')} matrices={matrices} />
      </group>
    )
  }
  if (design === 'oxidised_bangle') {
    const bumps = [0.11, -0.11].flatMap((z) =>
      Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2
        return compose(new THREE.Vector3(Math.cos(a) * (R + 0.09), Math.sin(a) * (R + 0.09), z), new THREE.Quaternion(), 0.035)
      }),
    )
    return (
      <group>
        <Band metal="silver" radius={R} tube={0.1} width={1.8} faceted />
        <mesh material={metalMaterial('silver', 'oxidised')} scale={[1, 1, 1.9]}>
          <torusGeometry args={[R, 0.096, 8, 48]} />
        </mesh>
        <Instanced geometry={sphereGeometry(10)} material={metalMaterial('silver')} matrices={bumps} />
      </group>
    )
  }
  if (design === 'studded_bangle') {
    const matrices = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2
      const n = new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
      return compose(n.clone().multiplyScalar(R + 0.1), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n), 0.1)
    })
    const bezels = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2
      const n = new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
      return compose(n.clone().multiplyScalar(R + 0.07), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n), new THREE.Vector3(0.12, 0.05, 0.12))
    })
    return (
      <group>
        <Band metal={metal} radius={R} tube={0.09} width={1.6} />
        <Instanced geometry={new THREE.CylinderGeometry(1, 1, 1, 24)} material={metalMaterial(metal)} matrices={bezels} />
        <Instanced geometry={brilliantGeometry(8)} material={gemMaterial(stoneGem(gem), 'accent')} matrices={matrices} />
      </group>
    )
  }
  // kangan: diamond-cut faceted gold with fine rims
  return (
    <group>
      <Band metal={metal} radius={R} tube={0.11} width={1.7} faceted />
      <mesh material={metalMaterial(metal)} position={[0, 0, 0.17]}>
        <torusGeometry args={[R + 0.02, 0.025, 10, 96]} />
      </mesh>
      <mesh material={metalMaterial(metal)} position={[0, 0, -0.17]}>
        <torusGeometry args={[R + 0.02, 0.025, 10, 96]} />
      </mesh>
    </group>
  )
}

// ------------------------------------------------------------------ jewel

const RING_DESIGNS: Design[] = ['solitaire', 'cocktail', 'halo', 'band', 'eternity']
const NECKLACE: Design[] = ['temple', 'riviere', 'pearl_strand', 'drop_necklace']
const PENDANT: Design[] = ['heart', 'medallion', 'teardrop', 'evil_eye']
const EARRINGS: Design[] = ['chandbali', 'stud', 'jhumka', 'drop_earring']
const BRACELET: Design[] = ['tennis', 'link', 'charm']

/** Default presentation pose for each kind of piece. */
export function poseFor(design: Design): { rotation: [number, number, number]; scale: number; y: number } {
  if (RING_DESIGNS.includes(design)) return { rotation: [-0.42, -0.55, 0], scale: 0.82, y: -0.2 }
  if (NECKLACE.includes(design)) return { rotation: [0.15, 0, 0], scale: 1.05, y: -0.3 }
  if (PENDANT.includes(design)) return { rotation: [0.1, 0, 0], scale: 1.15, y: -0.45 }
  if (EARRINGS.includes(design)) return { rotation: [0.05, 0.15, 0], scale: 1.1, y: -0.2 }
  if (BRACELET.includes(design)) return { rotation: [-1.05, 0, 0.2], scale: 1.05, y: 0 }
  return { rotation: [-0.5, -0.45, 0], scale: 0.95, y: 0 } // bangles
}

export function Jewel({ design, metal, gem }: JewelSpec) {
  const spec = { design, metal, gem }
  if (RING_DESIGNS.includes(design)) return <Ring {...spec} />
  if (NECKLACE.includes(design)) return <Necklace {...spec} />
  if (PENDANT.includes(design)) return <Pendant {...spec} />
  if (EARRINGS.includes(design)) {
    return (
      <group>
        <group position={[-0.62, 0, 0]} rotation={[0, 0.25, 0]}>
          <Earring {...spec} />
        </group>
        <group position={[0.62, 0, 0]} rotation={[0, -0.25, 0]}>
          <Earring {...spec} />
        </group>
      </group>
    )
  }
  if (BRACELET.includes(design)) return <Bracelet {...spec} />
  return <Bangle {...spec} />
}
