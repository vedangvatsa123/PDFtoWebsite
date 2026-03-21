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
          backgroundColor: '#000000', 
          backgroundImage: 'radial-gradient(circle at 50% 0%, #27272a 0%, #000000 70%)',
          color: '#ffffff', 
          fontFamily: 'sans-serif',
          paddingTop: 80
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '0 80px', textAlign: 'center', width: '100%' }}>
          
          {/* Logo Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 32px', border: '1px solid #27272a', borderRadius: 100, backgroundColor: 'rgba(24, 24, 27, 0.5)', marginBottom: 32 }}>
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#e4e4e7', letterSpacing: '0.15em' }}>
              CVin.Bio
            </div>
          </div>

          {/* Main Title */}
          <div style={{ display: 'flex', fontSize: 88, fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff', lineHeight: 1.1, marginBottom: 24 }}>
            Turn Your CV into a Website.
          </div>
          
          {/* Subtitle */}
          <div style={{ display: 'flex', fontSize: 30, color: '#a1a1aa', fontWeight: 500, letterSpacing: '-0.01em', maxWidth: 1040, lineHeight: 1.4, textAlign: 'center', whiteSpace: 'nowrap' }}>
            AI converts your PDF CV into a stunning, shareable personal portfolio in seconds.
          </div>

          {/* App Window Mockup Graphic */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 920, height: 380, marginTop: 60, border: '1px solid #3f3f46', borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: '#09090b', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>
             
             {/* Browser Top Bar */}
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 50, width: '100%', backgroundColor: '#18181b', borderBottom: '1px solid #27272a' }}>
               {/* Mac Dots */}
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 80 }}>
                 <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 12, backgroundColor: '#ff5f56' }} />
                 <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 12, backgroundColor: '#ffbd2e' }} />
                 <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 12, backgroundColor: '#27c93f' }} />
               </div>
               
               {/* Address Bar */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 340, height: 30, backgroundColor: '#09090b', borderRadius: 8, border: '1px solid #27272a', color: '#d4d4d8', fontSize: 13, fontWeight: 500 }}>
                 <div style={{ display: 'flex', color: '#52525b', marginRight: 6 }}>🔒</div> cvin.bio/johndoe
               </div>
               
               {/* Flex Spacer */}
               <div style={{ display: 'flex', width: 80 }} />
             </div>
             
             {/* Real Website Content inside Browser */}
             <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#ffffff', borderTop: '1px solid #27272a' }}>
               <img src={`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://cvin.bio'}/homepage-screenshot.png`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
             </div>
             
          </div>

        </div>
      </div>
    ),
    { ...size }
  );
}
