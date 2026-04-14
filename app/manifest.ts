import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'FlyBack',
    short_name:       'FlyBack',
    description:      'Global flight compensation. Claim what you\'re owed.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#001529',
    theme_color:      '#003366',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
