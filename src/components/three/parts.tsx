'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// --------------------------------------------------------------- geometry

const geoCache = new Map<string, THREE.BufferGeometry>()
function memoGeo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key) as T | undefined
  if (!g) {
    g = make()
    geoCache.set(key, g)
  }
  return g
}

/**
 * Round brilliant profile (girdle radius 1): 56% table, ~15% crown, ~43% pavilion.
 * Lathed with few segments and flat-shaded so the facets catch light.
 */
export function brilliantGeometry(segments = 16) {
  return memoGeo(`brilliant:${segments}`, () => {
    const pts = [
      new THREE.Vector2(0.001, -0.86),
      new THREE.Vector2(1, -0.02),
      new THREE.Vector2(1, 0.03),
      new THREE.Vector2(0.56, 0.3),
      new THREE.Vector2(0.001, 0.3),
    ]
    const g = new THREE.LatheGeometry(pts, segments)
    g.computeVertexNormals()
    return g
  })
}

/** Low, flat-topped polki / rose-cut stone. */
export function polkiGeometry() {
  return memoGeo('polki', () => {
    const pts = [new THREE.Vector2(0.001, -0.15), new THREE.Vector2(1, -0.05), new THREE.Vector2(0.92, 0.12), new THREE.Vector2(0.001, 0.16)]
    return new THREE.LatheGeometry(pts, 10)
  })
}

export function cabochonGeometry() {
  return memoGeo('cabochon', () => new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2))
}

export function sphereGeometry(detail = 24) {
  return memoGeo(`sphere:${detail}`, () => new THREE.SphereGeometry(1, detail, Math.round(detail * 0.75)))
}

export function linkGeometry() {
  return memoGeo('link', () => new THREE.TorusGeometry(1, 0.28, 10, 24))
}

export function prongGeometry() {
  return memoGeo('prong', () => new THREE.CylinderGeometry(0.035, 0.05, 1, 8))
}

// ---------------------------------------------------------------- helpers

/** One draw call for many copies of a mesh. */
export function Instanced({
  geometry,
  material,
  matrices,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  matrices: THREE.Matrix4[]
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])
  if (!matrices.length) return null
  return <instancedMesh key={matrices.length} ref={ref} args={[geometry, material, matrices.length]} castShadow />
}

const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)

export function compose(position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3 | number) {
  const s = typeof scale === 'number' ? new THREE.Vector3(scale, scale, scale) : scale
  return new THREE.Matrix4().compose(position, quaternion, s)
}

/** Points along a curve with the local tangent. */
export function sample(curve: THREE.Curve<THREE.Vector3>, count: number, from = 0, to = 1) {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? (from + to) / 2 : from + ((to - from) * i) / (count - 1)
    return { t, p: curve.getPointAt(t), tangent: curve.getTangentAt(t).normalize() }
  })
}

/** A chain of interlocking oval links following a curve. */
export function Chain({
  curve,
  material,
  linkSize = 0.045,
  from = 0,
  to = 1,
}: {
  curve: THREE.Curve<THREE.Vector3>
  material: THREE.Material
  linkSize?: number
  from?: number
  to?: number
}) {
  const matrices = useMemo(() => {
    const length = curve.getLength() * (to - from)
    const count = Math.max(2, Math.floor(length / (linkSize * 1.55)))
    return sample(curve, count, from, to).map(({ p, tangent }, i) => {
      const q = new THREE.Quaternion().setFromUnitVectors(X, tangent)
      if (i % 2) q.multiply(new THREE.Quaternion().setFromAxisAngle(X, Math.PI / 2))
      return compose(p, q, new THREE.Vector3(linkSize * 1.25, linkSize * 0.8, linkSize))
    })
  }, [curve, linkSize, from, to])
  return <Instanced geometry={linkGeometry()} material={material} matrices={matrices} />
}

/** Stones placed along a curve, table facing `facing` (default: towards the camera). */
export function StonesAlong({
  curve,
  count,
  material,
  size,
  from = 0,
  to = 1,
  facing = new THREE.Vector3(0, 0, 1),
  geometry = brilliantGeometry(10),
}: {
  curve: THREE.Curve<THREE.Vector3>
  count: number
  material: THREE.Material
  size: number | ((t: number, i: number) => number)
  from?: number
  to?: number
  facing?: THREE.Vector3
  geometry?: THREE.BufferGeometry
}) {
  const matrices = useMemo(() => {
    const q = new THREE.Quaternion().setFromUnitVectors(Y, facing.clone().normalize())
    return sample(curve, count, from, to).map(({ p, t }, i) => compose(p, q, typeof size === 'number' ? size : size(t, i)))
  }, [curve, count, size, from, to, facing])
  return <Instanced geometry={geometry} material={material} matrices={matrices} />
}

/** A single faceted stone. `axis` is the direction the table faces. */
export function Stone({
  material,
  size,
  position = [0, 0, 0],
  axis = [0, 1, 0],
  stretch = [1, 1, 1],
  geometry = brilliantGeometry(),
}: {
  material: THREE.Material
  size: number
  position?: [number, number, number]
  axis?: [number, number, number]
  stretch?: [number, number, number]
  geometry?: THREE.BufferGeometry
}) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(Y, new THREE.Vector3(...axis).normalize()), [axis])
  return (
    <mesh geometry={geometry} material={material} position={position} quaternion={q} scale={[size * stretch[0], size * stretch[1], size * stretch[2]]} castShadow />
  )
}

/** Claw prongs holding a stone whose girdle sits at `y`, opening along +Y. */
export function Prongs({ material, radius, y, count = 6, height = 0.38 }: { material: THREE.Material; radius: number; y: number; count?: number; height?: number }) {
  const matrices = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.PI / count
        const top = new THREE.Vector3(Math.cos(a) * radius * 1.02, y + radius * 0.32, Math.sin(a) * radius * 1.02)
        const base = new THREE.Vector3(Math.cos(a) * radius * 0.35, y - height, Math.sin(a) * radius * 0.35)
        const dir = top.clone().sub(base)
        const mid = base.clone().add(dir.clone().multiplyScalar(0.5))
        const q = new THREE.Quaternion().setFromUnitVectors(Y, dir.clone().normalize())
        return compose(mid, q, new THREE.Vector3(1, dir.length(), 1))
      }),
    [count, radius, y, height],
  )
  return <Instanced geometry={prongGeometry()} material={material} matrices={matrices} />
}

/** U-shaped necklace drape seen from the front. */
export function necklaceCurve(width = 1.35, top = 1.25, bottom = -0.55, depth = 0.25) {
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-width, top, -depth),
      new THREE.Vector3(-width * 0.82, top * 0.35, 0),
      new THREE.Vector3(-width * 0.45, bottom * 0.75, depth * 0.6),
      new THREE.Vector3(0, bottom, depth),
      new THREE.Vector3(width * 0.45, bottom * 0.75, depth * 0.6),
      new THREE.Vector3(width * 0.82, top * 0.35, 0),
      new THREE.Vector3(width, top, -depth),
    ],
    false,
    'catmullrom',
    0.5,
  )
}

export function circleCurve(radius: number, tiltX = 0) {
  const pts = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2
    return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0).applyAxisAngle(X, tiltX)
  })
  return new THREE.CatmullRomCurve3(pts, true)
}

export function heartCurve(scale = 0.045) {
  const pts = Array.from({ length: 80 }, (_, i) => {
    const t = (i / 80) * Math.PI * 2
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    return new THREE.Vector3(x * scale, y * scale, 0)
  })
  return new THREE.CatmullRomCurve3(pts, true)
}
