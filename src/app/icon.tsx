import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 340,
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
          position: 'relative',
        }}
      >
        {/* Stylized background glow */}
        <div 
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'rgba(0, 255, 127, 0.1)',
            filter: 'blur(50px)',
            borderRadius: '50%',
          }}
        />
        {/* The 'T' with a test-tube aesthetic */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          T
        </div>
        {/* Tactical border accents */}
        <div style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 4, background: '#00ff7f' }} />
        <div style={{ position: 'absolute', top: 20, left: 20, width: 4, height: 60, background: '#00ff7f' }} />
        <div style={{ position: 'absolute', bottom: 20, right: 20, width: 60, height: 4, background: '#00ff7f' }} />
        <div style={{ position: 'absolute', bottom: 20, right: 20, width: 4, height: 60, background: '#00ff7f' }} />
      </div>
    ),
    {
      ...size,
    }
  )
}
