import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const revalidate = 3600;

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

  let jobsCountText = '68,000+';
  if (count) {
    jobsCountText = count.toLocaleString();
  }

  const isBuild = process.env.NEXT_IS_BUILD_PHASE === '1';

  const { data: companies } = await supabase
    .from('jobs')
    .select('company')
    .not('company', 'ilike', '%Gopuff%')
    .limit(isBuild ? 100 : 1000);
    
  let companyCount = '490+';
  if (companies) {
    const unique = new Set(companies.map((c: { company: string }) => c.company));
    companyCount = `${unique.size}+`;
  }

  const cards = [
    { company: 'OpenAI', title: 'Research Scientist' },
    { company: 'Stripe', title: 'Software Engineer' },
    { company: 'Cloudflare', title: 'Engineering Manager' },
    { company: 'Anthropic', title: 'AI Safety Researcher' },
    { company: 'Coinbase', title: 'Backend Engineer' },
    { company: 'Airbnb', title: 'Product Manager' },
  ];

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
          padding: '60px 80px',
          justifyContent: 'space-between',
        }}
      >
        {/* Top: Label */}
        <div style={{ display: 'flex', fontSize: 14, fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
          CVin.Bio
        </div>

        {/* Middle: Title + Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Tech Job Board
          </div>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 500, color: '#71717a', gap: 24 }}>
            <span>{jobsCountText} jobs</span>
            <span style={{ color: '#d4d4d8' }}>·</span>
            <span>{companyCount} companies</span>
            <span style={{ color: '#d4d4d8' }}>·</span>
            <span>Updated daily</span>
          </div>
        </div>

        {/* Bottom: Job card grid — 2 rows × 3 cols */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
            {cards.slice(0, 3).map((c) => (
              <div key={c.company} style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 16, color: '#71717a', fontWeight: 600 }}>{c.company}</div>
                <div style={{ fontSize: 20, color: '#09090b', fontWeight: 700, marginTop: 4 }}>{c.title}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
            {cards.slice(3, 6).map((c) => (
              <div key={c.company} style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 16, color: '#71717a', fontWeight: 600 }}>{c.company}</div>
                <div style={{ fontSize: 20, color: '#09090b', fontWeight: 700, marginTop: 4 }}>{c.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', width: '100%', height: 4, backgroundColor: '#09090b', borderRadius: 2 }} />
      </div>
    ),
    { ...size }
  );
}
