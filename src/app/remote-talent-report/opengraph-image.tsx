import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'The Remote Talent Report 2026 | CVin.Bio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#fafafa',
          fontFamily: 'sans-serif',
          padding: '80px',
          justifyContent: 'space-between',
        }}
      >
        {/* Top label */}
        <div style={{ display: 'flex', fontSize: 16, fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
          CVin.Bio Research / March 2026
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            The Remote Talent
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Report 2026
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>27%</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>fully remote</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>52%</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>hybrid</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>$12K</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>saved per employee</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>3x</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>larger candidate pool</div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', width: '100%', height: 4, backgroundColor: '#09090b', borderRadius: 2 }} />
      </div>
    ),
    { ...size }
  );
}
