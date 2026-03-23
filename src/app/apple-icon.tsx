import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: '#0b111a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00ff7f',
          fontWeight: 900,
          fontStyle: 'italic',
          letterSpacing: '-0.05em',
        }}
      >
        T
      </div>
    ),
    {
      ...size,
    }
  )
}
