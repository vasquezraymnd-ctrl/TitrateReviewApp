import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TITRATE | MedTech Review',
    short_name: 'TITRATE',
    description: 'Premium MedTech Board Exam Review App with local-first spaced repetition.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b111a',
    theme_color: '#00ff7f',
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
