import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          borderRadius: 40,
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
            width: 110,
            height: 80,
            background: 'rgba(255,255,255,0.95)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          }}
        />
        {/* Tent base */}
        <div
          style={{
            width: 46,
            height: 26,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 4,
            marginTop: -2,
          }}
        />
      </div>
    ),
    { width: 192, height: 192 }
  )
}
