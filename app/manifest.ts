import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'קייטנות חב"ד',
    short_name: 'קייטנות',
    description: 'מערכת ניהול קייטנות חב"ד',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#333654',
    theme_color: '#333654',
    orientation: 'portrait',
    lang: 'he',
    dir: 'rtl',
    icons: [
      {
        src: '/icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['education', 'productivity'],
  }
}
