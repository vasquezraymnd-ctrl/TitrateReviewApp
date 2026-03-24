import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'com.titrate.app',
    name: 'TITRATE | MedTech Review',
    short_name: 'TITRATE',
    description: 'Premium MedTech Board Exam Review App with local-first spaced repetition.',
    start_url: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    background_color: '#0b111a',
    theme_color: '#0b111a',
    orientation: 'portrait',
    categories: ['education', 'medical', 'productivity'],
    iarc_rating_id: 'e84c78b4-4d35-4db5-9f0b-479e563bc8fa',
    prefer_related_applications: false,
    related_applications: [],
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
        src: 'https://picsum.photos/seed/titrate1/1080/1920',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Laboratory Dashboard',
      },
      {
        src: 'https://picsum.photos/seed/titrate2/1920/1080',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Clinical Archives',
      },
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
