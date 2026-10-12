'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

/** next/image with a graceful fallback for pieces whose studio photos haven’t been rendered yet. */
export function JewelImage(props: ImageProps) {
  const [failed, setFailed] = useState(false)
  return <Image {...props} src={failed ? '/placeholder-jewel.svg' : props.src} unoptimized={failed || props.unoptimized} onError={() => setFailed(true)} alt={props.alt} />
}
