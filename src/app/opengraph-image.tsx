import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CVin.Bio | Turn Your CV into a Website';
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

          {/* Main Title */}
          <div style={{ display: 'flex', fontSize: 80, fontWeight: 800, letterSpacing: '-0.04em', color: '#09090b', lineHeight: 1.1 }}>
            Turn Your CV into a Website.
          </div>

          {/* Expanded Notion-style App Window Mockup */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 1080, height: 500, marginTop: 20, border: '1px solid #e4e4e7', borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: '#ffffff', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)' }}>
             
             {/* Browser Top Bar - Light Theme */}
             <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 130, width: '100%', backgroundColor: '#f4f4f5', borderBottom: '1px solid #e4e4e7' }}>
               {/* Mac Dots */}
               <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14, width: 120 }}>
                 <div style={{ display: 'flex', width: 28, height: 28, borderRadius: 28, backgroundColor: '#ff5f56', border: '2px solid #e0443e' }} />
                 <div style={{ display: 'flex', width: 28, height: 28, borderRadius: 28, backgroundColor: '#ffbd2e', border: '2px solid #dea123' }} />
                 <div style={{ display: 'flex', width: 28, height: 28, borderRadius: 28, backgroundColor: '#27c93f', border: '2px solid #1aab29' }} />
               </div>
               
               {/* Address Bar */}
               <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 740, height: 86, backgroundColor: '#ffffff', borderRadius: 16, border: '3px solid #e4e4e7', color: '#09090b', fontSize: 48, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                 <div style={{ display: 'flex', flexDirection: 'row', color: '#a1a1aa', marginRight: 20, fontSize: 42 }}>🔒</div> cvin.bio/ava
               </div>
               
               {/* Flex Spacer */}
               <div style={{ display: 'flex', width: 120 }} />
             </div>
             
             {/* Real Website Content inside Browser */}
             <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '40px 64px' }}>
               
               {/* Left Column: Profile */}
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '45%', borderRight: '1px solid #e4e4e7', paddingRight: 48 }}>
                 <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=480&h=480&q=80" alt="CVin.Bio profile example" style={{ width: 340, height: 340, borderRadius: 340, border: '2px solid #e4e4e7', objectFit: 'cover' }} />
               </div>
               
               {/* Right Column: Experience */}
               <div style={{ display: 'flex', flexDirection: 'column', width: '55%', paddingLeft: 64, gap: 36, paddingTop: 16 }}>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: '#09090b', letterSpacing: '-0.01em' }}>Senior Engineer @ OpenAI</div>
                   <div style={{ display: 'flex', fontSize: 16, color: '#a1a1aa', fontWeight: 500 }}>2022 — Present</div>
                   <div style={{ display: 'flex', width: '95%', height: 14, borderRadius: 8, backgroundColor: '#f4f4f5', marginTop: 16 }} />
                   <div style={{ display: 'flex', width: '60%', height: 14, borderRadius: 8, backgroundColor: '#f4f4f5', marginTop: 4 }} />
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: '#09090b', letterSpacing: '-0.01em' }}>Software Engineer @ Apple</div>
                   <div style={{ display: 'flex', fontSize: 16, color: '#a1a1aa', fontWeight: 500 }}>2019 — 2022</div>
                   <div style={{ display: 'flex', width: '85%', height: 14, borderRadius: 8, backgroundColor: '#f4f4f5', marginTop: 16 }} />
                 </div>
                 
               </div>
             </div>
             
          </div>

        </div>
      </div>
    ),
    { ...size }
  );
}
