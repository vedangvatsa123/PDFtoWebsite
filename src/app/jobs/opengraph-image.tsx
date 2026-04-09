import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export const alt = 'CVin.Bio | Tech Job Board';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .not('company', 'ilike', '%Gopuff%');

  let jobsCountText = '17,000+';
  if (count && count >= 1000) {
    jobsCountText = `${Math.floor(count / 1000).toLocaleString()},000+`;
  } else if (count) {
    jobsCountText = `${count}`;
  }

  return new ImageResponse(
    (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#fafafa',
          color: '#09090b', 
          fontFamily: 'sans-serif',
          padding: '80px 100px',
        }}
      >
        {/* Left Side: Title and Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '45%', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 90, fontWeight: 800, letterSpacing: '-0.04em', color: '#09090b', lineHeight: 1.1 }}>
            Job Board
          </div>
          
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 500, color: '#71717a', letterSpacing: '-0.01em', marginTop: 10 }}>
            {jobsCountText} remote tech jobs
          </div>

          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: '#a1a1aa', marginTop: 'auto', marginBottom: 0 }}>
            CVin.Bio
          </div>
        </div>

        {/* Right Side: Grid of Job Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '50%', gap: 16 }}>
          
          <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '48%', backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 18, color: '#71717a', fontWeight: 600 }}>Stripe</div>
              <div style={{ fontSize: 22, color: '#09090b', fontWeight: 700, marginTop: 4 }}>Software Engineer, AI</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', width: '48%', backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 18, color: '#71717a', fontWeight: 600 }}>Airbnb</div>
              <div style={{ fontSize: 22, color: '#09090b', fontWeight: 700, marginTop: 4 }}>Product Manager</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '48%', backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 18, color: '#71717a', fontWeight: 600 }}>Discord</div>
              <div style={{ fontSize: 22, color: '#09090b', fontWeight: 700, marginTop: 4 }}>Senior Data Scientist</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', width: '48%', backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 18, color: '#71717a', fontWeight: 600 }}>OpenAI</div>
              <div style={{ fontSize: 22, color: '#09090b', fontWeight: 700, marginTop: 4 }}>Research Scientist</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '48%', backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 18, color: '#71717a', fontWeight: 600 }}>Figma</div>
              <div style={{ fontSize: 22, color: '#09090b', fontWeight: 700, marginTop: 4 }}>Engineering Manager</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', width: '48%', backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 18, color: '#71717a', fontWeight: 600 }}>Coinbase</div>
              <div style={{ fontSize: 22, color: '#09090b', fontWeight: 700, marginTop: 4 }}>Frontend Developer</div>
            </div>
          </div>

        </div>

      </div>
    ),
    { ...size }
  );
}
