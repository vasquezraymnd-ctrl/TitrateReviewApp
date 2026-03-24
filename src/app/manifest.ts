import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'com.titrate.app',
    name: 'TITRATE | MedTech Review',
    short_name: 'TITRATE',
    description: 'Premium MedTech Board Exam Review App with local-first spaced repetition.',
    start_url: '/',
    scope: '/',
    lang: 'en-US',
    dir: 'ltr',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    background_color: '#0b111a',
    theme_color: '#0b111a',
    orientation: 'portrait',
    categories: ['education', 'medical', 'productivity'],
    iarc_rating_id: 'e84c78b4-4d35-4db5-9f0b-479e563bc8fa',
    prefer_related_applications: false,
    related_applications: [],
    // @ts-ignore - scope_extensions is required for some PWABuilder checks
    scope_extensions: [
      { origin: "*.titrate.app" }
    ],
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
    // @ts-ignore - Advanced native properties
    file_handlers: [
      {
        action: '/library',
        accept: {
          'application/pdf': ['.pdf']
        }
      }
    ],
    // @ts-ignore
    launch_handler: {
      client_mode: 'focus-existing'
    },
    // @ts-ignore
    protocol_handlers: [
      {
        protocol: 'web+titrate',
        url: '/dashboard?protocol=%s'
      }
    ],
    // @ts-ignore
    share_target: {
      action: '/library',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url'
      }
    }
  } as any
}
