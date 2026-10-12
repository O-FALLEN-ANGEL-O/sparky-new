import type { MetadataRoute } from 'next'

/** Lets phones add Sparkle to the home screen with its own icon and colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sparkle — Fine jewellery',
    short_name: 'Sparkle',
    description: 'Hallmarked gold, certified diamonds and heirloom temple jewellery from Mangaluru.',
    start_url: '/',
    display: 'standalone',
    background_color: '#17110D',
    theme_color: '#17110D',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
