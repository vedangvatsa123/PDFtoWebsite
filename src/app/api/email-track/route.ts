import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'open';
  const cid = searchParams.get('cid') || '';
  const email = searchParams.get('email') || '';
  const url = searchParams.get('url') || '';

  // Store to Supabase (fire-and-forget, don't block response)
  const decodedEmail = decodeURIComponent(email);
  supabase.from('email_events').insert({
    action,
    campaign: cid,
    email: decodedEmail,
    created_at: new Date().toISOString(),
  }).then(() => {}).catch(() => {});

  if (action === 'click' && url) {
    return NextResponse.redirect(url, 302);
  }

  // Return 1x1 transparent GIF for open tracking
  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
