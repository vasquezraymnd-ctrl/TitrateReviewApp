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
    display_override: ['window-controls-overlay', 'tabbed', 'standalone', 'minimal-ui'],
    background_color: '#0b111a',
    theme_color: '#0b111a',
    orientation: 'portrait',
    categories: ['education', 'medical', 'productivity'],
    iarc_rating_id: 'e84c78b4-4d35-4db5-9f0b-479e563bc8fa',
    prefer_related_applications: false,
    related_applications: [],
    // @ts-ignore - Advanced PWA properties
    scope_extensions: [
      { origin: "*.titrate.app" }
    ],
    // @ts-ignore - Edge sidebar support
    edge_side_panel: {
      preferred_width: 480
    },
    // @ts-ignore - Note taking integration
    note_handler: {
      new_note_url: "/library"
    },
    screenshots: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        // @ts-ignore
        form_factor: 'wide',
        label: 'TITRATE Laboratory Dashboard'
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        // @ts-ignore
        form_factor: 'narrow',
        label: 'Active Assay Interface'
      }
    ],
    // @ts-ignore - Widget support
    widgets: [
      {
        name: "TITRATE Lab Status",
        description: "Monitor your clinical streak and upcoming assays.",
        tag: "lab-widget",
        template: "lab-status",
        ms_ac_template: "lab-status.json",
        data: "lab-status-data.json",
        type: "application/json",
        icons: [
          {
            src: '/icon',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: '/icon',
            sizes: '512x512',
            type: 'image/png',
            label: 'Laboratory status widget'
          }
        ]
      }
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
    // @ts-ignore
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
