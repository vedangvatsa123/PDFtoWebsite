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
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#e4e4e7', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              CVin.bio
            </div>
          </div>

          {/* Main Title */}
          <div style={{ display: 'flex', fontSize: 88, fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff', lineHeight: 1.1, marginBottom: 24 }}>
            Turn Your CV into a Website.
          </div>
          
          {/* Subtitle */}
          <div style={{ display: 'flex', fontSize: 32, color: '#a1a1aa', fontWeight: 500, letterSpacing: '-0.01em', maxWidth: 850, lineHeight: 1.4, textAlign: 'center' }}>
            AI converts your PDF CV into a stunning, shareable personal portfolio in seconds.
          </div>

          {/* App Window Mockup Graphic */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 900, height: 350, marginTop: 60, borderTop: '2px solid #27272a', borderLeft: '2px solid #27272a', borderRight: '2px solid #27272a', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#09090b', overflow: 'hidden' }}>
             
             {/* Browser Dots */}
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 24px', width: '100%', borderBottom: '1px solid #18181b', backgroundColor: '#09090b' }}>
               <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 14, backgroundColor: '#3f3f46' }} />
               <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 14, backgroundColor: '#3f3f46' }} />
               <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 14, backgroundColor: '#3f3f46' }} />
             </div>
             
             {/* Abstract Content */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: 48, width: '100%' }}>
               <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                 <div style={{ display: 'flex', width: 96, height: 96, borderRadius: 96, backgroundColor: '#27272a' }} />
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ display: 'flex', width: 280, height: 24, borderRadius: 12, backgroundColor: '#ffffff' }} />
                   <div style={{ display: 'flex', width: 180, height: 20, borderRadius: 10, backgroundColor: '#3f3f46' }} />
                 </div>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div style={{ display: 'flex', width: '100%', height: 16, borderRadius: 8, backgroundColor: '#18181b' }} />
                 <div style={{ display: 'flex', width: '92%', height: 16, borderRadius: 8, backgroundColor: '#18181b' }} />
                 <div style={{ display: 'flex', width: '96%', height: 16, borderRadius: 8, backgroundColor: '#18181b' }} />
                 <div style={{ display: 'flex', width: '75%', height: 16, borderRadius: 8, backgroundColor: '#18181b' }} />
               </div>
             </div>
             
          </div>

        </div>
      </div>
    ),
    { ...size }
  );
}
