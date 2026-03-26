import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TITRATE | MedTech Review',
    short_name: 'TITRATE',
    description: 'Premium MedTech Board Exam Review App with local-first spaced repetition.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b111a',
    theme_color: '#0b111a',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        label: 'TITRATE Laboratory Dashboard'
      }
    ],
    shortcuts: [
      {
        name: 'Active Assay',
        url: '/quiz',
        description: 'Start a new study session',
      },
      {
        name: 'Archives',
        url: '/library',
        description: 'View study protocols',
      },
    ],
  }
}
