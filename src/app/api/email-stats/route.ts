import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // Count opens per campaign
  const { data: events, error } = await supabase
    .from('email_events')
    .select('action, campaign, email');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate by campaign
  const stats: Record<string, { opens: Set<string>; clicks: Set<string> }> = {};

  for (const e of events || []) {
    if (!stats[e.campaign]) {
      stats[e.campaign] = { opens: new Set(), clicks: new Set() };
    }
    if (e.action === 'open') stats[e.campaign].opens.add(e.email);
    if (e.action === 'click') stats[e.campaign].clicks.add(e.email);
  }

  // Convert Sets to counts
  const result: Record<string, { unique_opens: number; unique_clicks: number }> = {};
  for (const [campaign, data] of Object.entries(stats)) {
    result[campaign] = {
      unique_opens: data.opens.size,
      unique_clicks: data.clicks.size,
    };
  }

  const totalOpens = Object.values(stats).reduce((sum, s) => sum + s.opens.size, 0);
  const totalClicks = Object.values(stats).reduce((sum, s) => sum + s.clicks.size, 0);

  return NextResponse.json({
    total_unique_opens: totalOpens,
    total_unique_clicks: totalClicks,
    campaigns: result,
  });
}
