import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'The Tech Layoffs Report 2026 | CVin.Bio';
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
            The Tech Layoffs
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Report 2026
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>750K+</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>workers displaced</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>2,500+</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>companies</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>5.5mo</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>avg. job search</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>870</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>jobs lost per day</div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', width: '100%', height: 4, backgroundColor: '#09090b', borderRadius: 2 }} />
      </div>
    ),
    { ...size }
  );
}
