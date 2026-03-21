import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CVinBio | Turn Your CV into a Website';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'flex-start', 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#fcfcfc',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #ffffff 0%, #f4f4f5 100%)',
          color: '#09090b', 
          fontFamily: 'sans-serif',
          paddingTop: 60
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '0 80px', textAlign: 'center', width: '100%' }}>
          
          {/* Logo Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 24px', border: '1px solid #e4e4e7', borderRadius: 100, backgroundColor: '#ffffff', marginBottom: 20 }}>
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: '#52525b', letterSpacing: '0.1em' }}>
              CVin.Bio
            </div>
          </div>

          {/* Main Title */}
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, letterSpacing: '-0.04em', color: '#09090b', lineHeight: 1.1 }}>
            Turn Your CV into a Website.
          </div>

          {/* Expanded Notion-style App Window Mockup */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 1000, height: 430, marginTop: 40, border: '1px solid #e4e4e7', borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: '#ffffff', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05)' }}>
             
             {/* Browser Top Bar - Light Theme */}
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 48, width: '100%', backgroundColor: '#f4f4f5', borderBottom: '1px solid #e4e4e7' }}>
               {/* Mac Dots */}
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 80 }}>
                 <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 12, backgroundColor: '#ff5f56', border: '1px solid #e0443e' }} />
                 <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 12, backgroundColor: '#ffbd2e', border: '1px solid #dea123' }} />
                 <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 12, backgroundColor: '#27c93f', border: '1px solid #1aab29' }} />
               </div>
               
               {/* Address Bar */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 360, height: 28, backgroundColor: '#ffffff', borderRadius: 6, border: '1px solid #e4e4e7', color: '#52525b', fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                 <div style={{ display: 'flex', color: '#a1a1aa', marginRight: 6 }}>🔒</div> cvin.bio/johndoe
               </div>
               
               {/* Flex Spacer */}
               <div style={{ display: 'flex', width: 80 }} />
             </div>
             
             {/* Real Website Content inside Browser */}
             <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#ffffff' }}>
               <img src={`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://cvin.bio'}/homepage-screenshot.png`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
             </div>
             
          </div>

        </div>
      </div>
    ),
    { ...size }
  );
}
