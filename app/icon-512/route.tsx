import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 110,
          background: 'linear-gradient(135deg, #333654 0%, #00B1AE 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        {/* Triangle (tent) via CSS clip-path */}
        <div
          style={{
            width: 295,
            height: 215,
            background: 'rgba(255,255,255,0.95)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          }}
        />
        {/* Tent base */}
        <div
          style={{
            width: 120,
            height: 70,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 10,
            marginTop: -4,
          }}
        />
      </div>
    ),
    { width: 512, height: 512 }
  )
}
