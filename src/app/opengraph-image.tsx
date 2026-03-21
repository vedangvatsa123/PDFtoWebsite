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
          <div style={{ display: 'flex', fontSize: 80, fontWeight: 800, letterSpacing: '-0.04em', color: '#09090b', lineHeight: 1.1 }}>
            Your professional identity, elevated.
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
             <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '48px 64px' }}>
               
               {/* Left Column: Profile */}
               <div style={{ display: 'flex', flexDirection: 'column', width: '40%', borderRight: '1px solid #e4e4e7', paddingRight: 48, gap: 16 }}>
                 <div style={{ display: 'flex', width: 96, height: 96, borderRadius: 96, backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#a1a1aa' }}>J.D.</div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
                   <div style={{ display: 'flex', fontSize: 38, fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>John Doe</div>
                   <div style={{ display: 'flex', fontSize: 18, color: '#71717a', fontWeight: 500 }}>Lead Software Engineer</div>
                 </div>
                 
                 <div style={{ display: 'flex', fontSize: 14, color: '#a1a1aa', lineHeight: 1.5, marginTop: 12 }}>
                   Building modern web interfaces and scalable backend systems.
                 </div>
                 
                 <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                   <div style={{ display: 'flex', padding: '4px 12px', borderRadius: 100, border: '1px solid #e4e4e7', fontSize: 12, color: '#52525b', fontWeight: 500 }}>React</div>
                   <div style={{ display: 'flex', padding: '4px 12px', borderRadius: 100, border: '1px solid #e4e4e7', fontSize: 12, color: '#52525b', fontWeight: 500 }}>Next.js</div>
                   <div style={{ display: 'flex', padding: '4px 12px', borderRadius: 100, border: '1px solid #e4e4e7', fontSize: 12, color: '#52525b', fontWeight: 500 }}>Go</div>
                 </div>
               </div>
               
               {/* Right Column: Experience */}
               <div style={{ display: 'flex', flexDirection: 'column', width: '60%', paddingLeft: 48, gap: 24, paddingTop: 12 }}>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                   <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#09090b', letterSpacing: '-0.01em' }}>Senior Engineer @ Stripe</div>
                   <div style={{ display: 'flex', fontSize: 14, color: '#a1a1aa' }}>2021 — Present  •  San Francisco</div>
                   <div style={{ display: 'flex', width: '100%', height: 12, borderRadius: 4, backgroundColor: '#f4f4f5', marginTop: 12 }} />
                   <div style={{ display: 'flex', width: '85%', height: 12, borderRadius: 4, backgroundColor: '#f4f4f5', marginTop: 4 }} />
                   <div style={{ display: 'flex', width: '60%', height: 12, borderRadius: 4, backgroundColor: '#f4f4f5', marginTop: 4 }} />
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
                   <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, color: '#09090b', letterSpacing: '-0.01em' }}>Front-End Dev @ Linear</div>
                   <div style={{ display: 'flex', fontSize: 14, color: '#a1a1aa' }}>2018 — 2021  •  Remote</div>
                   <div style={{ display: 'flex', width: '90%', height: 12, borderRadius: 4, backgroundColor: '#f4f4f5', marginTop: 12 }} />
                   <div style={{ display: 'flex', width: '70%', height: 12, borderRadius: 4, backgroundColor: '#f4f4f5', marginTop: 4 }} />
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
