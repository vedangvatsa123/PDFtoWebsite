import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CVinBio — Turn Your CV into a Website';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#ffffff', color: '#09090b', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          <div style={{ fontSize: 130, fontWeight: 800, letterSpacing: '-0.05em', color: '#09090b' }}>
            📄 CVinBio
          </div>
          <div style={{ fontSize: 52, color: '#71717a', fontWeight: 500, letterSpacing: '-0.02em', maxWidth: 1000, textAlign: 'center' }}>
            Turn Your CV into a Professional Website
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 64, backgroundColor: '#f4f4f5', fontSize: 30, fontWeight: 800, color: '#52525b' }}>1</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#09090b' }}>Upload PDF</div>
            </div>
            
            <div style={{ fontSize: 40, color: '#d4d4d8', marginBottom: 20 }}>→</div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 64, backgroundColor: '#f4f4f5', fontSize: 30, fontWeight: 800, color: '#52525b' }}>2</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#09090b' }}>AI Generates Site</div>
            </div>
            
            <div style={{ fontSize: 40, color: '#d4d4d8', marginBottom: 20 }}>→</div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 64, backgroundColor: '#09090b', color: '#ffffff', fontSize: 30, fontWeight: 800 }}>3</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#09090b' }}>Share Your Link</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
