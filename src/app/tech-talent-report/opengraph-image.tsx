import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export const alt = 'Tech Talent Report 2026 | CVin.Bio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  let jobCount = '19,000+';
  let companyCount = '490+';

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .not('company', 'ilike', '%Gopuff%');
    if (count) {
      jobCount = `${Math.floor(count / 1000).toLocaleString()},000+`;
    }
    const { data: companies } = await supabase
      .from('jobs')
      .select('company')
      .not('company', 'ilike', '%Gopuff%');
    if (companies) {
      const unique = new Set(companies.map((c: { company: string }) => c.company));
      companyCount = `${unique.size}+`;
    }
  } catch {}

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
          CVin.Bio Research / April 2026
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Tech Talent
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Report 2026
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>{jobCount}</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>jobs analyzed</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>{companyCount}</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>companies</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>143%</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>AI role growth YoY</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b' }}>89+</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#71717a' }}>days to fill</div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', width: '100%', height: 4, backgroundColor: '#09090b', borderRadius: 2 }} />
      </div>
    ),
    { ...size }
  );
}
