import * as THREE from 'three'

export type Metal = 'yellow_gold' | 'rose_gold' | 'white_gold' | 'platinum' | 'silver'
export type Gem = 'diamond' | 'emerald' | 'ruby' | 'sapphire' | 'pearl' | 'none'

const METAL: Record<Metal, { color: string; roughness: number }> = {
  yellow_gold: { color: '#e7b95e', roughness: 0.16 },
  rose_gold: { color: '#e9a789', roughness: 0.18 },
  white_gold: { color: '#e8e6e1', roughness: 0.14 },
  platinum: { color: '#d8d8d6', roughness: 0.12 },
  silver: { color: '#dcdee2', roughness: 0.2 },
}

const GEM: Record<Exclude<Gem, 'none' | 'pearl'>, { color: string; ior: number; attenuation: string }> = {
  diamond: { color: '#ffffff', ior: 2.42, attenuation: '#ffffff' },
  emerald: { color: '#19a066', ior: 1.58, attenuation: '#0a6b43' },
  ruby: { color: '#d4153a', ior: 1.77, attenuation: '#8e0a24' },
  sapphire: { color: '#2b4fd1', ior: 1.77, attenuation: '#14287a' },
}

const cache = new Map<string, THREE.Material>()
function memo<T extends THREE.Material>(key: string, make: () => T): T {
  let m = cache.get(key) as T | undefined
  if (!m) {
    m = make()
    cache.set(key, m)
  }
  return m
}

export function metalMaterial(metal: Metal, variant: 'polished' | 'oxidised' | 'satin' = 'polished', doubleSided = false) {
  return memo(`metal:${metal}:${variant}:${doubleSided}`, () => {
    const spec = METAL[metal]
    return new THREE.MeshStandardMaterial({
      side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      color: variant === 'oxidised' ? '#7d7f84' : spec.color,
      metalness: 1,
      roughness: variant === 'oxidised' ? 0.42 : variant === 'satin' ? spec.roughness + 0.18 : spec.roughness,
      envMapIntensity: 1.35,
    })
  })
}

/** Faceted metal for diamond-cut bangles: flat shading turns low-poly geometry into crisp facets. */
export function facetedMetal(metal: Metal) {
  return memo(`facet:${metal}`, () => {
    const m = metalMaterial(metal).clone()
    m.flatShading = true
    return m
  })
}

/**
 * Large centre stones use real transmission + dispersion (expensive, so only a few per scene).
 * Small accent stones use a cheap faceted mirror look, which reads as sparkle at small sizes.
 */
export function gemMaterial(gem: Exclude<Gem, 'none'>, quality: 'hero' | 'accent' = 'hero') {
  return memo(`gem:${gem}:${quality}`, () => {
    if (gem === 'pearl') {
      return new THREE.MeshPhysicalMaterial({
        color: '#e9dfcf',
        roughness: 0.22,
        metalness: 0,
        sheen: 1,
        sheenColor: new THREE.Color('#ffe6ef'),
        sheenRoughness: 0.4,
        iridescence: 0.55,
        iridescenceIOR: 1.6,
        clearcoat: 0.7,
        clearcoatRoughness: 0.15,
        envMapIntensity: 1.1,
      })
    }
    const spec = GEM[gem]
    if (gem !== 'diamond' && quality === 'hero') {
      // Coloured stones read better as saturated, glossy facets than as transmissive glass.
      return new THREE.MeshPhysicalMaterial({
        color: spec.color,
        metalness: 0.2,
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.6,
        flatShading: true,
      })
    }
    if (quality === 'accent') {
      return new THREE.MeshStandardMaterial({
        color: gem === 'diamond' ? '#e8edf4' : spec.color,
        metalness: gem === 'diamond' ? 0.55 : 0.15,
        roughness: 0.02,
        envMapIntensity: gem === 'diamond' ? 3.2 : 2.2,
        flatShading: true,
      })
    }
    return new THREE.MeshPhysicalMaterial({
      color: spec.color,
      metalness: 0,
      roughness: 0,
      transmission: 1,
      thickness: 1.1,
      ior: spec.ior,
      dispersion: gem === 'diamond' ? 5 : 1.5,
      attenuationColor: new THREE.Color(spec.attenuation),
      attenuationDistance: gem === 'diamond' ? 10 : 0.6,
      specularIntensity: 1,
      clearcoat: 1,
      envMapIntensity: 2.4,
      flatShading: true,
    })
  })
}

export function enamelMaterial(color: string) {
  return memo(`enamel:${color}`, () => new THREE.MeshPhysicalMaterial({ color, roughness: 0.15, clearcoat: 1, metalness: 0.1 }))
}
